from typing import List, Optional
from datetime import datetime
from app.repositories.base import BaseClinicRepository
from app.models.appointment import AppointmentCreate, AppointmentReschedule, AppointmentResponse, AppointmentStatus
from app.core.exceptions import ResourceNotFoundError, SlotConflictError

class BookingService:
    def __init__(self, repository: BaseClinicRepository):
        self.repository = repository

    def list_appointments(
        self,
        date: Optional[str] = None,
        dentist_id: Optional[str] = None,
        patient_id: Optional[str] = None,
        status: Optional[AppointmentStatus] = None
    ) -> List[AppointmentResponse]:
        return self.repository.list_appointments(
            date=date,
            dentist_id=dentist_id,
            patient_id=patient_id,
            status=status
        )

    def get_appointment_by_id(self, appointment_id: str) -> AppointmentResponse:
        apt = self.repository.get_appointment(appointment_id)
        if not apt:
            raise ResourceNotFoundError("Appointment", appointment_id)
        return apt

    def book_appointment(self, appointment_data: AppointmentCreate) -> AppointmentResponse:
        """
        Validates patient and dentist existence, then delegates to repository's atomic create.
        """
        patient = self.repository.get_patient(appointment_data.patient_id)
        if not patient:
            raise ResourceNotFoundError("Patient", appointment_data.patient_id)

        dentist = self.repository.get_dentist(appointment_data.dentist_id)
        if not dentist:
            raise ResourceNotFoundError("Dentist", appointment_data.dentist_id)

        return self.repository.create_appointment(appointment_data)

    def cancel_appointment(self, appointment_id: str, reason: Optional[str] = None) -> AppointmentResponse:
        apt = self.repository.get_appointment(appointment_id)
        if not apt:
            raise ResourceNotFoundError("Appointment", appointment_id)

        updated = self.repository.update_appointment_status(
            appointment_id=appointment_id,
            new_status=AppointmentStatus.CANCELLED,
            notes=f"Cancelled. Reason: {reason}" if reason else "Cancelled by staff"
        )
        if not updated:
            raise ResourceNotFoundError("Appointment", appointment_id)
        return updated

    def reschedule_appointment(self, appointment_id: str, reschedule_data: AppointmentReschedule) -> AppointmentResponse:
        apt = self.repository.get_appointment(appointment_id)
        if not apt:
            raise ResourceNotFoundError("Appointment", appointment_id)

        if reschedule_data.new_dentist_id:
            dentist = self.repository.get_dentist(reschedule_data.new_dentist_id)
            if not dentist:
                raise ResourceNotFoundError("Dentist", reschedule_data.new_dentist_id)

        updated = self.repository.reschedule_appointment(
            appointment_id=appointment_id,
            new_date=reschedule_data.new_date,
            new_start_time=reschedule_data.new_start_time,
            new_end_time=reschedule_data.new_end_time,
            new_dentist_id=reschedule_data.new_dentist_id,
            notes=reschedule_data.reschedule_reason
        )
        if not updated:
            raise ResourceNotFoundError("Appointment", appointment_id)
        return updated

    def complete_appointment(self, appointment_id: str, notes: Optional[str] = None) -> AppointmentResponse:
        updated = self.repository.update_appointment_status(
            appointment_id=appointment_id,
            new_status=AppointmentStatus.COMPLETED,
            notes=notes
        )
        if not updated:
            raise ResourceNotFoundError("Appointment", appointment_id)
        return updated
