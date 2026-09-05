from enum import Enum
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class PatientRequestStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CONVERTED = "converted"


class PatientRequestBase(BaseModel):
    patient_name: str = Field(..., min_length=1, description="Patient full name")
    patient_phone: str = Field(..., min_length=7, description="Patient contact phone number")
    patient_age: Optional[str] = Field(None, description="Patient age or DOB")
    dentist_id: str = Field(..., description="Requested dentist ID (e.g. DOC-000001)")
    preferred_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$", description="Preferred date YYYY-MM-DD")
    preferred_start_time: str = Field(..., pattern=r"^\d{2}:\d{2}$", description="Start time HH:MM")
    preferred_end_time: str = Field(..., pattern=r"^\d{2}:\d{2}$", description="End time HH:MM")
    reason: Optional[str] = Field(None, description="Appointment reason or chief complaint")
    source: str = Field("simulator", description="Source of request ('simulator' or 'whatsapp')")


class PatientRequestCreate(PatientRequestBase):
    patient_id: Optional[str] = Field(None, description="Existing patient ID if known")


class PatientRequestReview(BaseModel):
    review_notes: Optional[str] = Field(None, description="Staff comments or rejection reason")


class PatientRequestResponse(PatientRequestBase):
    request_id: str
    patient_id: Optional[str] = None
    status: PatientRequestStatus = PatientRequestStatus.PENDING
    review_notes: Optional[str] = None
    appointment_id: Optional[str] = None
    created_at: str
    updated_at: str
