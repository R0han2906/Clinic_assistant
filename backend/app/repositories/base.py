from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from app.models.patient import PatientResponse, PatientCreate
from app.models.visit import VisitResponse, VisitCreate
from app.models.dentist import DentistResponse, DentistCreate
from app.models.availability import WorkingScheduleItem, LeaveItem, LeaveCreate, ScheduleUpdate
from app.models.appointment import AppointmentResponse, AppointmentCreate, AppointmentStatus
from app.models.audit import AuditLogEntry
from app.models.treatment import Treatment, TreatmentCreate, TreatmentUpdate
from app.models.staff import StaffMember, StaffCreate, StaffUpdate
from app.models.sales import SaleResponse, SaleCreate, SaleSummary, PaymentMethodResponse
from app.models.purchase import PurchaseResponse, PurchaseCreate, VendorResponse, VendorCreate
from app.models.inventory import InventoryResponse, InventoryCreate, InventoryUpdate
from app.models.peripheral import PeripheralResponse, PeripheralCreate, PeripheralUpdate

class BaseClinicRepository(ABC):
    """
    Abstract repository interface for clinic data storage.
    All business logic accesses data solely through this interface.
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

    @abstractmethod
    def delete_patient(self, patient_id: str) -> bool:
        pass

    # Visits
    @abstractmethod
    def list_visits_for_patient(self, patient_id: str) -> List[VisitResponse]:
        pass

    @abstractmethod
    def create_visit(self, visit_data: VisitCreate) -> VisitResponse:
        pass

    @abstractmethod
    def get_visit_by_appointment(self, appointment_id: str) -> Optional[VisitResponse]:
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
    def update_appointment(
        self,
        appointment_id: str,
        updates: Dict[str, Any]
    ) -> Optional[AppointmentResponse]:
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
    def list_treatments(self) -> List[Treatment]:
        pass

    @abstractmethod
    def get_treatment(self, treatment_id: str) -> Optional[Treatment]:
        pass

    @abstractmethod
    def create_treatment(self, treatment_data: TreatmentCreate) -> Treatment:
        pass

    @abstractmethod
    def update_treatment(self, treatment_id: str, updates: TreatmentUpdate) -> Optional[Treatment]:
        pass

    @abstractmethod
    def delete_treatment(self, treatment_id: str) -> bool:
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

    # Staff Members
    @abstractmethod
    def list_staff(self, active_only: bool = False) -> List[StaffMember]:
        pass

    @abstractmethod
    def get_staff(self, staff_id: str) -> Optional[StaffMember]:
        pass

    @abstractmethod
    def create_staff(self, staff_data: StaffCreate) -> StaffMember:
        pass

    @abstractmethod
    def update_staff(self, staff_id: str, updates: StaffUpdate) -> Optional[StaffMember]:
        pass

    @abstractmethod
    def delete_staff(self, staff_id: str) -> bool:
        pass

    # Sales
    @abstractmethod
    def list_sales(
        self,
        date: Optional[str] = None,
        patient_id: Optional[str] = None,
        status: Optional[str] = None
    ) -> List[SaleResponse]:
        pass

    @abstractmethod
    def get_sale(self, sale_id: str) -> Optional[SaleResponse]:
        pass

    @abstractmethod
    def create_sale(self, sale_data: SaleCreate) -> SaleResponse:
        pass

    @abstractmethod
    def update_sale_status(self, sale_id: str, status: str) -> Optional[SaleResponse]:
        pass

    @abstractmethod
    def get_sales_summary(self) -> SaleSummary:
        pass

    # Purchases
    @abstractmethod
    def list_purchases(self, status: Optional[str] = None) -> List[PurchaseResponse]:
        pass

    @abstractmethod
    def get_purchase(self, purchase_id: str) -> Optional[PurchaseResponse]:
        pass

    @abstractmethod
    def create_purchase(self, purchase_data: PurchaseCreate) -> PurchaseResponse:
        pass

    @abstractmethod
    def update_purchase_status(
        self, purchase_id: str, status: str, received_date: Optional[str] = None
    ) -> Optional[PurchaseResponse]:
        pass

    # Inventory
    @abstractmethod
    def list_inventory(
        self, category: Optional[str] = None, low_stock_only: bool = False
    ) -> List[InventoryResponse]:
        pass

    @abstractmethod
    def get_inventory_item(self, item_id: str) -> Optional[InventoryResponse]:
        pass

    @abstractmethod
    def create_inventory_item(self, item_data: InventoryCreate) -> InventoryResponse:
        pass

    @abstractmethod
    def update_inventory_item(
        self, item_id: str, updates: InventoryUpdate
    ) -> Optional[InventoryResponse]:
        pass

    @abstractmethod
    def delete_inventory_item(self, item_id: str) -> bool:
        pass

    # Payment Methods
    @abstractmethod
    def list_payment_methods(self) -> List[PaymentMethodResponse]:
        pass

    @abstractmethod
    def update_payment_method(
        self, method_id: str, enabled: Optional[bool] = None, processing_fee: Optional[str] = None
    ) -> Optional[PaymentMethodResponse]:
        pass

    # Vendors
    @abstractmethod
    def list_vendors(self) -> List[VendorResponse]:
        pass

    @abstractmethod
    def create_vendor(self, vendor_data: VendorCreate) -> VendorResponse:
        pass

    # Peripherals
    @abstractmethod
    def list_peripherals(self) -> List[PeripheralResponse]:
        pass

    @abstractmethod
    def get_peripheral(self, peripheral_id: str) -> Optional[PeripheralResponse]:
        pass

    @abstractmethod
    def create_peripheral(self, item_data: PeripheralCreate) -> PeripheralResponse:
        pass

    @abstractmethod
    def update_peripheral(
        self, peripheral_id: str, updates: PeripheralUpdate
    ) -> Optional[PeripheralResponse]:
        pass

    @abstractmethod
    def delete_peripheral(self, peripheral_id: str) -> bool:
        pass

    # Audit Logging
    @abstractmethod
    def log_audit_event(self, entry: AuditLogEntry) -> None:
        pass
