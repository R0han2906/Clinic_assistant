from typing import List, Optional, Dict, Any
from app.models.patient_request import (
    PatientRequestCreate, PatientRequestResponse, PatientRequestStatus
)
from app.models.patient import PatientCreate
from app.models.appointment import AppointmentCreate, AppointmentResponse
from app.repositories.base import BaseClinicRepository
from app.services.availability_service import AvailabilityService
from app.services.patient_service import PatientService
from app.services.booking_service import BookingService
from app.core.exceptions import (
    ResourceNotFoundError, SlotConflictError, InvalidTransitionError
)

class PatientRequestService:
    """
    Domain service managing patient appointment requests submitted via the
    Patient Request Simulator (and future WhatsApp webhook adapter).
    """

    def __init__(
        self,
        repository: BaseClinicRepository,
        availability_service: Optional[AvailabilityService] = None,
        patient_service: Optional[PatientService] = None,
        booking_service: Optional[BookingService] = None
    ):
        self.repository = repository
        self.availability_service = availability_service or AvailabilityService(repository)
        self.patient_service = patient_service or PatientService(repository)
        self.booking_service = booking_service or BookingService(repository)

    def submit_request(self, request_data: PatientRequestCreate) -> PatientRequestResponse:
        """
        Validates dentist availability for the requested slot, checks patient existence,
        and saves a new pending request.
        """
        # Validate that the dentist exists
        dentist = self.repository.get_dentist(request_data.dentist_id)
        if not dentist or not dentist.is_active:
            raise ResourceNotFoundError("Dentist", request_data.dentist_id)

        # Pre-validate slot availability
        slots = self.availability_service.calculate_available_slots(
            target_date_str=request_data.preferred_date,
            dentist_id=request_data.dentist_id
        )
        is_free = any(
            s.start_time == request_data.preferred_start_time and s.end_time == request_data.preferred_end_time
            for s in slots
        )
        if not is_free:
            raise SlotConflictError(
                f"The requested slot {request_data.preferred_start_time}-{request_data.preferred_end_time} on {request_data.preferred_date} is not available."
            )

        # Match existing patient if phone matches
        if not request_data.patient_id:
            existing = self.patient_service.search_patients(request_data.patient_phone)
            if existing:
                request_data.patient_id = existing[0].patient_id

        return self.repository.create_patient_request(request_data)

    def list_requests(self, status: Optional[str] = None) -> List[PatientRequestResponse]:
        return self.repository.list_patient_requests(status=status)

    def get_request(self, request_id: str) -> PatientRequestResponse:
        req = self.repository.get_patient_request(request_id)
        if not req:
            raise ResourceNotFoundError("PatientRequest", request_id)
        return req

    def approve_request(
        self, request_id: str, review_notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Staff approves a pending request:
        1. Ensures patient profile exists (creates if not).
        2. Books confirmed appointment under lock.
        3. Marks request as APPROVED and associates appointment ID.
        """
        req = self.get_request(request_id)
        if req.status != PatientRequestStatus.PENDING:
            raise InvalidTransitionError(f"Cannot approve request with status '{req.status.value}'.")

        # Ensure patient exists
        patient_id = req.patient_id
        if not patient_id:
            existing = self.patient_service.search_patients(req.patient_phone)
            if existing:
                patient_id = existing[0].patient_id
            else:
                new_pat = self.patient_service.register_patient(PatientCreate(
                    full_name=req.patient_name,
                    phone=req.patient_phone,
                    dob_or_age=req.patient_age or "Unknown",
                    force_create=True
                ))
                patient_id = new_pat.patient_id

        # Book the official appointment
        apt_create = AppointmentCreate(
            patient_id=patient_id,
            dentist_id=req.dentist_id,
            date=req.preferred_date,
            start_time=req.preferred_start_time,
            end_time=req.preferred_end_time,
            reason=req.reason or f"Appointment requested via {req.source}",
            source=req.source.upper(),
            notes=f"Converted from PatientRequest {req.request_id}. Staff notes: {review_notes or 'None'}"
        )
        appointment = self.booking_service.book_appointment(apt_create)

        # Update request status
        notes = review_notes or f"Approved and booked as {appointment.appointment_id}"
        updated_req = self.repository.update_patient_request_status(
            request_id=request_id,
            status=PatientRequestStatus.APPROVED.value,
            review_notes=notes,
            appointment_id=appointment.appointment_id
        )

        return {
            "patient_request": updated_req,
            "appointment": appointment
        }

    def reject_request(
        self, request_id: str, review_notes: Optional[str] = None
    ) -> PatientRequestResponse:
        """
        Staff rejects a pending request with optional notes.
        """
        req = self.get_request(request_id)
        if req.status != PatientRequestStatus.PENDING:
            raise InvalidTransitionError(f"Cannot reject request with status '{req.status.value}'.")

        notes = review_notes or "Rejected by clinic staff."
        return self.repository.update_patient_request_status(
            request_id=request_id,
            status=PatientRequestStatus.REJECTED.value,
            review_notes=notes
        )

    def cancel_request(
        self, request_id: str, reason: Optional[str] = None
    ) -> PatientRequestResponse:
        """
        Patient or staff cancels a request.
        If it was already approved with an associated appointment, cancels that appointment as well.
        """
        req = self.get_request(request_id)
        if req.status == PatientRequestStatus.CANCELLED:
            return req

        if req.appointment_id:
            try:
                self.booking_service.cancel_appointment(
                    req.appointment_id, reason=reason or "Request cancelled by patient"
                )
            except Exception:
                pass

        notes = reason or "Cancelled by patient."
        return self.repository.update_patient_request_status(
            request_id=request_id,
            status=PatientRequestStatus.CANCELLED.value,
            review_notes=notes
        )
