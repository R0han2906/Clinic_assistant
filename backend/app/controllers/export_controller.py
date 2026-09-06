import io
import csv
from typing import Optional
from fastapi import APIRouter, Depends, Query, Response
from app.repositories import get_repository
from app.repositories.base import BaseClinicRepository

router = APIRouter(prefix="/export", tags=["Reports & Data Exports"])

def create_csv_response(filename: str, fieldnames: list, rows: list) -> Response:
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()
    for row in rows:
        # Convert row model to dict if needed
        data = row.model_dump() if hasattr(row, "model_dump") else dict(row)
        writer.writerow(data)

    content = output.getvalue()
    return Response(
        content=content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Cache-Control": "no-cache"
        }
    )

@router.get("/patients.csv")
def export_patients_csv(repo: BaseClinicRepository = Depends(get_repository)):
    """Exports all registered patients to CSV."""
    patients = repo.list_patients()
    fields = [
        "patient_id", "full_name", "dob_or_age", "phone", "email",
        "emergency_contact", "gender", "address", "allergies", "medical_conditions", "consent_status"
    ]
    return create_csv_response("patients_export.csv", fields, patients)

@router.get("/appointments.csv")
def export_appointments_csv(
    date: Optional[str] = Query(None, description="Optional date filter YYYY-MM-DD"),
    dentist_id: Optional[str] = Query(None),
    repo: BaseClinicRepository = Depends(get_repository)
):
    """Exports appointments to CSV with optional date filter."""
    appointments = repo.list_appointments(date=date, dentist_id=dentist_id)
    fields = [
        "appointment_id", "patient_id", "dentist_id", "date", "start_time", "end_time",
        "treatment_name", "status", "payment_status", "bill_number", "booking_time", "notes"
    ]
    filename = f"appointments_{date}.csv" if date else "appointments_export.csv"
    return create_csv_response(filename, fields, appointments)

@router.get("/sales.csv")
def export_sales_csv(
    status: Optional[str] = Query(None),
    repo: BaseClinicRepository = Depends(get_repository)
):
    """Exports billing and sales records to CSV."""
    sales = repo.list_sales(status=status)
    fields = [
        "sale_id", "appointment_id", "patient_id", "patient_name", "treatment_name",
        "amount", "status", "payment_method", "bill_number", "sale_date", "notes"
    ]
    return create_csv_response("sales_report.csv", fields, sales)

@router.get("/inventory.csv")
def export_inventory_csv(repo: BaseClinicRepository = Depends(get_repository)):
    """Exports current inventory stock levels to CSV."""
    inventory = repo.list_inventory()
    fields = [
        "item_id", "name", "category", "quantity", "min_stock", "unit", "unit_price", "supplier"
    ]
    return create_csv_response("inventory_report.csv", fields, inventory)

@router.get("/purchases.csv")
def export_purchases_csv(repo: BaseClinicRepository = Depends(get_repository)):
    """Exports purchase orders to CSV."""
    purchases = repo.list_purchases()
    fields = [
        "purchase_id", "vendor_name", "items", "amount", "status", "order_date", "received_date", "notes"
    ]
    return create_csv_response("purchases_report.csv", fields, purchases)
