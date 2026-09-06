from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from app.models.purchase import (
    PurchaseResponse, PurchaseCreate, PurchaseStatusUpdate,
    VendorResponse, VendorCreate
)
from app.services import get_purchase_service, PurchaseService

router = APIRouter(prefix="/purchases", tags=["Purchases & Vendors"])

@router.get("", response_model=List[PurchaseResponse])
def list_purchases(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status: Ordered, Pending, Received"),
    service: PurchaseService = Depends(get_purchase_service)
):
    """Lists purchase orders."""
    return service.list_purchases(status=status_filter)

@router.get("/vendors", response_model=List[VendorResponse])
def list_vendors(
    service: PurchaseService = Depends(get_purchase_service)
):
    """Lists registered vendors/suppliers."""
    return service.list_vendors()

@router.post("/vendors", response_model=VendorResponse, status_code=status.HTTP_201_CREATED)
def create_vendor(
    vendor_data: VendorCreate,
    service: PurchaseService = Depends(get_purchase_service)
):
    """Registers a new vendor/supplier."""
    return service.create_vendor(vendor_data)

@router.get("/{purchase_id}", response_model=PurchaseResponse)
def get_purchase(
    purchase_id: str,
    service: PurchaseService = Depends(get_purchase_service)
):
    """Returns details of a specific purchase order."""
    return service.get_purchase(purchase_id)

@router.post("", response_model=PurchaseResponse, status_code=status.HTTP_201_CREATED)
def create_purchase(
    purchase_data: PurchaseCreate,
    service: PurchaseService = Depends(get_purchase_service)
):
    """Creates a new purchase order for clinic supplies."""
    return service.create_purchase(purchase_data)

@router.patch("/{purchase_id}/status", response_model=PurchaseResponse)
def update_purchase_status(
    purchase_id: str,
    update: PurchaseStatusUpdate,
    service: PurchaseService = Depends(get_purchase_service)
):
    """Updates the status of a purchase order (e.g. mark Received)."""
    return service.update_purchase_status(purchase_id, update.status, update.received_date)
