from typing import List
from app.repositories.base import BaseClinicRepository
from app.models.dentist import DentistCreate, DentistResponse
from app.models.availability import WorkingScheduleItem, LeaveItem, LeaveCreate, ScheduleUpdate
from app.core.exceptions import ResourceNotFoundError


class DentistService:
    def __init__(self, repository: BaseClinicRepository):
        self.repository = repository

    def list_active_dentists(self) -> List[DentistResponse]:
        return self.repository.list_dentists(active_only=True)

    def get_dentist_by_id(self, dentist_id: str) -> DentistResponse:
        dentist = self.repository.get_dentist(dentist_id)
        if not dentist:
            raise ResourceNotFoundError("Dentist", dentist_id)
        return dentist

    def add_dentist(self, dentist_data: DentistCreate) -> DentistResponse:
        return self.repository.create_dentist(dentist_data)

    # ---- Schedule management ----

    def get_schedule(self, dentist_id: str) -> List[WorkingScheduleItem]:
        """Returns the full weekly schedule (all 7 days) for a dentist."""
        self.get_dentist_by_id(dentist_id)  # raises 404 if not found
        return self.repository.list_schedules_for_dentist(dentist_id)

    def update_day_schedule(
        self, dentist_id: str, day_of_week: int, updates: ScheduleUpdate
    ) -> WorkingScheduleItem:
        """Updates working hours/break for a single day of the week."""
        self.get_dentist_by_id(dentist_id)  # raises 404 if not found
        return self.repository.update_schedule_for_day(dentist_id, day_of_week, updates)

    # ---- Leave management ----

    def get_leaves(self, dentist_id: str) -> List[LeaveItem]:
        """Returns all registered leave/block periods for a dentist."""
        self.get_dentist_by_id(dentist_id)  # raises 404 if not found
        return self.repository.list_leaves_for_dentist(dentist_id)

    def add_leave(self, dentist_id: str, leave_data: LeaveCreate) -> LeaveItem:
        """Registers a leave block for a dentist. Slot calculation respects this."""
        self.get_dentist_by_id(dentist_id)  # raises 404 if not found
        return self.repository.create_leave_for_dentist(dentist_id, leave_data)
