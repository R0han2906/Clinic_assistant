from typing import List, Optional
from app.repositories.base import BaseClinicRepository
from app.models.patient import PatientCreate, PatientResponse, DuplicateCheckResult
from app.core.exceptions import ResourceNotFoundError, DuplicatePatientWarning

class PatientService:
    def __init__(self, repository: BaseClinicRepository):
        self.repository = repository

    def list_all_patients(self) -> List[PatientResponse]:
        return self.repository.list_patients()

    def get_patient_by_id(self, patient_id: str) -> PatientResponse:
        patient = self.repository.get_patient(patient_id)
        if not patient:
            raise ResourceNotFoundError("Patient", patient_id)
        return patient

    def search_patients(self, query: str) -> List[PatientResponse]:
        return self.repository.find_patients(query)

    def check_potential_duplicates(self, phone: str, name: str) -> DuplicateCheckResult:
        """
        Detects potential duplicate patients by exact phone number or close name matches.
        """
        clean_phone = phone.replace(" ", "").replace("-", "").strip()
        all_patients = self.repository.list_patients()
        
        matches = []
        for p in all_patients:
            p_phone = p.phone.replace(" ", "").replace("-", "").strip()
            if clean_phone and clean_phone == p_phone:
                matches.append(p)
            elif name.strip().lower() == p.full_name.strip().lower():
                if p not in matches:
                    matches.append(p)

        if matches:
            return DuplicateCheckResult(
                is_potential_duplicate=True,
                matching_patients=matches,
                message=f"Potential duplicate patient detected: Found {len(matches)} existing patient(s) with matching phone or name."
            )
        return DuplicateCheckResult(is_potential_duplicate=False, matching_patients=[])

    def register_patient(self, patient_data: PatientCreate) -> PatientResponse:
        """
        Registers a new patient. If duplicates are found and force_create is False,
        raises DuplicatePatientWarning so receptionist can confirm.
        """
        if not patient_data.force_create:
            dup_check = self.check_potential_duplicates(patient_data.phone, patient_data.full_name)
            if dup_check.is_potential_duplicate:
                raise DuplicatePatientWarning(
                    message=dup_check.message or "Potential duplicate patient found.",
                    existing_matches=dup_check.matching_patients
                )

        return self.repository.create_patient(patient_data)
