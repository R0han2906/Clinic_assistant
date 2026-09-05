from typing import Optional
from pydantic import BaseModel, Field

class Treatment(BaseModel):
    treatment_id: str = Field(..., description="Unique treatment code e.g. TRT-001")
    name: str = Field(..., description="Procedure name e.g. Tooth Scaling, Bleaching, Extraction")
    category: str = Field("General", description="Category: Preventive, Cosmetic, Surgery, Restorative")
    default_duration_minutes: int = Field(30, description="Standard slot duration in minutes")
    estimated_cost: Optional[float] = Field(None, description="Estimated price in local currency")
    description: Optional[str] = Field(None, description="Clinical procedure details")
