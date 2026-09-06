from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator, ConfigDict


VALID_SOIL_TYPES = [
    "Black",
    "Red",
    "Alluvial",
    "Loamy",
    "Sandy",
    "Clay",
    "Laterite",
    "Other",
]




class SoilProfileBase(BaseModel):
    soil_type: Optional[str] = Field("Black", description="Primary soil classification")
    ph: Optional[float] = Field(None, description="Soil pH value (typically 4.0 - 9.5)")
    nitrogen: Optional[float] = Field(None, description="Available Nitrogen in kg/ha or ppm")
    phosphorus: Optional[float] = Field(None, description="Available Phosphorus in kg/ha or ppm")
    potassium: Optional[float] = Field(None, description="Available Potassium in kg/ha or ppm")
    organic_carbon: Optional[float] = Field(None, description="Organic Carbon percentage (%)")
    moisture: Optional[float] = Field(None, description="Soil moisture percentage (%)")
    source: Optional[str] = Field("Self Reported", description="Source of soil data (e.g. Soil Health Card)")

    @field_validator("ph")
    @classmethod
    def validate_ph(cls, v: Optional[float]) -> Optional[float]:
        if v is not None:
            if v < 3.0 or v > 11.0:
                raise ValueError("Soil pH must be between 3.0 and 11.0")
        return v

    @field_validator("nitrogen", "phosphorus", "potassium", "organic_carbon", "moisture")
    @classmethod
    def validate_non_negative(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v < 0:
            raise ValueError("Nutrient, carbon, and moisture values cannot be negative")
        return v


class SoilProfileCreate(SoilProfileBase):
    farmer_id: Optional[int] = 1


class SoilProfileUpdate(BaseModel):
    soil_type: Optional[str] = None
    ph: Optional[float] = None
    nitrogen: Optional[float] = None
    phosphorus: Optional[float] = None
    potassium: Optional[float] = None
    organic_carbon: Optional[float] = None
    moisture: Optional[float] = None
    source: Optional[str] = None

    @field_validator("ph")
    @classmethod
    def validate_ph(cls, v: Optional[float]) -> Optional[float]:
        if v is not None:
            if v < 3.0 or v > 11.0:
                raise ValueError("Soil pH must be between 3.0 and 11.0")
        return v


class SoilProfileResponse(SoilProfileBase):
    id: int
    farmer_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)



class SoilInterpretationResponse(BaseModel):
    soil_condition: str = Field(..., description="Overall condition e.g. 'neutral', 'slightly_alkaline'")
    ph_status: str = Field(..., description="'strongly_acidic', 'moderately_acidic', 'neutral', 'slightly_alkaline', 'alkaline', or 'unknown'")
    nitrogen_status: str = Field(..., description="'low', 'medium', 'high', or 'unknown'")
    phosphorus_status: str = Field(..., description="'low', 'medium', 'high', or 'unknown'")
    potassium_status: str = Field(..., description="'low', 'medium', 'high', or 'unknown'")
    organic_carbon_status: str = Field(..., description="'low', 'medium', 'high', or 'unknown'")
    moisture_status: str = Field(..., description="'dry', 'adequate', 'saturated', or 'unknown'")
    observations: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    has_data: bool = True
    profile: Optional[SoilProfileResponse] = None
