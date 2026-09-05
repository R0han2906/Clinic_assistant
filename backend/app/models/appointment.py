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
    REGISTERED = "registered"
    FINISHED = "finished"
    WAITING_PAYMENT = "waiting_payment"

class AppointmentCreate(BaseModel):
    patient_id: str = Field(..., description="Target patient identifier e.g. PAT-000001")
    dentist_id: str = Field(..., description="Selected dentist identifier e.g. DOC-000001")
    date: str = Field(..., description="Appointment date (YYYY-MM-DD)")
    start_time: str = Field(..., description="Start time (HH:MM)")
    end_time: str = Field(..., description="End time (HH:MM)")
    treatment_name: Optional[str] = Field("General Checkup", description="Selected dental treatment e.g. Tooth Scaling, Bleaching, Extraction")
    source: Optional[str] = Field("MANUAL APPOINTMENT", description="Booking source: MANUAL APPOINTMENT, ONLINE, SIMULATOR, WHATSAPP")
    payment_status: Optional[str] = Field("UNPAID", description="Payment status e.g. UNPAID, PAID, WAITING_PAYMENT")
    bill_number: Optional[str] = Field(None, description="Generated bill reference e.g. Bill #10102")
    clinical_notes: Optional[str] = Field(None, description="Concise clinical summary banner shown in drawer")
    reason: Optional[str] = Field(None, description="Primary reason for visit e.g. Checkup, Toothache")
    notes: Optional[str] = Field(None, description="Additional administrative notes")

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
    created_at: str
    updated_at: str
