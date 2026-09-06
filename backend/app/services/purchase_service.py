from typing import List, Optional
from app.repositories.base import BaseClinicRepository
from app.models.purchase import PurchaseResponse, PurchaseCreate, VendorResponse, VendorCreate
from app.core.exceptions import ResourceNotFoundError

class PurchaseService:
    def __init__(self, repository: BaseClinicRepository):
        self.repository = repository

    def list_purchases(self, status: Optional[str] = None) -> List[PurchaseResponse]:
        return self.repository.list_purchases(status=status)

    def get_purchase(self, purchase_id: str) -> PurchaseResponse:
        po = self.repository.get_purchase(purchase_id)
        if not po:
            raise ResourceNotFoundError("Purchase", purchase_id)
        return po

    def create_purchase(self, purchase_data: PurchaseCreate) -> PurchaseResponse:
        return self.repository.create_purchase(purchase_data)

    def update_purchase_status(
        self, purchase_id: str, status: str, received_date: Optional[str] = None
    ) -> PurchaseResponse:
        updated = self.repository.update_purchase_status(purchase_id, status, received_date)
        if not updated:
            raise ResourceNotFoundError("Purchase", purchase_id)
        return updated

    def list_vendors(self) -> List[VendorResponse]:
        return self.repository.list_vendors()

    def create_vendor(self, vendor_data: VendorCreate) -> VendorResponse:
        return self.repository.create_vendor(vendor_data)
