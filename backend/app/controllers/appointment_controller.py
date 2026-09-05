from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status, Body
from app.models.appointment import (
    AppointmentCreate, AppointmentReschedule, AppointmentResponse, AppointmentStatus,
    PaymentStatusUpdate, PaymentReminderResponse
)
from app.services import get_booking_service, BookingService

router = APIRouter(prefix="/appointments", tags=["Appointments"])

@router.get("", response_model=List[AppointmentResponse])
def list_appointments(
    date: Optional[str] = Query(None, description="Filter by date (YYYY-MM-DD)"),
    dentist_id: Optional[str] = Query(None, description="Filter by dentist identifier"),
    patient_id: Optional[str] = Query(None, description="Filter by patient identifier"),
    status_filter: Optional[AppointmentStatus] = Query(None, alias="status", description="Filter by status"),
    booking_service: BookingService = Depends(get_booking_service)
):
    """Lists appointments matching the given filters, sorted by date and start time."""
    return booking_service.list_appointments(
        date=date,
        dentist_id=dentist_id,
        patient_id=patient_id,
        status=status_filter
    )

@router.get("/today", response_model=List[AppointmentResponse])
def get_today_appointments(
    booking_service: BookingService = Depends(get_booking_service)
):
    """Retrieves all appointments scheduled for today."""
    from datetime import date as dt_date
    today_str = dt_date.today().isoformat()
    return booking_service.list_appointments(date=today_str)

@router.get("/{appointment_id}", response_model=AppointmentResponse)
def get_appointment(
    appointment_id: str,
    booking_service: BookingService = Depends(get_booking_service)
):
    """Retrieves appointment details by identifier (e.g. APT-000001)."""
    return booking_service.get_appointment_by_id(appointment_id)

@router.post("", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
def book_appointment(
    appointment_data: AppointmentCreate,
    booking_service: BookingService = Depends(get_booking_service)
):
    """
    Books an appointment range.
    Performs conflict double-checks under atomic workbook lock.
    """
    return booking_service.book_appointment(appointment_data)

@router.post("/{appointment_id}/reschedule", response_model=AppointmentResponse)
def reschedule_appointment(
    appointment_id: str,
    reschedule_data: AppointmentReschedule,
    booking_service: BookingService = Depends(get_booking_service)
):
    """
    Reschedules an existing appointment to a new date/time range.
    Ensures old slot is retained if the new slot cannot be secured.
    """
    return booking_service.reschedule_appointment(appointment_id, reschedule_data)

@router.post("/{appointment_id}/cancel", response_model=AppointmentResponse)
def cancel_appointment(
    appointment_id: str,
    reason: Optional[str] = Body(None, embed=True, description="Reason for cancellation"),
    booking_service: BookingService = Depends(get_booking_service)
):
    """Cancels an appointment and records audit reason."""
    return booking_service.cancel_appointment(appointment_id, reason=reason)

@router.post("/{appointment_id}/complete", response_model=AppointmentResponse)
def complete_appointment(
    appointment_id: str,
    notes: Optional[str] = Body(None, embed=True, description="Completion notes"),
    booking_service: BookingService = Depends(get_booking_service)
):
    """Marks an appointment as completed."""
    return booking_service.complete_appointment(appointment_id, notes=notes)

@router.patch("/{appointment_id}/payment", response_model=AppointmentResponse)
def update_payment(
    appointment_id: str,
    payload: PaymentStatusUpdate,
    booking_service: BookingService = Depends(get_booking_service)
):
    """Updates bill number and payment status (e.g. UNPAID, PAID, WAITING_PAYMENT)."""
    return booking_service.update_payment(
        appointment_id=appointment_id,
        payment_status=payload.payment_status,
        bill_number=payload.bill_number
    )

@router.post("/{appointment_id}/remind-payment", response_model=PaymentReminderResponse)
def remind_payment(
    appointment_id: str,
    booking_service: BookingService = Depends(get_booking_service)
):
    """
    Triggers a payment reminder to the patient's phone/email for unpaid bills.
    Records the reminder event in the audit log.
    """
    return booking_service.send_payment_reminder(appointment_id)

