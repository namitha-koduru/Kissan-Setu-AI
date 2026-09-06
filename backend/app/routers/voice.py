import os
import uuid
import logging
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database.models import Conversation, ChatMessage, Farmer, Crop, CropImage, ImageAnalysis
from app.config import settings
from app.schemas.voice import (
    TranscriptionResponse,
    VoiceChatResponse,
    AudioInfo,
    TTSRequest,
    TTSResponse,
)
from app.services.speech_service import speech_service
from app.services.tts_service import tts_service
from app.services.cloudinary_service import cloudinary_service
from app.services.rag_service import rag_service
from app.ai.vision_service import vision_service
from app.ai.llm_service import llm_service
from app.ai.context_builder import context_builder
from app.ai.prompts import get_system_prompt, get_vision_explanation_prompt

logger = logging.getLogger("voice_router")
router = APIRouter(prefix="/voice", tags=["Voice AI & Multilingual Assistant"])



@router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(
    audio: UploadFile = File(...),
    language: Optional[str] = Form("en"),
):
    """
    Speech-to-Text Endpoint.
    Validates audio file size and MIME type, then converts spoken audio to text.
    """
    if not audio:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No audio file provided."
        )

    # 1. Read and validate audio bytes
    audio_bytes = await audio.read()
    if not audio_bytes or len(audio_bytes) < 32:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Audio recording is empty or unreadable. Please speak clearly into the microphone."
        )

    max_bytes = settings.MAX_AUDIO_SIZE_MB * 1024 * 1024
    if len(audio_bytes) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Audio recording exceeds maximum limit of {settings.MAX_AUDIO_SIZE_MB}MB."
        )

    # 2. Transcribe via SpeechService
    mime_type = audio.content_type or "audio/webm"
    result = await speech_service.transcribe(
        audio_bytes=audio_bytes,
        mime_type=mime_type,
        language_hint=language or "en"
    )

    if not result.transcript:
        return TranscriptionResponse(
            transcript="Could not understand audio clearly. Please try speaking again.",
            language=result.language,
            confidence="low",
            duration_seconds=result.duration_seconds
        )

    return TranscriptionResponse(
        transcript=result.transcript,
        language=result.language,
        confidence=result.confidence,
        duration_seconds=result.duration_seconds
    )


