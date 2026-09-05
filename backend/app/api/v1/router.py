from fastapi import APIRouter
from app.api.v1.routes.health_routes import router as health_router
from app.api.v1.routes.patient_routes import router as patient_router
from app.api.v1.routes.visit_routes import router as visit_router
from app.api.v1.routes.dentist_routes import router as dentist_router
from app.api.v1.routes.availability_routes import router as availability_router
from app.api.v1.routes.appointment_routes import router as appointment_router
from app.api.v1.routes.treatment_routes import router as treatment_router
from app.api.v1.routes.checkup_routes import router as checkup_router
from app.api.v1.routes.patient_request_routes import router as patient_request_router

v1_router = APIRouter()

# Mount all feature routes
v1_router.include_router(health_router)
v1_router.include_router(patient_router)
v1_router.include_router(visit_router)
v1_router.include_router(dentist_router)
v1_router.include_router(availability_router)
v1_router.include_router(appointment_router)
v1_router.include_router(treatment_router)
v1_router.include_router(checkup_router)
v1_router.include_router(patient_request_router)
