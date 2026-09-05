from typing import Optional
from pydantic import BaseModel, Field

class VisitCreate(BaseModel):
    patient_id: str = Field(..., description="Target patient stable identifier e.g. PAT-000001")
    visit_date: str = Field(..., description="Date of visit (YYYY-MM-DD)")
    dentist_id: str = Field(..., description="Treating dentist stable identifier e.g. DOC-000001")
    visit_type: str = Field(..., description="Type of visit (e.g., Routine Checkup, Cleaning, Extraction, Consultation)")
    summary: str = Field(..., min_length=1, description="Concise administrative summary of visit")
    follow_up_recommendation: Optional[str] = Field(None, description="Optional recommended follow-up date or instruction")

class VisitResponse(VisitCreate):
    visit_id: str
    dentist_name: Optional[str] = None
    created_at: str
