from typing import Optional
from pydantic import BaseModel, Field

class Treatment(BaseModel):
    treatment_id: str = Field(..., description="Unique treatment code e.g. TRT-000001")
    name: str = Field(..., description="Procedure name e.g. Tooth Scaling, Bleaching, Extraction")
    category: str = Field("General", description="Category: Preventive, Cosmetic, Surgery, Restorative, Endodontics, Prosthodontics")
    default_duration_minutes: int = Field(30, description="Standard slot duration in minutes")
    estimated_cost: Optional[float] = Field(None, description="Estimated price in local currency")
    description: Optional[str] = Field(None, description="Clinical procedure details")

class TreatmentCreate(BaseModel):
    name: str = Field(..., description="Procedure name")
    category: str = Field("General", description="Category")
    default_duration_minutes: int = Field(30, description="Duration in minutes")
    estimated_cost: Optional[float] = Field(None, description="Estimated price")
    description: Optional[str] = Field(None, description="Clinical description")

class TreatmentUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    default_duration_minutes: Optional[int] = None
    estimated_cost: Optional[float] = None
    description: Optional[str] = None

TreatmentResponse = Treatment
