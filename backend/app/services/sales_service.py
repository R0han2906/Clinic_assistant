from typing import List, Optional
from app.repositories.base import BaseClinicRepository
from app.models.sales import (
    SaleResponse, SaleCreate, SaleSummary, PaymentMethodResponse
)
from app.core.exceptions import ResourceNotFoundError

class SalesService:
    def __init__(self, repository: BaseClinicRepository):
        self.repository = repository

    def list_sales(
        self,
        date: Optional[str] = None,
        patient_id: Optional[str] = None,
        status: Optional[str] = None
    ) -> List[SaleResponse]:
        return self.repository.list_sales(date=date, patient_id=patient_id, status=status)

    def get_sale(self, sale_id: str) -> SaleResponse:
        sale = self.repository.get_sale(sale_id)
        if not sale:
            raise ResourceNotFoundError("Sale", sale_id)
        return sale

    def record_sale(self, sale_data: SaleCreate) -> SaleResponse:
        return self.repository.create_sale(sale_data)

    def update_sale_status(self, sale_id: str, status: str) -> SaleResponse:
        updated = self.repository.update_sale_status(sale_id, status)
        if not updated:
            raise ResourceNotFoundError("Sale", sale_id)
        return updated

    def get_summary(self) -> SaleSummary:
        return self.repository.get_sales_summary()

    def list_payment_methods(self) -> List[PaymentMethodResponse]:
        return self.repository.list_payment_methods()

    def update_payment_method(
        self, method_id: str, enabled: Optional[bool] = None, processing_fee: Optional[str] = None
    ) -> PaymentMethodResponse:
        updated = self.repository.update_payment_method(method_id, enabled, processing_fee)
        if not updated:
            raise ResourceNotFoundError("PaymentMethod", method_id)
        return updated
