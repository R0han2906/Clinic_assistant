from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from app.models.sales import (
    SaleResponse, SaleCreate, SaleStatusUpdate, SaleSummary,
    PaymentMethodResponse, PaymentMethodUpdate
)
from app.services import get_sales_service, SalesService

router = APIRouter(prefix="/sales", tags=["Sales & Billing"])

@router.get("", response_model=List[SaleResponse])
def list_sales(
    date: Optional[str] = Query(None, description="Filter by sale date YYYY-MM-DD"),
    patient_id: Optional[str] = Query(None, description="Filter by patient ID"),
    status: Optional[str] = Query(None, description="Filter by status: Paid, Pending, Overdue"),
    service: SalesService = Depends(get_sales_service)
):
    """Lists sales and billing records with optional filters."""
    return service.list_sales(date=date, patient_id=patient_id, status=status)

@router.get("/summary", response_model=SaleSummary)
def get_sales_summary(
    service: SalesService = Depends(get_sales_service)
):
    """Returns revenue summary metrics: total paid, pending, overdue."""
    return service.get_summary()

@router.get("/payment-methods", response_model=List[PaymentMethodResponse])
def list_payment_methods(
    service: SalesService = Depends(get_sales_service)
):
    """Returns active payment methods configured in the clinic."""
    return service.list_payment_methods()

@router.patch("/payment-methods/{method_id}", response_model=PaymentMethodResponse)
def update_payment_method(
    method_id: str,
    updates: PaymentMethodUpdate,
    service: SalesService = Depends(get_sales_service)
):
    """Updates payment method settings (enabled / fee)."""
    return service.update_payment_method(method_id, updates.enabled, updates.processing_fee)

@router.get("/{sale_id}", response_model=SaleResponse)
def get_sale(
    sale_id: str,
    service: SalesService = Depends(get_sales_service)
):
    """Returns details for a specific sale record."""
    return service.get_sale(sale_id)

@router.post("", response_model=SaleResponse, status_code=status.HTTP_201_CREATED)
def record_sale(
    sale_data: SaleCreate,
    service: SalesService = Depends(get_sales_service)
):
    """Records a new treatment sale or bill."""
    return service.record_sale(sale_data)

@router.patch("/{sale_id}/status", response_model=SaleResponse)
def update_sale_status(
    sale_id: str,
    update: SaleStatusUpdate,
    service: SalesService = Depends(get_sales_service)
):
    """Updates the payment status of a sale (Paid / Pending / Overdue)."""
    return service.update_sale_status(sale_id, update.status)
