from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, ConfigDict, Field


class PossibleIssue(BaseModel):
    name: str
    confidence: float = Field(..., ge=0.0, le=1.0)


class VisionAnalysisResult(BaseModel):
    detected_crop: Optional[str] = None
    image_quality: str = "good"  # "good", "fair", "poor"
    observed_symptoms: List[str] = Field(default_factory=list)
    possible_issues: List[PossibleIssue] = Field(default_factory=list)
    overall_confidence: float = Field(0.85, ge=0.0, le=1.0)
    recommendations: List[str] = Field(default_factory=list)
    disclaimer: str = "This is a visual agricultural assessment, not a definitive laboratory diagnosis. Confirm with local KVK experts if symptoms spread."


class CropImageResponse(BaseModel):
    id: str
    farmer_id: Optional[int] = None
    crop_id: Optional[int] = None
    conversation_id: Optional[str] = None
    image_url: str
    cloudinary_public_id: Optional[str] = None
    original_filename: Optional[str] = None
    mime_type: str
    file_size: Optional[int] = None
    width: Optional[int] = None
    height: Optional[int] = None
    uploaded_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ImageAnalysisResponse(BaseModel):
    id: int
    image_id: str
    detected_crop: Optional[str] = None
    image_quality: str = "good"
    observed_symptoms: List[str] = Field(default_factory=list)
    possible_issues: List[PossibleIssue] = Field(default_factory=list)
    confidence: Optional[float] = None
    analysis_text: Optional[str] = None
    recommendations: List[str] = Field(default_factory=list)
    model_name: str = "gemini-1.5-flash"
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class CropImageAnalyzeResponse(BaseModel):
    image_url: str
    storage_type: str = "local"  # "cloudinary" or "local"
    detected_crop: Optional[str] = None
    image_quality: str = "good"
    crop_health: str = "Healthy (Visible growth standard)"
    observed_symptoms: List[str] = Field(default_factory=list)
    possible_issues: List[PossibleIssue] = Field(default_factory=list)
    confidence: float = 0.85
    recommendations: List[str] = Field(default_factory=list)
    when_to_recheck: str = "Re-inspect in 3–5 days or following next irrigation/spraying"
    disclaimer: str = "Visual agricultural observation, not a laboratory diagnosis."
