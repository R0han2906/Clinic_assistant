from app.repositories import get_repository
from app.services.patient_service import PatientService
from app.services.visit_service import VisitService
from app.services.dentist_service import DentistService
from app.services.availability_service import AvailabilityService
from app.services.booking_service import BookingService
from app.services.audit_service import AuditService
from app.services.patient_request_service import PatientRequestService
from app.services.sales_service import SalesService
from app.services.purchase_service import PurchaseService
from app.services.inventory_service import InventoryService
from app.services.staff_service import StaffService
from app.services.treatment_service import TreatmentService
from app.services.peripheral_service import PeripheralService

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

def get_patient_request_service() -> PatientRequestService:
    return PatientRequestService(get_repository())

def get_sales_service() -> SalesService:
    return SalesService(get_repository())

def get_purchase_service() -> PurchaseService:
    return PurchaseService(get_repository())

def get_inventory_service() -> InventoryService:
    return InventoryService(get_repository())

def get_staff_service() -> StaffService:
    return StaffService(get_repository())

def get_treatment_service() -> TreatmentService:
    return TreatmentService(get_repository())

def get_peripheral_service() -> PeripheralService:
    return PeripheralService(get_repository())
