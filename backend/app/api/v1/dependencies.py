"""
Common FastAPI dependencies for API v1 routes.
Provides access to domain services and repositories.
"""
from app.repositories import get_repository
from app.repositories.base import BaseClinicRepository
from app.services import (
    get_patient_service, PatientService,
    get_visit_service, VisitService,
    get_dentist_service, DentistService,
    get_availability_service, AvailabilityService,
    get_booking_service, BookingService,
    get_patient_request_service, PatientRequestService
)

__all__ = [
    "get_repository",
    "BaseClinicRepository",
    "get_patient_service",
    "PatientService",
    "get_visit_service",
    "VisitService",
    "get_dentist_service",
    "DentistService",
    "get_availability_service",
    "AvailabilityService",
    "get_booking_service",
    "BookingService",
    "get_patient_request_service",
    "PatientRequestService"
]
