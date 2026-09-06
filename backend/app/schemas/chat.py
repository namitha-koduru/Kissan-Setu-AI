from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.image import CropImageResponse, ImageAnalysisResponse, VisionAnalysisResult


class ChatSourceItem(BaseModel):
    title: str
    reference: Optional[str] = None


class ChatAttachment(BaseModel):
    type: str = "image"  # "image", "audio", "document"
    url: Optional[str] = None
    file_name: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="Farmer user message or agronomic query")
    language: Optional[str] = Field("en", description="Language code: en, hi, te, mr, ta, kn, bn, ml")
    conversation_id: Optional[str] = Field(None, description="Existing conversation UUID")
    farmer_id: Optional[int] = Field(1, description="Farmer ID for context personalization")
    attachments: Optional[List[ChatAttachment]] = Field(default_factory=list, description="Future multimodal attachments")


class ChatResponse(BaseModel):
    reply: str
    language: str = "en"
    conversation_id: str
    sources: List[ChatSourceItem] = Field(default_factory=list)
    vision_analysis: Optional[VisionAnalysisResult] = None
    image_url: Optional[str] = None


class ChatMessageResponse(BaseModel):
    id: int
    conversation_id: str
    role: str  # "user", "assistant", "system"
    content: str
    image_url: Optional[str] = None
    image_id: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ConversationResponse(BaseModel):
    id: str
    farmer_id: Optional[int] = None
    title: str
    language: str
    created_at: datetime
    updated_at: datetime
    messages: List[ChatMessageResponse] = Field(default_factory=list)
    model_config = ConfigDict(from_attributes=True)


class ChatAnalyzeImageResponse(BaseModel):
    reply: str
    language: str
    conversation_id: str
    image: CropImageResponse
    analysis: ImageAnalysisResponse
    sources: List[ChatSourceItem] = Field(default_factory=list)
    model_config = ConfigDict(from_attributes=True)
