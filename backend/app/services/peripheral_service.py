from typing import List
from app.repositories.base import BaseClinicRepository
from app.models.peripheral import PeripheralResponse, PeripheralCreate, PeripheralUpdate
from app.core.exceptions import ResourceNotFoundError


class PeripheralService:
    def __init__(self, repository: BaseClinicRepository):
        self.repository = repository

    def list_peripherals(self) -> List[PeripheralResponse]:
        return self.repository.list_peripherals()

    def get_item(self, peripheral_id: str) -> PeripheralResponse:
        item = self.repository.get_peripheral(peripheral_id)
        if not item:
            raise ResourceNotFoundError("Peripheral", peripheral_id)
        return item

    def create_item(self, item_data: PeripheralCreate) -> PeripheralResponse:
        return self.repository.create_peripheral(item_data)

    def update_item(self, peripheral_id: str, updates: PeripheralUpdate) -> PeripheralResponse:
        updated = self.repository.update_peripheral(peripheral_id, updates)
        if not updated:
            raise ResourceNotFoundError("Peripheral", peripheral_id)
        return updated

    def delete_item(self, peripheral_id: str) -> bool:
        deleted = self.repository.delete_peripheral(peripheral_id)
        if not deleted:
            raise ResourceNotFoundError("Peripheral", peripheral_id)
        return True
