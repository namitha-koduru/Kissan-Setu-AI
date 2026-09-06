from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict


class KnowledgeCategoryEnum(str, Enum):
    DISEASE_PEST_MANAGEMENT = "DISEASE_PEST_MANAGEMENT"
    CROP_PRACTICES = "CROP_PRACTICES"
    SOIL_HEALTH = "SOIL_HEALTH"
    IRRIGATION_WATER = "IRRIGATION_WATER"
    POST_HARVEST_STORAGE = "POST_HARVEST_STORAGE"
    WEATHER_RISK_MANAGEMENT = "WEATHER_RISK_MANAGEMENT"


class KnowledgeChunkResponse(BaseModel):
    id: int
    document_id: int
    chunk_index: int
    content: str
    language: str
    category: str
    crop: Optional[str] = None
    region: str
    similarity_score: Optional[float] = None
    document_title: Optional[str] = None
    source_name: Optional[str] = None
    source_type: Optional[str] = None
    source_url: Optional[str] = None
    authority: Optional[str] = None
    last_verified_at: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class KnowledgeDocumentResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    source_name: str
    source_type: str
    source_url: Optional[str] = None
    authority: str
    language: str
    category: str
    crop: Optional[str] = None
    region: str
    published_date: Optional[str] = None
    last_verified_at: Optional[str] = None
    is_active: bool
    total_chunks: Optional[int] = 0
    chunks: Optional[List[KnowledgeChunkResponse]] = None
    model_config = ConfigDict(from_attributes=True)


class KnowledgeSearchResultItem(BaseModel):
    chunk_id: int
    document_id: int
    document_title: str
    source_name: str
    authority: str
    source_url: Optional[str] = None
    category: str
    crop: Optional[str] = None
    region: Optional[str] = None
    content: str
    similarity_score: float
    last_verified_at: Optional[str] = None


class KnowledgeSearchRequest(BaseModel):
    query: str
    crop: Optional[str] = None
    category: Optional[str] = None
    language: Optional[str] = "en"
    top_k: Optional[int] = 4
    min_similarity: Optional[float] = 0.65


class KnowledgeSearchResponse(BaseModel):
    query: str
    total_results: int
    results: List[KnowledgeSearchResultItem]
