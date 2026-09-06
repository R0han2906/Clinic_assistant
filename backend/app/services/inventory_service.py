from typing import List, Optional
from app.repositories.base import BaseClinicRepository
from app.models.inventory import InventoryResponse, InventoryCreate, InventoryUpdate
from app.core.exceptions import ResourceNotFoundError

class InventoryService:
    def __init__(self, repository: BaseClinicRepository):
        self.repository = repository

    def list_inventory(
        self, category: Optional[str] = None, low_stock_only: bool = False
    ) -> List[InventoryResponse]:
        return self.repository.list_inventory(category=category, low_stock_only=low_stock_only)

    def get_item(self, item_id: str) -> InventoryResponse:
        item = self.repository.get_inventory_item(item_id)
        if not item:
            raise ResourceNotFoundError("InventoryItem", item_id)
        return item

    def create_item(self, item_data: InventoryCreate) -> InventoryResponse:
        return self.repository.create_inventory_item(item_data)

    def update_item(self, item_id: str, updates: InventoryUpdate) -> InventoryResponse:
        updated = self.repository.update_inventory_item(item_id, updates)
        if not updated:
            raise ResourceNotFoundError("InventoryItem", item_id)
        return updated

    def update_quantity(self, item_id: str, quantity: int) -> InventoryResponse:
        return self.update_item(item_id, InventoryUpdate(quantity=quantity))

    def delete_item(self, item_id: str) -> bool:
        deleted = self.repository.delete_inventory_item(item_id)
        if not deleted:
            raise ResourceNotFoundError("InventoryItem", item_id)
        return True
