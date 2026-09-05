import pytest
from app.models.patient import PatientCreate
from app.services.patient_service import PatientService
from app.core.exceptions import DuplicatePatientWarning, ResourceNotFoundError

def test_duplicate_detection_by_phone(temp_repo):
    service = PatientService(temp_repo)
    
    # Register first patient
    service.register_patient(PatientCreate(
        full_name="Aarav Mehta",
        dob_or_age="25",
        phone="+91 9123456780"
    ))

    # Try registering second patient with same phone
    with pytest.raises(DuplicatePatientWarning) as exc_info:
        service.register_patient(PatientCreate(
            full_name="Aarav M.",
            dob_or_age="25",
            phone="+91 9123456780",
            force_create=False
        ))
    
    assert "duplicate" in exc_info.value.message.lower()

    # Force create works
    forced = service.register_patient(PatientCreate(
        full_name="Aarav M.",
        dob_or_age="25",
        phone="+91 9123456780",
        force_create=True
    ))
    assert forced.patient_id == "PAT-000002"

def test_patient_search(temp_repo):
    service = PatientService(temp_repo)
    service.register_patient(PatientCreate(full_name="Neha Gupta", dob_or_age="29", phone="+91 9888877777"))
    service.register_patient(PatientCreate(full_name="Vikram Singh", dob_or_age="40", phone="+91 9777766666"))

    results = service.search_patients("Neha")
    assert len(results) == 1
    assert results[0].full_name == "Neha Gupta"

    results_phone = service.search_patients("9777766666")
    assert len(results_phone) == 1
    assert results_phone[0].full_name == "Vikram Singh"
