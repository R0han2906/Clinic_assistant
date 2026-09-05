from app.controllers.patient_controller import router as patient_router
from app.controllers.dentist_controller import router as dentist_router
from app.controllers.appointment_controller import router as appointment_router
from app.controllers.system_controller import router as system_router

__all__ = [
    "patient_router",
    "dentist_router",
    "appointment_router",
    "system_router"
]
