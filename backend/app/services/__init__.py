from app.repositories import get_repository
from app.services.patient_service import PatientService
from app.services.visit_service import VisitService
from app.services.dentist_service import DentistService
from app.services.availability_service import AvailabilityService
from app.services.booking_service import BookingService
from app.services.audit_service import AuditService

def get_patient_service() -> PatientService:
    return PatientService(get_repository())

def get_visit_service() -> VisitService:
    return VisitService(get_repository())

def get_dentist_service() -> DentistService:
    return DentistService(get_repository())

def get_availability_service() -> AvailabilityService:
    return AvailabilityService(get_repository())

def get_booking_service() -> BookingService:
    return BookingService(get_repository())

def get_audit_service() -> AuditService:
    return AuditService(get_repository())
