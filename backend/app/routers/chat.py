import uuid
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import Conversation, ChatMessage, Farmer, Crop, CropImage, ImageAnalysis
from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    ConversationResponse,
    ChatMessageResponse,
    ChatSourceItem,
    ChatAnalyzeImageResponse,
)
from app.schemas.image import CropImageResponse, ImageAnalysisResponse, VisionAnalysisResult
from app.services.cloudinary_service import cloudinary_service
from app.services.rag_service import rag_service
from app.ai.vision_service import vision_service
from app.ai.llm_service import llm_service
from app.ai.context_builder import context_builder
from app.ai.prompts import get_system_prompt, get_vision_explanation_prompt

router = APIRouter(prefix="/chat", tags=["AI Farmer Assistant"])


@router.post("", response_model=ChatResponse)
@router.post("/", response_model=ChatResponse)
async def chat_with_assistant(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    """
    Multilingual AI Farmer Assistant Endpoint.
    Maintains conversation context, queries live farm/crop/weather/mandi intelligence,
    retrieves verified agricultural knowledge (RAG), and returns tailored agronomic guidance.
    """
    user_text = request.message.strip()
    if not user_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chat message cannot be empty."
        )

    # Detect language if not specified or English default
    lang = request.language or "en"
    if lang == "en":
        detected = llm_service.detect_language(user_text)
        if detected != "en":
            lang = detected

    # 1. Retrieve or Create Conversation
    conversation_id = request.conversation_id
    if not conversation_id:
        conversation_id = f"conv_{uuid.uuid4().hex[:12]}"
        conversation = Conversation(
            id=conversation_id,
            farmer_id=request.farmer_id,
            title=user_text[:40] + ("..." if len(user_text) > 40 else ""),
            language=lang,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(conversation)
        db.commit()
    else:
        conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conversation:
            # Create if ID not found
            conversation = Conversation(
                id=conversation_id,
                farmer_id=request.farmer_id,
                title=user_text[:40] + ("..." if len(user_text) > 40 else ""),
                language=lang,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(conversation)
            db.commit()

    # 2. Save User Message
    user_msg = ChatMessage(
        conversation_id=conversation.id,
        role="user",
        content=user_text,
        created_at=datetime.utcnow()
    )
    db.add(user_msg)
    db.commit()

    # 3. Retrieve Recent History for Conversational Context (Limit to last 8 messages)
    history_records = (
        db.query(ChatMessage)
        .filter(ChatMessage.conversation_id == conversation.id)
        .order_by(ChatMessage.created_at.asc())
        .limit(8)
        .all()
    )
    llm_messages = [{"role": msg.role, "content": msg.content} for msg in history_records]

    # 4. Determine crop hint for RAG if farmer has crops
    crop_hint = None
    farmer_crop = db.query(Crop).filter(Crop.farmer_id == request.farmer_id).first()
    if farmer_crop:
        crop_hint = farmer_crop.crop_name

    # 5. Retrieve Grounded Research & Evidence (RAG Layer)
    rag_context, sources = await rag_service.get_grounded_context(
        db=db,
        query=user_text,
        crop_hint=crop_hint,
        language=lang,
        has_image=False
    )

    # 6. Assemble Farmer & Farm Context
    farm_context = context_builder.build_context(db, farmer_id=request.farmer_id)
    system_prompt = get_system_prompt(
        language_code=lang,
        farm_context=farm_context,
        rag_context=rag_context
    )

    # 7. Generate Response via LLM Service
    try:
        reply_text = await llm_service.generate_response(
            messages=llm_messages,
            system_prompt=system_prompt,
            language=lang
        )
    except Exception as exc:
        reply_text = llm_service._generate_fallback_response(llm_messages, language=lang, error_context=str(exc))

    # 8. Save Assistant Response
    asst_msg = ChatMessage(
        conversation_id=conversation.id,
        role="assistant",
        content=reply_text,
        created_at=datetime.utcnow()
    )
    db.add(asst_msg)
    conversation.updated_at = datetime.utcnow()
    db.commit()

    return ChatResponse(
        reply=reply_text,
        language=lang,
        conversation_id=conversation.id,
        sources=sources
    )


@router.post("/analyze-image", response_model=ChatAnalyzeImageResponse)
async def analyze_crop_image_chat(
    image: UploadFile = File(...),
    message: Optional[str] = Form(None),
    language: Optional[str] = Form("en"),
    conversation_id: Optional[str] = Form(None),
    farmer_id: Optional[int] = Form(1),
    crop_id: Optional[int] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Multimodal Crop Image Analysis Chat Endpoint.
    1. Validates & uploads image via Cloudinary (or local fallback).
    2. Runs Vision AI inspection (symptoms, crop, possible issues, confidence).
    3. Retrieves verified RAG agronomic evidence for detected symptoms & crop.
    4. Merges vision findings with farm/crop/weather/market context.
    5. Generates a natural multilingual LLM explanation in the selected language.
    6. Saves conversation history with image attachment and structured analysis.
    """
    # 1. Read file bytes for validation & processing
    file_bytes = await image.read()
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No image data received or file is empty."
        )

    # 2. Upload via Cloudinary service
    upload_res = await cloudinary_service.upload_image(
        file_bytes=file_bytes,
        filename=image.filename or "crop_image.jpg",
        content_type=image.content_type or "image/jpeg",
        farmer_id=farmer_id or 1,
        folder="crop-analysis"
    )

    # 3. Create CropImage DB Record
    crop_image = CropImage(
        farmer_id=farmer_id,
        crop_id=crop_id,
        conversation_id=conversation_id,
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

    # 4. Fetch crop name hint if crop_id is provided
    crop_hint = None
    if crop_id:
        crop_obj = db.query(Crop).filter(Crop.id == crop_id).first()
        if crop_obj:
            crop_hint = crop_obj.crop_name

    # 5. Run Vision AI Inspection
    vision_result: VisionAnalysisResult = await vision_service.inspect_image(
        image_bytes=file_bytes,
        mime_type=upload_res["mime_type"],
        filename=upload_res["original_filename"],
        crop_hint=crop_hint
    )

    # 6. Save ImageAnalysis record
    image_analysis = ImageAnalysis(
        image_id=crop_image.id,
        detected_crop=vision_result.detected_crop,
        observed_symptoms=vision_result.observed_symptoms,
        possible_issues=[issue.model_dump() for issue in vision_result.possible_issues],
        confidence=vision_result.overall_confidence,
        analysis_text=f"Observed: {', '.join(vision_result.observed_symptoms)}. Image Quality: {vision_result.image_quality}.",
        recommendations=vision_result.recommendations,
        model_name="gemini-1.5-flash-vision",
        created_at=datetime.utcnow()
    )
    db.add(image_analysis)
    db.commit()
    db.refresh(image_analysis)

    # 7. Setup or retrieve Conversation
    lang = language or "en"
    user_text = (message or "").strip()
    if not user_text:
        user_text = f"Analyzing crop image: {upload_res['original_filename']}"

    if not conversation_id:
        conv_id = f"conv_{uuid.uuid4().hex[:12]}"
        conversation = Conversation(
            id=conv_id,
            farmer_id=farmer_id,
            title=f"Crop Inspection ({vision_result.detected_crop or 'Plant'})",
            language=lang,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(conversation)
        db.commit()
    else:
        conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conversation:
            conv_id = conversation_id
            conversation = Conversation(
                id=conv_id,
                farmer_id=farmer_id,
                title=f"Crop Inspection ({vision_result.detected_crop or 'Plant'})",
                language=lang,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(conversation)
            db.commit()
        else:
            conv_id = conversation.id

    crop_image.conversation_id = conv_id
    db.commit()

    # 8. Save User Chat Message with image attachment
    user_msg = ChatMessage(
        conversation_id=conv_id,
        role="user",
        content=user_text,
        image_url=crop_image.image_url,
        image_id=crop_image.id,
        created_at=datetime.utcnow()
    )
    db.add(user_msg)
    db.commit()

    # 9. Build Farm & Agronomic Context & Retrieve RAG Grounding
    farm_context = context_builder.build_context(db, farmer_id=farmer_id)
    rag_query = f"{vision_result.detected_crop or ''} {' '.join(vision_result.observed_symptoms)} {user_text}"
    rag_context, sources = await rag_service.get_grounded_context(
        db=db,
        query=rag_query,
        crop_hint=vision_result.detected_crop or crop_hint,
        language=lang,
        has_image=True
    )

    # 10. Generate Multilingual Farmer Explanation via LLM
    explanation_system_prompt = get_vision_explanation_prompt(
        vision_result=vision_result.model_dump(),
        language_code=lang,
        farm_context=farm_context,
        rag_context=rag_context,
        user_question=message
    )

    try:
        reply_text = await llm_service.generate_response(
            messages=[{"role": "user", "content": user_text}],
            system_prompt=explanation_system_prompt,
            language=lang
        )
    except Exception as exc:
        # Graceful fallback explanation if LLM explanation fails
        crop_display = vision_result.detected_crop or "Crop"
        symptoms_str = "\n• ".join(vision_result.observed_symptoms) if vision_result.observed_symptoms else "No severe symptoms visually detected"
        issues_str = "\n• ".join([f"{i.name} (~{int(i.confidence*100)}% visual match)" for i in vision_result.possible_issues]) if vision_result.possible_issues else "None visible"
        recs_str = "\n• ".join(vision_result.recommendations) if vision_result.recommendations else "Continue routine monitoring"
        
        reply_text = (
            f"**Visual Assessment Results ({crop_display})**\n\n"
            f"**Observed Symptoms:**\n• {symptoms_str}\n\n"
            f"**Possible Issues:**\n• {issues_str}\n\n"
            f"**What to Check / Next Steps:**\n• {recs_str}\n\n"
            f"*(Note: AI explanation service is currently busy. {vision_result.disclaimer})*"
        )

    # 11. Save Assistant Response
    asst_msg = ChatMessage(
        conversation_id=conv_id,
        role="assistant",
        content=reply_text,
        created_at=datetime.utcnow()
    )
    db.add(asst_msg)
    conversation.updated_at = datetime.utcnow()
    db.commit()

    # 12. Return full structured response
    return ChatAnalyzeImageResponse(
        reply=reply_text,
        language=lang,
        conversation_id=conv_id,
        image=CropImageResponse.model_validate(crop_image),
        analysis=ImageAnalysisResponse.model_validate(image_analysis),
        sources=sources
    )


@router.get("/conversations", response_model=List[ConversationResponse])
def get_farmer_conversations(
    farmer_id: Optional[int] = 1,
    db: Session = Depends(get_db)
):
    """
    List all advisory conversations for a farmer.
    """
    conversations = (
        db.query(Conversation)
        .filter(Conversation.farmer_id == farmer_id)
        .order_by(Conversation.updated_at.desc())
        .all()
    )
    return conversations


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
def get_conversation_history(
    conversation_id: str,
    db: Session = Depends(get_db)
):
    """
    Get full message transcript of a conversation.
    """
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation {conversation_id} not found."
        )
    return conversation


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(
    conversation_id: str,
    db: Session = Depends(get_db)
):
    """
    Delete a conversation and its messages.
    """
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation {conversation_id} not found."
        )
    db.delete(conversation)
    db.commit()
    return None
