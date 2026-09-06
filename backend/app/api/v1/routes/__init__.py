"""
Dedicated Routes Folder:
All HTTP route definitions, URL paths, methods, OpenAPI tags, status codes,
and dependency injection are isolated here.
"""
from .health_routes import router as health_router
from .patient_routes import router as patient_router
from .visit_routes import router as visit_router
from .dentist_routes import router as dentist_router
from .availability_routes import router as availability_router
from .appointment_routes import router as appointment_router
from .treatment_routes import router as treatment_router
from .checkup_routes import router as checkup_router
from .patient_request_routes import router as patient_request_router
from .sales_routes import router as sales_router
from .inventory_routes import router as inventory_router
from .purchase_routes import router as purchase_router
from .staff_routes import router as staff_router
from .export_routes import router as export_router
from .peripheral_routes import router as peripheral_router

__all__ = [
    "health_router",
    "patient_router",
    "visit_router",
    "dentist_router",
    "availability_router",
    "appointment_router",
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
