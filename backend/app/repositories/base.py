from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from app.models.patient import PatientResponse, PatientCreate
from app.models.visit import VisitResponse, VisitCreate
from app.models.dentist import DentistResponse, DentistCreate
from app.models.availability import WorkingScheduleItem, LeaveItem, LeaveCreate, ScheduleUpdate
from app.models.appointment import AppointmentResponse, AppointmentCreate, AppointmentStatus
from app.models.audit import AuditLogEntry

class BaseClinicRepository(ABC):
    """
    Abstract repository interface for clinic data storage.
    All business logic accesses data solely through this interface.
    This guarantees that migrating from Excel to Supabase in Phase 5
    will require changing ONLY the concrete repository implementation.
    """

    # Initialization & Health
    @abstractmethod
    def initialize_storage(self) -> None:
        pass

    @abstractmethod
    def check_health(self) -> Dict[str, Any]:
        pass

    # Patients
    @abstractmethod
    def list_patients(self) -> List[PatientResponse]:
        pass

    @abstractmethod
    def get_patient(self, patient_id: str) -> Optional[PatientResponse]:
        pass

    @abstractmethod
    def find_patients(self, query: str) -> List[PatientResponse]:
        pass

    @abstractmethod
    def create_patient(self, patient_data: PatientCreate) -> PatientResponse:
        pass

    @abstractmethod
    def update_patient(self, patient_id: str, updates: Dict[str, Any]) -> Optional[PatientResponse]:
        pass

    # Visits
    @abstractmethod
    def list_visits_for_patient(self, patient_id: str) -> List[VisitResponse]:
        pass

    @abstractmethod
    def create_visit(self, visit_data: VisitCreate) -> VisitResponse:
        pass

    # Dentists
    @abstractmethod
    def list_dentists(self, active_only: bool = True) -> List[DentistResponse]:
        pass

    @abstractmethod
    def get_dentist(self, dentist_id: str) -> Optional[DentistResponse]:
        pass

    @abstractmethod
    def create_dentist(self, dentist_data: DentistCreate) -> DentistResponse:
        pass

    # Availability & Schedules
    @abstractmethod
    def list_schedules_for_dentist(self, dentist_id: str) -> List[WorkingScheduleItem]:
        pass

    @abstractmethod
    def update_schedule_for_day(
        self,
        dentist_id: str,
        day_of_week: int,
        updates: ScheduleUpdate
    ) -> Optional[WorkingScheduleItem]:
        pass

    @abstractmethod
    def list_leaves_for_dentist(self, dentist_id: str) -> List[LeaveItem]:
        pass

    @abstractmethod
    def create_leave_for_dentist(self, dentist_id: str, leave_data: LeaveCreate) -> LeaveItem:
        pass

    # Appointments
    @abstractmethod
    def list_appointments(
        self,
        date: Optional[str] = None,
        dentist_id: Optional[str] = None,
        patient_id: Optional[str] = None,
        status: Optional[AppointmentStatus] = None
    ) -> List[AppointmentResponse]:
        pass

    @abstractmethod
    def get_appointment(self, appointment_id: str) -> Optional[AppointmentResponse]:
        pass

    @abstractmethod
    def create_appointment(self, appointment_data: AppointmentCreate) -> AppointmentResponse:
        pass

    @abstractmethod
    def update_appointment_status(
        self,
        appointment_id: str,
        new_status: AppointmentStatus,
        notes: Optional[str] = None
    ) -> Optional[AppointmentResponse]:
        pass

    @abstractmethod
    def reschedule_appointment(
        self,
        appointment_id: str,
        new_date: str,
        new_start_time: str,
        new_end_time: str,
        new_dentist_id: Optional[str] = None,
        notes: Optional[str] = None
    ) -> Optional[AppointmentResponse]:
        pass

    # Treatments Catalog
    @abstractmethod
    def list_treatments(self) -> List[Any]:
        pass

    # Payment & Reminders
    @abstractmethod
    def update_payment_status(
        self, appointment_id: str, payment_status: str, bill_number: Optional[str] = None
    ) -> Optional[AppointmentResponse]:
        pass

    @abstractmethod
    def send_payment_reminder(self, appointment_id: str) -> Optional[Any]:
        pass

    # Medical Checkups & Odontogram
    @abstractmethod
    def save_medical_checkup(self, checkup_data: Any) -> Any:
        pass

    @abstractmethod
    def get_medical_checkup(self, checkup_id: str) -> Optional[Any]:
        pass

    @abstractmethod
    def get_checkup_by_appointment(self, appointment_id: str) -> Optional[Any]:
        pass

    @abstractmethod
    def list_checkups_for_patient(self, patient_id: str) -> List[Any]:
        pass

    # Patient Requests (Simulator / WhatsApp)
    @abstractmethod
    def create_patient_request(self, request_data: Any) -> Any:
        pass

    @abstractmethod
    def get_patient_request(self, request_id: str) -> Optional[Any]:
        pass

    @abstractmethod
    def list_patient_requests(self, status: Optional[str] = None) -> List[Any]:
        pass

    @abstractmethod
    def update_patient_request_status(
        self, request_id: str, status: str, review_notes: Optional[str] = None, appointment_id: Optional[str] = None
    ) -> Optional[Any]:
        pass

    # Audit Logging
    @abstractmethod
    def log_audit_event(self, entry: AuditLogEntry) -> None:
        pass


