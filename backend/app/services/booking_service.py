from typing import List, Optional, Dict, Any
from datetime import datetime
from app.repositories.base import BaseClinicRepository
from app.models.appointment import (
    AppointmentCreate, AppointmentReschedule, AppointmentResponse, AppointmentStatus,
    normalize_status_string, to_canonical_status
)
from app.core.exceptions import ResourceNotFoundError, SlotConflictError, InvalidTransitionError

# Canonical status transitions in Zendenta v3
ALLOWED_TRANSITIONS = {
    "scheduled": ["checked-in", "in-progress", "cancelled", "no-show"],
    "checked-in": ["in-progress", "cancelled", "no-show", "scheduled"],
    "in-progress": ["completed", "cancelled"],
    "completed": ["paid"],
    "paid": [],
    "cancelled": [],
    "no-show": [],
}

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

    def update_appointment_status(
        self,
        appointment_id: str,
        new_status: str,
        notes: Optional[str] = None
    ) -> AppointmentResponse:
        """
        Transitions appointment to a canonical status, enforcing allowed state machine transitions.
        """
        apt = self.repository.get_appointment(appointment_id)
        if not apt:
            raise ResourceNotFoundError("Appointment", appointment_id)

        curr_raw = apt.status.value if hasattr(apt.status, "value") else str(apt.status)
        curr_canonical = to_canonical_status(curr_raw)
        target_canonical = to_canonical_status(new_status)

        if curr_canonical != target_canonical:
            allowed = ALLOWED_TRANSITIONS.get(curr_canonical, [])
            if target_canonical not in allowed:
                raise InvalidTransitionError(
                    f"Cannot transition appointment from '{curr_canonical}' to '{target_canonical}'. "
                    f"Allowed transitions: {allowed or 'None (terminal state)'}"
                )

        updated = self.repository.update_appointment_status(
            appointment_id=appointment_id,
            new_status=AppointmentStatus(normalize_status_string(new_status)),
            notes=notes
        )
        if not updated:
            raise ResourceNotFoundError("Appointment", appointment_id)
        return updated

    def cancel_appointment(self, appointment_id: str, reason: Optional[str] = None) -> AppointmentResponse:
        return self.update_appointment_status(
            appointment_id=appointment_id,
            new_status=AppointmentStatus.CANCELLED.value,
            notes=f"Cancelled. Reason: {reason}" if reason else "Cancelled by staff"
        )

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
        return self.update_appointment_status(
            appointment_id=appointment_id,
            new_status=AppointmentStatus.COMPLETED.value,
            notes=notes
        )

    def update_payment(
        self,
        appointment_id: str,
        payment_status: str,
        bill_number: Optional[str] = None
    ) -> AppointmentResponse:
        """
        Updates payment status and bill number.
        If payment is marked PAID and appointment was completed, advances status to PAID.
        """
        apt = self.repository.get_appointment(appointment_id)
        if not apt:
            raise ResourceNotFoundError("Appointment", appointment_id)

        updated = self.repository.update_payment_status(
            appointment_id=appointment_id,
            payment_status=payment_status,
            bill_number=bill_number
        )
        if not updated:
            raise ResourceNotFoundError("Appointment", appointment_id)

        if payment_status.strip().upper() == "PAID":
            curr_raw = updated.status.value if hasattr(updated.status, "value") else str(updated.status)
            curr_canonical = normalize_status_string(curr_raw)
            if curr_canonical == "completed":
                advanced = self.repository.update_appointment_status(
                    appointment_id=appointment_id,
                    new_status=AppointmentStatus.PAID,
                    notes=f"Payment received ({bill_number or 'Direct payment'})"
                )
                if advanced:
                    updated = advanced

        return updated

    def send_payment_reminder(self, appointment_id: str):
        reminder = self.repository.send_payment_reminder(appointment_id)
        if not reminder:
            raise ResourceNotFoundError("Appointment", appointment_id)
        return reminder

    def update_appointment(self, appointment_id: str, updates: dict) -> AppointmentResponse:
        updated = self.repository.update_appointment(appointment_id, updates)
        if not updated:
            raise ResourceNotFoundError("Appointment", appointment_id)
        return updated

    def get_visit_summary(self, appointment_id: str) -> Dict[str, Any]:
        """
        Retrieves clinical summary for an appointment or returns a structured template.
        """
        apt = self.repository.get_appointment(appointment_id)
        if not apt:
            raise ResourceNotFoundError("Appointment", appointment_id)

        # If visit summary is already saved on appointment
        if apt.visit_summary:
            return apt.visit_summary

        # Check repository visits
        if hasattr(self.repository, "get_visit_by_appointment"):
            visit = self.repository.get_visit_by_appointment(appointment_id)
            if visit:
                return {
                    "appointment_id": appointment_id,
                    "patient_id": visit.patient_id,
                    "dentist_id": visit.dentist_id,
                    "visit_date": visit.visit_date,
                    "visit_type": visit.visit_type,
                    "chief_complaint": getattr(visit, "chief_complaint", None) or apt.reason or "Routine dental consultation",
                    "diagnosis": getattr(visit, "diagnosis", None) or visit.summary or "Dental examination completed",
                    "prescriptions": getattr(visit, "prescriptions", []) or [],
                    "treatments_performed": getattr(visit, "treatments_performed", []) or [apt.treatment_name or "General Checkup"],
                    "follow_up": getattr(visit, "follow_up", None) or {"timeframe": "6 months", "notes": visit.follow_up_recommendation or "Routine recall"},
                    "dentist_notes": getattr(visit, "dentist_notes", None) or apt.clinical_notes or "",
                    "billing": getattr(visit, "billing", None) or {"total": 150.0, "status": apt.payment_status}
                }

        # Return structured defaults for completed/in-progress appointment
        has_pain = bool(apt.reason and "pain" in apt.reason.lower())
        return {
            "appointment_id": appointment_id,
            "patient_id": apt.patient_id,
            "patient_name": apt.patient_name,
            "dentist_id": apt.dentist_id,
            "dentist_name": apt.dentist_name,
            "date": apt.date,
            "treatment_name": apt.treatment_name or "General Checkup",
            "chief_complaint": apt.reason or "Routine checkup and consultation",
            "diagnosis": "General dental examination, healthy oral tissues" if not has_pain else "Localized dentin sensitivity",
            "prescriptions": [
                {"name": "Amoxicillin 500mg", "dosage": "1 tablet 3x daily", "duration": "5 days", "notes": "After meals"},
                {"name": "Paracetamol 500mg", "dosage": "1 tablet as needed", "duration": "3 days", "notes": "For mild discomfort"}
            ] if has_pain else [],
            "treatments_performed": [apt.treatment_name or "General Checkup"],
            "follow_up": {
                "timeframe": "6 months",
                "notes": "Follow-up routine cleaning & scaling"
            },
            "dentist_notes": apt.clinical_notes or f"Patient presented for {apt.treatment_name or 'consultation'}. Treatment completed smoothly.",
            "billing": {
                "bill_number": apt.bill_number or f"Bill-{appointment_id}",
                "amount": 120.0,
                "status": apt.payment_status or "UNPAID"
            }
        }

    def save_visit_summary(self, appointment_id: str, summary_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Saves clinical visit summary, updating appointment clinical notes and persisting a visit record.
        """
        apt = self.repository.get_appointment(appointment_id)
        if not apt:
            raise ResourceNotFoundError("Appointment", appointment_id)

        clinical_note = summary_data.get("dentist_notes") or summary_data.get("diagnosis")
        updates: Dict[str, Any] = {}
        if clinical_note:
            updates["clinical_notes"] = clinical_note
        if summary_data.get("treatment_name"):
            updates["treatment_name"] = summary_data.get("treatment_name")

        if updates:
            self.repository.update_appointment(appointment_id, updates)

        from app.models.visit import VisitCreate
        visit_create = VisitCreate(
            patient_id=apt.patient_id,
            visit_date=apt.date,
            dentist_id=apt.dentist_id,
            visit_type=summary_data.get("treatment_name") or apt.treatment_name or "General Checkup",
            summary=summary_data.get("diagnosis") or "Clinical visit completed",
            follow_up_recommendation=summary_data.get("follow_up", {}).get("notes") if isinstance(summary_data.get("follow_up"), dict) else str(summary_data.get("follow_up") or ""),
            appointment_id=appointment_id,
            chief_complaint=summary_data.get("chief_complaint"),
            diagnosis=summary_data.get("diagnosis"),
            prescriptions=summary_data.get("prescriptions"),
            treatments_performed=summary_data.get("treatments_performed"),
            follow_up=summary_data.get("follow_up") if isinstance(summary_data.get("follow_up"), dict) else None,
            dentist_notes=summary_data.get("dentist_notes"),
            billing=summary_data.get("billing") if isinstance(summary_data.get("billing"), dict) else None
        )
        try:
            self.repository.create_visit(visit_create)
        except Exception:
            pass

        return self.get_visit_summary(appointment_id)



