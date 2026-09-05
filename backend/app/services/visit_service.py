from typing import List
from app.repositories.base import BaseClinicRepository
from app.models.visit import VisitCreate, VisitResponse
from app.core.exceptions import ResourceNotFoundError

class VisitService:
    def __init__(self, repository: BaseClinicRepository):
        self.repository = repository

    def get_patient_visits(self, patient_id: str) -> List[VisitResponse]:
        # Validate patient exists
        patient = self.repository.get_patient(patient_id)
        if not patient:
            raise ResourceNotFoundError("Patient", patient_id)
        return self.repository.list_visits_for_patient(patient_id)

    def record_visit_summary(self, visit_data: VisitCreate) -> VisitResponse:
        # Validate patient exists
        patient = self.repository.get_patient(visit_data.patient_id)
        if not patient:
            raise ResourceNotFoundError("Patient", visit_data.patient_id)
        
        # Validate dentist exists
        dentist = self.repository.get_dentist(visit_data.dentist_id)
        if not dentist:
            raise ResourceNotFoundError("Dentist", visit_data.dentist_id)

        return self.repository.create_visit(visit_data)
