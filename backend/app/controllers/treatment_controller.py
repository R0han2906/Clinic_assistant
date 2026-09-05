from typing import List
from fastapi import APIRouter, Depends
from app.models.treatment import Treatment
from app.repositories import get_repository
from app.repositories.base import BaseClinicRepository

router = APIRouter(prefix="/treatments", tags=["Treatments Catalog"])

@router.get("", response_model=List[Treatment])
def list_treatments(
    repo: BaseClinicRepository = Depends(get_repository)
):
    """
    Returns the clinic's treatment and procedure catalog.
    Used for reservation treatments and odontogram planned services.
    """
    return repo.list_treatments()
