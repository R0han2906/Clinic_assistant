from fastapi import APIRouter, Depends, status
from app.controllers import system_controller
from app.repositories import get_repository, BaseClinicRepository

router = APIRouter(tags=["System & Storage"])

@router.get("/health", status_code=status.HTTP_200_OK)
def liveness_check():
    """Lightweight liveness check."""
    return {"status": "ok"}

@router.get("/system/health", status_code=status.HTTP_200_OK)
def system_health_check(
    repository: BaseClinicRepository = Depends(get_repository)
):
    """Full storage health check reading the clinic workbook."""
    return system_controller.get_system_health(repository)

@router.get("/system/export-workbook")
def export_workbook():
    """Download the raw clinic Excel workbook."""
    return system_controller.export_clinic_workbook()
