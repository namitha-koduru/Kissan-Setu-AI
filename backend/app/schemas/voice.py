from typing import Optional, List
from pydantic import BaseModel
from app.schemas.chat import ChatSourceItem


class AudioInfo(BaseModel):
    available: bool = True
    url: Optional[str] = None
    mime_type: str = "audio/mpeg"
    duration_seconds: Optional[float] = None


class TranscriptionResponse(BaseModel):
    transcript: str
    language: str
    confidence: str = "high"
    duration_seconds: Optional[float] = None


class VoiceChatResponse(BaseModel):
    transcript: str
    response: str
    audio: AudioInfo
    language: str
    conversation_id: str
    message_id: Optional[int] = None
    sources: List[ChatSourceItem] = []


class TTSRequest(BaseModel):
    text: str
    language: Optional[str] = "en"
    speed: Optional[str] = "normal"  # "normal" or "slow"


class TTSResponse(BaseModel):
    available: bool
    url: Optional[str] = None
    mime_type: str = "audio/mpeg"
    language: str = "en"
    duration_seconds: Optional[float] = None
