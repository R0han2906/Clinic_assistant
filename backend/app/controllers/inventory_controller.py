from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from app.models.inventory import (
    InventoryResponse, InventoryCreate, InventoryUpdate, InventoryQuantityUpdate
)
from app.services import get_inventory_service, InventoryService

router = APIRouter(prefix="/inventory", tags=["Inventory & Stocks"])

@router.get("", response_model=List[InventoryResponse])
def list_inventory(
    category: Optional[str] = Query(None, description="Filter by category"),
    low_stock: bool = Query(False, description="Filter items at or below minimum stock"),
    service: InventoryService = Depends(get_inventory_service)
):
    """Lists inventory stock items with optional filters."""
    return service.list_inventory(category=category, low_stock_only=low_stock)

@router.get("/{item_id}", response_model=InventoryResponse)
def get_inventory_item(
    item_id: str,
    service: InventoryService = Depends(get_inventory_service)
):
    """Returns details for an inventory item."""
    return service.get_item(item_id)

@router.post("", response_model=InventoryResponse, status_code=status.HTTP_201_CREATED)
def create_inventory_item(
    item_data: InventoryCreate,
    service: InventoryService = Depends(get_inventory_service)
):
    """Adds a new item to clinic inventory."""
    return service.create_item(item_data)

@router.patch("/{item_id}", response_model=InventoryResponse)
def update_inventory_item(
    item_id: str,
    updates: InventoryUpdate,
    service: InventoryService = Depends(get_inventory_service)
):
    """Updates inventory details such as price, min stock, category."""
    return service.update_item(item_id, updates)

@router.patch("/{item_id}/quantity", response_model=InventoryResponse)
def update_inventory_quantity(
    item_id: str,
    update: InventoryQuantityUpdate,
    service: InventoryService = Depends(get_inventory_service)
):
    """Quickly updates the current stock quantity for an item."""
    return service.update_quantity(item_id, update.quantity)

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_inventory_item(
    item_id: str,
    service: InventoryService = Depends(get_inventory_service)
):
    """Deletes an item from inventory."""
    service.delete_item(item_id)
    return None
