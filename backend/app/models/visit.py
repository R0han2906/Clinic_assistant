from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class VisitCreate(BaseModel):
    patient_id: str = Field(..., description="Target patient stable identifier e.g. PAT-000001")
    visit_date: str = Field(..., description="Date of visit (YYYY-MM-DD)")
    dentist_id: str = Field(..., description="Treating dentist stable identifier e.g. DOC-000001")
    visit_type: Optional[str] = Field("Routine Checkup", description="Type of visit (e.g. Checkup, Cleaning, Extraction)")
    summary: Optional[str] = Field("Dental checkup completed", description="Concise administrative summary of visit")
    follow_up_recommendation: Optional[str] = Field(None, description="Optional recommended follow-up instruction")
    
    # Structured clinical summary fields for post-appointment reporting
    appointment_id: Optional[str] = Field(None, description="Associated appointment ID e.g. APT-000001")
    chief_complaint: Optional[str] = Field(None, description="Patient chief complaint")
    diagnosis: Optional[str] = Field(None, description="Clinical diagnosis")
    prescriptions: Optional[List[Dict[str, Any]]] = Field(None, description="List of medications, dosage, duration")
    treatments_performed: Optional[List[str]] = Field(None, description="List of procedures conducted")
    follow_up: Optional[Dict[str, Any]] = Field(None, description="Follow-up recommendation object (timeframe, notes)")
    dentist_notes: Optional[str] = Field(None, description="Dentist clinical notes")
    billing: Optional[Dict[str, Any]] = Field(None, description="Itemized billing breakdown and total")

class VisitResponse(VisitCreate):
    visit_id: str
    dentist_name: Optional[str] = None
    created_at: str
