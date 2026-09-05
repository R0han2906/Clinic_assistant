from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from app.models.patient import PatientCreate, PatientUpdate, PatientResponse, DuplicateCheckResult
from app.models.visit import VisitCreate, VisitResponse
from app.services import get_patient_service, get_visit_service, PatientService, VisitService
from app.core.exceptions import DuplicatePatientWarning, ResourceNotFoundError

router = APIRouter(prefix="/patients", tags=["Patients"])

@router.get("", response_model=List[PatientResponse])
def list_or_search_patients(
    query: Optional[str] = Query(None, description="Search query by name, phone, or PAT-ID"),
    patient_service: PatientService = Depends(get_patient_service)
):
    """Lists all registered clinic patients, or searches matching query."""
    if query:
        return patient_service.search_patients(query)
    return patient_service.list_all_patients()

@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def register_patient(
    patient_data: PatientCreate,
    patient_service: PatientService = Depends(get_patient_service)
):
    """
    Registers a new patient.
    If potential duplicate exists and force_create is False, returns HTTP 409 with duplicate list.
    """
    try:
        return patient_service.register_patient(patient_data)
    except DuplicatePatientWarning as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "message": e.message,
                "is_potential_duplicate": True,
                "existing_matches": [m.model_dump() for m in e.existing_matches]
            }
        )

@router.get("/check-duplicate", response_model=DuplicateCheckResult)
def check_duplicate(
    phone: str = Query(..., description="Phone number to check"),
    name: str = Query(..., description="Patient name to check"),
    patient_service: PatientService = Depends(get_patient_service)
):
    """Performs pre-flight duplicate check before registration."""
    return patient_service.check_potential_duplicates(phone=phone, name=name)

@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient_profile(
    patient_id: str,
    patient_service: PatientService = Depends(get_patient_service)
):
    """Retrieves patient details by patient identifier (e.g. PAT-000001)."""
    return patient_service.get_patient_by_id(patient_id)

@router.patch("/{patient_id}", response_model=PatientResponse)
@router.put("/{patient_id}", response_model=PatientResponse)
def update_patient_profile(
    patient_id: str,
    updates: PatientUpdate,
    patient_service: PatientService = Depends(get_patient_service)
):
    """
    Updates profile, demographics, and contact details for an existing patient.
    """
    return patient_service.update_patient(patient_id, updates)

@router.get("/{patient_id}/visits", response_model=List[VisitResponse])
def get_patient_visits(
    patient_id: str,
    visit_service: VisitService = Depends(get_visit_service)
):
    """Retrieves concise structured previous visits for the specified patient."""
    return visit_service.get_patient_visits(patient_id)

@router.post("/{patient_id}/visits", response_model=VisitResponse, status_code=status.HTTP_201_CREATED)
def add_patient_visit(
    patient_id: str,
    visit_in: VisitCreate,
    visit_service: VisitService = Depends(get_visit_service)
):
    """Adds a new concise structured visit summary for the patient."""
    if visit_in.patient_id.lower() != patient_id.lower():
        visit_in.patient_id = patient_id
    return visit_service.record_visit_summary(visit_in)
