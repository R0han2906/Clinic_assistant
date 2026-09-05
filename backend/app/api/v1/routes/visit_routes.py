from typing import List
from fastapi import APIRouter, Depends, status
from app.models.visit import VisitCreate, VisitResponse
from app.services import get_visit_service, VisitService
from app.controllers.visit_controller import VisitController

router = APIRouter(tags=["Visits"])

@router.get("/patients/{patient_id}/visits", response_model=List[VisitResponse])
def get_patient_visits(
    patient_id: str,
    visit_service: VisitService = Depends(get_visit_service)
):
    """Retrieves concise structured previous visits for the specified patient."""
    return VisitController.get_patient_visits(patient_id, visit_service)

@router.post("/patients/{patient_id}/visits", response_model=VisitResponse, status_code=status.HTTP_201_CREATED)
def add_patient_visit(
    patient_id: str,
    visit_in: VisitCreate,
    visit_service: VisitService = Depends(get_visit_service)
):
    """Adds a new concise structured visit summary for the patient."""
    return VisitController.add_patient_visit(patient_id, visit_in, visit_service)
