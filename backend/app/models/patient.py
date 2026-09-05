from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field

class PatientBase(BaseModel):
    full_name: str = Field(..., min_length=1, description="Patient's full legal or preferred name")
    dob_or_age: str = Field(..., description="Date of birth (YYYY-MM-DD) or age in years")
    phone: str = Field(..., min_length=7, description="Primary contact phone number")
    email: Optional[str] = Field(None, description="Optional contact email")
    emergency_contact: Optional[str] = Field(None, description="Optional emergency contact name/phone")
    consent_status: str = Field("acknowledged", description="Clinic policy acknowledgement status")

class PatientCreate(PatientBase):
    force_create: bool = Field(False, description="If true, bypasses duplicate warning and creates new record")

class PatientResponse(PatientBase):
    patient_id: str
    created_at: str
    updated_at: str

class DuplicateCheckResult(BaseModel):
    is_potential_duplicate: bool
    matching_patients: List[PatientResponse] = []
    message: Optional[str] = None
