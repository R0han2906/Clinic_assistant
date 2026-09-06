from typing import List, Optional
from app.repositories.base import BaseClinicRepository
from app.models.staff import StaffMember, StaffCreate, StaffUpdate
from app.core.exceptions import ResourceNotFoundError

class StaffService:
    def __init__(self, repository: BaseClinicRepository):
        self.repository = repository

    def list_staff(self, active_only: bool = False) -> List[StaffMember]:
        return self.repository.list_staff(active_only=active_only)

    def get_staff(self, staff_id: str) -> StaffMember:
        staff = self.repository.get_staff(staff_id)
        if not staff:
            raise ResourceNotFoundError("Staff", staff_id)
        return staff

    def create_staff(self, staff_data: StaffCreate) -> StaffMember:
        return self.repository.create_staff(staff_data)

    def update_staff(self, staff_id: str, updates: StaffUpdate) -> StaffMember:
        updated = self.repository.update_staff(staff_id, updates)
        if not updated:
            raise ResourceNotFoundError("Staff", staff_id)
        return updated

    def delete_staff(self, staff_id: str) -> bool:
        deleted = self.repository.delete_staff(staff_id)
        if not deleted:
            raise ResourceNotFoundError("Staff", staff_id)
        return True
