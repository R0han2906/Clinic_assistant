from typing import Optional, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field, field_validator

class AppointmentStatus(str, Enum):
    # Canonical 7 states (Zendenta v3)
    SCHEDULED = "scheduled"
    CHECKED_IN = "checked-in"
    IN_PROGRESS = "in-progress"
    COMPLETED = "completed"
    PAID = "paid"
    CANCELLED = "cancelled"
    NO_SHOW = "no-show"

    # Underscored variants
    CHECKED_IN_UNDERSCORE = "checked_in"
    IN_PROGRESS_UNDERSCORE = "in_progress"
    NO_SHOW_UNDERSCORE = "no_show"

    # Legacy aliases
    CONFIRMED = "confirmed"
    PENDING = "pending"
    RESCHEDULED = "rescheduled"
    REGISTERED = "registered"
    FINISHED = "finished"
    WAITING_PAYMENT = "waiting_payment"

def normalize_status_string(val: Any) -> str:
    """Normalizes any status representation into a valid AppointmentStatus string value."""
    if not val:
        return AppointmentStatus.CONFIRMED.value
    # If val is an Enum instance or has a .value attribute
    if hasattr(val, "value"):
        raw_val = str(val.value)
    else:
        raw_val = str(val)

    # Clean string if formatted as Enum member representation e.g. "AppointmentStatus.CONFIRMED"
    if "AppointmentStatus." in raw_val:
        raw_val = raw_val.split(".")[-1]

    clean = raw_val.strip().lower()

    # Normalize underscore / hyphen variants
    if clean in ("checked_in", "checked-in"):
        return AppointmentStatus.CHECKED_IN.value
    if clean in ("in_progress", "in-progress"):
        return AppointmentStatus.IN_PROGRESS.value
    if clean in ("no_show", "no-show"):
        return AppointmentStatus.NO_SHOW.value
    if clean in ("waiting_payment", "waiting-payment"):
        return AppointmentStatus.WAITING_PAYMENT.value

    return clean


def to_canonical_status(val: Any) -> str:
    """
    Maps legacy and canonical status representations into the canonical 7 states
    for state transitions and availability calculations.
    """
    s = normalize_status_string(val)
    if s in ("confirmed", "registered", "pending", "rescheduled"):
        return AppointmentStatus.SCHEDULED.value
    if s in ("finished", "waiting_payment", "waiting-payment"):
        return AppointmentStatus.COMPLETED.value
    return s

class AppointmentCreate(BaseModel):
    patient_id: str = Field(..., description="Target patient identifier e.g. PAT-000001")
    dentist_id: str = Field(..., description="Selected dentist identifier e.g. DOC-000001 or d1")
    date: str = Field(..., description="Appointment date (YYYY-MM-DD)")
    start_time: str = Field(..., description="Start time (HH:MM)")
    end_time: str = Field(..., description="End time (HH:MM)")
    treatment_name: Optional[str] = Field("General Checkup", description="Selected dental treatment e.g. Tooth Scaling, Bleaching, Extraction")
    source: Optional[str] = Field("MANUAL APPOINTMENT", description="Booking source: MANUAL APPOINTMENT, ONLINE, SIMULATOR, WHATSAPP, WALK_IN")
    status: Optional[str] = Field("confirmed", description="Initial status e.g. confirmed, scheduled, checked-in")
    payment_status: Optional[str] = Field("UNPAID", description="Payment status e.g. UNPAID, PAID, WAITING_PAYMENT")
    bill_number: Optional[str] = Field(None, description="Generated bill reference e.g. Bill #10102")
    clinical_notes: Optional[str] = Field(None, description="Concise clinical summary banner shown in drawer")
    reason: Optional[str] = Field(None, description="Primary reason for visit e.g. Checkup, Toothache")
    notes: Optional[str] = Field(None, description="Additional administrative notes")
    booking_time: Optional[str] = Field(None, description="Exact timestamp when booking was created/recorded")

    @field_validator("status", mode="before")
    @classmethod
    def validate_create_status(cls, v: Any) -> str:
        return normalize_status_string(v)

class AppointmentStatusUpdate(BaseModel):
    status: str = Field(..., description="Target appointment status from canonical 7 states")
    notes: Optional[str] = Field(None, description="Optional transition or audit notes")

    @field_validator("status", mode="before")
    @classmethod
    def validate_status(cls, v: Any) -> str:
        return normalize_status_string(v)

class AppointmentReschedule(BaseModel):
    new_dentist_id: Optional[str] = Field(None, description="Optionally switch dentist")
    new_date: str = Field(..., description="New date (YYYY-MM-DD)")
    new_start_time: str = Field(..., description="New start time (HH:MM)")
    new_end_time: str = Field(..., description="New end time (HH:MM)")
    reschedule_reason: Optional[str] = Field(None, description="Reason for rescheduling")

class PaymentStatusUpdate(BaseModel):
    payment_status: str = Field(..., description="e.g. PAID, UNPAID, WAITING_PAYMENT")
    bill_number: Optional[str] = Field(None, description="e.g. Bill #10102")

class PaymentReminderResponse(BaseModel):
    appointment_id: str
    patient_id: str
    patient_name: Optional[str]
    patient_phone: Optional[str]
    bill_number: Optional[str]
    amount_or_status: str
    reminder_sent_at: str
    channel: str = "SMS/WhatsApp Simulator"
    message: str

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
    treatment_name: Optional[str] = "General Checkup"
    source: Optional[str] = "MANUAL APPOINTMENT"
    payment_status: Optional[str] = "UNPAID"
    bill_number: Optional[str] = None
    clinical_notes: Optional[str] = None
    status: AppointmentStatus
    reason: Optional[str] = None
    notes: Optional[str] = None
    booking_time: Optional[str] = None
    visit_summary: Optional[Dict[str, Any]] = None
    created_at: str
    updated_at: str

    @field_validator("status", mode="before")
    @classmethod
    def validate_response_status(cls, v: Any) -> AppointmentStatus:
        norm = normalize_status_string(v)
        try:
            return AppointmentStatus(norm)
        except ValueError:
            # Fallback to confirmed if unknown
            return AppointmentStatus.CONFIRMED
