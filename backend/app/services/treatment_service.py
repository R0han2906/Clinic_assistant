from typing import List
from app.repositories.base import BaseClinicRepository
from app.models.treatment import Treatment, TreatmentCreate, TreatmentUpdate
from app.core.exceptions import ResourceNotFoundError

class TreatmentService:
    def __init__(self, repository: BaseClinicRepository):
        self.repository = repository

    def list_treatments(self) -> List[Treatment]:
        return self.repository.list_treatments()

    def get_treatment(self, treatment_id: str) -> Treatment:
        t = self.repository.get_treatment(treatment_id)
        if not t:
            raise ResourceNotFoundError("Treatment", treatment_id)
        return t

    def create_treatment(self, treatment_data: TreatmentCreate) -> Treatment:
        return self.repository.create_treatment(treatment_data)

    def update_treatment(self, treatment_id: str, updates: TreatmentUpdate) -> Treatment:
        updated = self.repository.update_treatment(treatment_id, updates)
        if not updated:
            raise ResourceNotFoundError("Treatment", treatment_id)
        return updated

    def delete_treatment(self, treatment_id: str) -> bool:
        deleted = self.repository.delete_treatment(treatment_id)
        if not deleted:
            raise ResourceNotFoundError("Treatment", treatment_id)
        return True
