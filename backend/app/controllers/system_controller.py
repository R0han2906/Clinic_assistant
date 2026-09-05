from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from app.repositories import get_repository, BaseClinicRepository
from app.core.config import settings

router = APIRouter(prefix="/system", tags=["System & Storage"])

@router.get("/health")
def get_system_health(
    repository: BaseClinicRepository = Depends(get_repository)
):
    """
    Returns the operational health and storage status of the clinic workbook pilot.
    """
    return repository.check_health()

@router.get("/export-workbook")
def export_clinic_workbook():
    """
    Allows authorized staff to download the latest clinic Excel workbook file.
    """
    if not settings.WORKBOOK_PATH.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clinic workbook file not found on disk."
        )
    return FileResponse(
        path=str(settings.WORKBOOK_PATH),
        filename=f"{settings.CLINIC_NAME.replace(' ', '_')}_clinic_data.xlsx",
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