@router.post("/chat", response_model=VoiceChatResponse)
async def voice_chat(
    audio: UploadFile = File(...),
    image: Optional[UploadFile] = File(None),
    language: Optional[str] = Form("en"),
    conversation_id: Optional[str] = Form(None),
    farmer_id: Optional[int] = Form(1),
    crop_id: Optional[int] = Form(None),
    db: Session = Depends(get_db)
):
    """
    High-Level Multilingual Voice Chat Endpoint.
    1. Transcribes audio input in farmer's selected language.
    2. Gathers unified farm, weather, soil, mandi, buyer, and transaction context.
    3. If image is attached, runs Vision AI analysis in parallel.
    4. Generates concise, speech-friendly response via LLM.
    5. Persists conversation and message history to PostgreSQL.
    6. Converts response to playable speech (TTS).
    7. Returns transcript, text reply, audio playback URL, and IDs.
    """
    # 1. Validate Audio
    audio_bytes = await audio.read()
    if not audio_bytes or len(audio_bytes) < 32:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No audible speech detected in recording. Please try speaking again."
        )

    max_bytes = settings.MAX_AUDIO_SIZE_MB * 1024 * 1024
    if len(audio_bytes) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Voice recording exceeds {settings.MAX_AUDIO_SIZE_MB}MB size limit."
        )

    lang = language or "en"
    mime_type = audio.content_type or "audio/webm"

    # 2. Convert Speech-to-Text
    stt_res = await speech_service.transcribe(
        audio_bytes=audio_bytes,
        mime_type=mime_type,
        language_hint=lang
    )
    user_transcript = stt_res.transcript.strip()
    if not user_transcript:
        user_transcript = "What farming guidance can you offer for my crop today?"

    # 3. Setup / Retrieve Conversation in PostgreSQL
    conv_id = conversation_id
    if not conv_id:
        conv_id = f"conv_{uuid.uuid4().hex[:12]}"
        conversation = Conversation(
            id=conv_id,
            farmer_id=farmer_id,
            title=f"🎙 {user_transcript[:36]}" + ("..." if len(user_transcript) > 36 else ""),
            language=lang,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(conversation)
        db.commit()
    else:
        conversation = db.query(Conversation).filter(Conversation.id == conv_id).first()
        if not conversation:
            conversation = Conversation(
                id=conv_id,
                farmer_id=farmer_id,
                title=f"🎙 {user_transcript[:36]}" + ("..." if len(user_transcript) > 36 else ""),
                language=lang,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(conversation)
            db.commit()

    # 4. Handle Optional Multimodal Image + Voice Combination
    image_record_id = None
    image_url = None
    vision_system_prompt = None

    if image:
        image_bytes = await image.read()
        if image_bytes and len(image_bytes) >= 32:
            upload_res = await cloudinary_service.upload_image(
                file_bytes=image_bytes,
                filename=image.filename or "voice_crop_photo.jpg",
                content_type=image.content_type or "image/jpeg",
                farmer_id=farmer_id or 1,
                folder="crop-voice-analysis"
            )
            crop_image = CropImage(
                farmer_id=farmer_id,
                crop_id=crop_id,
                conversation_id=conversation.id,
                image_url=upload_res["image_url"],
                cloudinary_public_id=upload_res["cloudinary_public_id"],
                original_filename=upload_res["original_filename"],
                mime_type=upload_res["mime_type"],
                file_size=upload_res["file_size"],
                width=upload_res["width"],
                height=upload_res["height"],
                uploaded_at=datetime.utcnow()
            )
            db.add(crop_image)
            db.commit()
            db.refresh(crop_image)
            image_record_id = crop_image.id
            image_url = crop_image.image_url

            # Run Vision Inspection
            vision_result = await vision_service.inspect_image(
                image_bytes=image_bytes,
                mime_type=upload_res["mime_type"],
                filename=upload_res["original_filename"],
                crop_hint=None
            )
            farm_context = context_builder.build_context(db, farmer_id=farmer_id)
            rag_query = f"{vision_result.detected_crop or ''} {' '.join(vision_result.observed_symptoms)} {user_transcript}"
            rag_context, rag_sources = await rag_service.get_grounded_context(
                db=db,
                query=rag_query,
                crop_hint=vision_result.detected_crop,
                language=lang,
                has_image=True
            )
            vision_system_prompt = get_vision_explanation_prompt(
                vision_result=vision_result.model_dump(),
                language_code=lang,
                farm_context=farm_context,
                rag_context=rag_context,
                user_question=user_transcript
            )

    # 5. Save Farmer's Voice Message Record
    user_msg = ChatMessage(
        conversation_id=conversation.id,
        role="user",
        content=f"🎙 {user_transcript}",
        image_url=image_url,
        image_id=image_record_id,
        created_at=datetime.utcnow()
    )
    db.add(user_msg)
    db.commit()

    # 6. Retrieve RAG if not already retrieved via image
    rag_sources_list = []
    if not image_record_id:
        crop_hint = None
        farmer_crop = db.query(Crop).filter(Crop.farmer_id == farmer_id).first()
        if farmer_crop:
            crop_hint = farmer_crop.crop_name
        rag_context, rag_sources_list = await rag_service.get_grounded_context(
            db=db,
            query=user_transcript,
            crop_hint=crop_hint,
            language=lang,
            has_image=False
        )
    else:
        rag_sources_list = rag_sources

    # 7. Build Farm Context & Generate Concise Voice Response
    farm_context = context_builder.build_context(db, farmer_id=farmer_id)
    system_prompt = vision_system_prompt or get_system_prompt(
        language_code=lang,
        farm_context=farm_context,
        rag_context=rag_context if not image_record_id else "",
        voice_mode=True
    )

    # Recent history for conversational awareness
    history_records = (
        db.query(ChatMessage)
        .filter(ChatMessage.conversation_id == conversation.id)
        .order_by(ChatMessage.created_at.asc())
        .limit(6)
        .all()
    )
    llm_messages = [{"role": msg.role, "content": msg.content} for msg in history_records]

    try:
        reply_text = await llm_service.generate_response(
            messages=llm_messages,
            system_prompt=system_prompt,
            language=lang
        )
    except Exception as exc:
        logger.error(f"LLM voice generation failed: {exc}")
        reply_text = "I could not retrieve live farm recommendations right now. Please check your network connection and try again."

    # 8. Save Assistant Message
    asst_msg = ChatMessage(
        conversation_id=conversation.id,
        role="assistant",
        content=reply_text,
        created_at=datetime.utcnow()
    )
    db.add(asst_msg)
    conversation.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(asst_msg)

    # 9. Convert Text-to-Speech (TTS)
    tts_result = await tts_service.synthesize_speech(
        text=reply_text,
        language=lang,
        speed="normal"
    )

    return VoiceChatResponse(
        transcript=user_transcript,
        response=reply_text,
        audio=AudioInfo(
            available=tts_result.available,
            url=tts_result.url,
            mime_type=tts_result.mime_type,
            duration_seconds=tts_result.duration_seconds
        ),
        language=lang,
        conversation_id=conversation.id,
        message_id=asst_msg.id,
        sources=rag_sources_list
    )



@router.post("/tts", response_model=TTSResponse)
async def text_to_speech(req: TTSRequest):
    """
    Direct Text-to-Speech Generation Endpoint.
    Synthesizes provided text into spoken audio in the specified language.
    """
    if not req.text or not req.text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text for speech synthesis cannot be empty."
        )

    res = await tts_service.synthesize_speech(
        text=req.text,
        language=req.language or "en",
        speed=req.speed or "normal"
    )

    return TTSResponse(
        available=res.available,
        url=res.url,
        mime_type=res.mime_type,
        language=req.language or "en",
        duration_seconds=res.duration_seconds
    )


@router.get("/audio/{audio_id}")
async def get_voice_audio(audio_id: str):
    """Stream generated voice audio file."""
    filepath = tts_service.get_audio_path(audio_id)
    if not filepath or not os.path.exists(filepath):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audio recording not found or has expired."
        )
    return FileResponse(filepath, media_type="audio/mpeg", filename=f"{audio_id}.mp3")
