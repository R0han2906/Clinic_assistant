from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any

router = APIRouter(prefix="/inventory-hub", tags=["Inventory Hub"])

class InventoryOverviewResponse(BaseModel):
    total_consumables_count: int
    low_stock_items_count: int
    total_inventory_valuation: float
    total_peripherals_count: int
    maintenance_due_count: int
    suppliers_count: int
    recent_activity: List[Dict[str, Any]]

@router.get("/overview", response_model=InventoryOverviewResponse)
def get_inventory_overview():
    """
    Returns consolidated inventory metrics, stock alerts, and equipment maintenance status.
    """
    return InventoryOverviewResponse(
        total_consumables_count=142,
        low_stock_items_count=3,
        total_inventory_valuation=34800.00,
        total_peripherals_count=28,
        maintenance_due_count=2,
        suppliers_count=8,
        recent_activity=[
            {
                "id": "ACT-101",
                "timestamp": "2026-09-06 10:15",
                "item": "N95 Surgical Masks (Box of 50)",
                "action": "Restocked +20 boxes",
                "actor": "Sarah Jenkins",
            },
            {
                "id": "ACT-102",
                "timestamp": "2026-09-05 16:30",
                "item": "Autoclave Sterilizer Unit #2",
                "action": "Routine Maintenance Completed",
                "actor": "MedTech Services",
            },
        ],
    )
