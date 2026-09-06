from typing import List
from fastapi import APIRouter, Depends, status
from app.models.treatment import Treatment, TreatmentCreate, TreatmentUpdate
from app.services import get_treatment_service, TreatmentService

router = APIRouter(prefix="/treatments", tags=["Treatments Catalog"])

@router.get("", response_model=List[Treatment])
def list_treatments(
    service: TreatmentService = Depends(get_treatment_service)
):
    """Returns the clinic's treatment and procedure catalog."""
    return service.list_treatments()

@router.get("/{treatment_id}", response_model=Treatment)
def get_treatment(
    treatment_id: str,
    service: TreatmentService = Depends(get_treatment_service)
):
    """Returns a specific treatment by ID."""
    return service.get_treatment(treatment_id)

@router.post("", response_model=Treatment, status_code=status.HTTP_201_CREATED)
def create_treatment(
    treatment_data: TreatmentCreate,
    service: TreatmentService = Depends(get_treatment_service)
):
    """Creates a new treatment procedure in the catalog."""
    return service.create_treatment(treatment_data)

@router.patch("/{treatment_id}", response_model=Treatment)
def update_treatment(
    treatment_id: str,
    updates: TreatmentUpdate,
    service: TreatmentService = Depends(get_treatment_service)
):
    """Updates treatment details (cost, duration, category)."""
    return service.update_treatment(treatment_id, updates)

@router.delete("/{treatment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_treatment(
    treatment_id: str,
    service: TreatmentService = Depends(get_treatment_service)
):
    """Deletes a treatment procedure from the catalog."""
    service.delete_treatment(treatment_id)
    return None
