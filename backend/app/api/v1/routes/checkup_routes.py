from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.models.medical_checkup import MedicalCheckupCreate, MedicalCheckupResponse
from app.repositories import get_repository, BaseClinicRepository

router = APIRouter(prefix="/checkups", tags=["Medical Checkup & Odontogram"])

@router.post("", response_model=MedicalCheckupResponse, status_code=status.HTTP_201_CREATED)
def save_medical_checkup(
    payload: MedicalCheckupCreate,
    repo: BaseClinicRepository = Depends(get_repository)
):
    """
    Saves or updates a 4-step medical checkup & odontogram record.
    Synchronizes oral checkup notes to the linked appointment's clinical_notes banner.
    """
    patient = repo.get_patient(payload.patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient {payload.patient_id} not found"
        )
    return repo.save_medical_checkup(payload)

@router.get("/appointment/{appointment_id}", response_model=MedicalCheckupResponse)
def get_checkup_by_appointment(
    appointment_id: str,
    repo: BaseClinicRepository = Depends(get_repository)
):
    """Retrieves the clinical checkup and 32-tooth odontogram record linked to an appointment."""
    checkup = repo.get_checkup_by_appointment(appointment_id)
    if not checkup:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No medical checkup found for appointment {appointment_id}"
        )
    return checkup

@router.get("/patient/{patient_id}", response_model=List[MedicalCheckupResponse])
def list_checkups_for_patient(
    patient_id: str,
    repo: BaseClinicRepository = Depends(get_repository)
):
    """Retrieves all medical checkup and odontogram history for a patient."""
    patient = repo.get_patient(patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient {patient_id} not found"
        )
    return repo.list_checkups_for_patient(patient_id)

@router.get("/{checkup_id}", response_model=MedicalCheckupResponse)
def get_medical_checkup(
    checkup_id: str,
    repo: BaseClinicRepository = Depends(get_repository)
):
    """Retrieves a medical checkup by its unique checkup identifier (e.g. CHK-000001)."""
    checkup = repo.get_medical_checkup(checkup_id)
    if not checkup:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Medical checkup {checkup_id} not found"
        )
    return checkup
