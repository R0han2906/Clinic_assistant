from app.controllers.patient_controller import router as patient_router
from app.controllers.dentist_controller import router as dentist_router
from app.controllers.appointment_controller import router as appointment_router
from app.controllers.system_controller import router as system_router
from app.controllers.treatment_controller import router as treatment_router
from app.controllers.medical_checkup_controller import router as checkup_router
from app.controllers.patient_request_controller import patient_request_router
from app.controllers.sales_controller import router as sales_router
from app.controllers.inventory_controller import router as inventory_router
from app.controllers.purchase_controller import router as purchase_router
from app.controllers.staff_controller import router as staff_router
from app.controllers.export_controller import router as export_router
from app.controllers.peripheral_controller import router as peripheral_router

__all__ = [
    "patient_router",
    "dentist_router",
    "appointment_router",
    "system_router",
    "treatment_router",
    "checkup_router",
    "patient_request_router",
    "sales_router",
    "inventory_router",
    "purchase_router",
    "staff_router",
    "export_router",
    "peripheral_router"
]
