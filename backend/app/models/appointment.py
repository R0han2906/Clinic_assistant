from typing import Optional
from enum import Enum
from pydantic import BaseModel, Field

class AppointmentStatus(str, Enum):
    CONFIRMED = "confirmed"
    PENDING = "pending"
    RESCHEDULED = "rescheduled"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    NO_SHOW = "no_show"

class AppointmentCreate(BaseModel):
    patient_id: str = Field(..., description="Target patient identifier e.g. PAT-000001")
    dentist_id: str = Field(..., description="Selected dentist identifier e.g. DOC-000001")
    date: str = Field(..., description="Appointment date (YYYY-MM-DD)")
    start_time: str = Field(..., description="Start time (HH:MM)")
    end_time: str = Field(..., description="End time (HH:MM)")
    reason: Optional[str] = Field(None, description="Primary reason for visit e.g. Checkup, Toothache")
    notes: Optional[str] = Field(None, description="Additional administrative notes")

class AppointmentReschedule(BaseModel):
    new_dentist_id: Optional[str] = Field(None, description="Optionally switch dentist")
    new_date: str = Field(..., description="New date (YYYY-MM-DD)")
    new_start_time: str = Field(..., description="New start time (HH:MM)")
    new_end_time: str = Field(..., description="New end time (HH:MM)")
    reschedule_reason: Optional[str] = Field(None, description="Reason for rescheduling")

class AppointmentResponse(BaseModel):
    appointment_id: str
    patient_id: str
    patient_name: Optional[str] = None
    patient_phone: Optional[str] = None
    dentist_id: str
    dentist_name: Optional[str] = None
    date: str
    start_time: str
    end_time: str
    status: AppointmentStatus
    reason: Optional[str] = None
    notes: Optional[str] = None
    created_at: str
    updated_at: str
