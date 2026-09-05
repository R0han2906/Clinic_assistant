from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field

class PatientBase(BaseModel):
    full_name: str = Field(..., min_length=1, description="Patient's full legal or preferred name")
    dob_or_age: str = Field(..., description="Date of birth (YYYY-MM-DD) or age in years")
    phone: str = Field(..., min_length=7, description="Primary contact phone number")
    email: Optional[str] = Field(None, description="Optional contact email")
    emergency_contact: Optional[str] = Field(None, description="Optional emergency contact name/phone")
    gender: Optional[str] = Field(None, description="Gender: Male, Female, Other")
    address: Optional[str] = Field(None, description="Full residential street address")
    allergies: Optional[str] = Field(None, description="Known drug or material allergies e.g. Penicillin, Latex")
    medical_conditions: Optional[str] = Field(None, description="Known systemic conditions e.g. Heart Disease, Hepatitis")
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
