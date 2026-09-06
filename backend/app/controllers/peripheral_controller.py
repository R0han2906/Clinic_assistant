from typing import List
from fastapi import APIRouter, Depends, status
from app.models.peripheral import PeripheralResponse, PeripheralCreate, PeripheralUpdate
from app.services import get_peripheral_service, PeripheralService

router = APIRouter(prefix="/peripherals", tags=["Peripherals & Equipment"])


@router.get("", response_model=List[PeripheralResponse])
def list_peripherals(service: PeripheralService = Depends(get_peripheral_service)):
    """Lists clinic equipment and peripheral assets."""
    return service.list_peripherals()


@router.get("/{peripheral_id}", response_model=PeripheralResponse)
def get_peripheral(
    peripheral_id: str,
    service: PeripheralService = Depends(get_peripheral_service)
):
    return service.get_item(peripheral_id)


@router.post("", response_model=PeripheralResponse, status_code=status.HTTP_201_CREATED)
def create_peripheral(
    item_data: PeripheralCreate,
    service: PeripheralService = Depends(get_peripheral_service)
):
    return service.create_item(item_data)


@router.patch("/{peripheral_id}", response_model=PeripheralResponse)
def update_peripheral(
    peripheral_id: str,
    updates: PeripheralUpdate,
    service: PeripheralService = Depends(get_peripheral_service)
):
    return service.update_item(peripheral_id, updates)


@router.delete("/{peripheral_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_peripheral(
    peripheral_id: str,
    service: PeripheralService = Depends(get_peripheral_service)
):
    service.delete_item(peripheral_id)
    return None
