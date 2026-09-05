from typing import List
from app.models.visit import VisitCreate, VisitResponse
from app.services.visit_service import VisitService

class VisitController:
    """Controller handling structured clinical visit histories."""

    @staticmethod
    def get_patient_visits(patient_id: str, visit_service: VisitService) -> List[VisitResponse]:
        return visit_service.get_patient_visits(patient_id)

    @staticmethod
    def add_patient_visit(patient_id: str, visit_in: VisitCreate, visit_service: VisitService) -> VisitResponse:
        if visit_in.patient_id.lower() != patient_id.lower():
            visit_in.patient_id = patient_id
        return visit_service.record_visit_summary(visit_in)
