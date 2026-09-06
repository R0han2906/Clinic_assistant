from typing import Optional
from pydantic import BaseModel, Field

class InventoryResponse(BaseModel):
    item_id: str = Field(..., description="Unique inventory code e.g. INV-000001")
    name: str
    category: str = "Consumables"
    quantity: int = 0
    min_stock: int = 0
    unit: str = "pcs"
    unit_price: float = 0.0
    supplier: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class InventoryCreate(BaseModel):
    name: str
    category: str = "Consumables"
    quantity: int = 0
    min_stock: int = 0
    unit: str = "pcs"
    unit_price: float = 0.0
    supplier: Optional[str] = None

class InventoryUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[int] = None
    min_stock: Optional[int] = None
    unit: Optional[str] = None
    unit_price: Optional[float] = None
    supplier: Optional[str] = None

class InventoryQuantityUpdate(BaseModel):
    quantity: int = Field(..., description="New current stock quantity")

InventoryItemResponse = InventoryResponse
InventoryItemCreate = InventoryCreate
InventoryItemUpdate = InventoryUpdate
