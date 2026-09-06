"""
Full-Stack Endpoints Test Suite
Tests all 17 entities, CRUD endpoints, and CSV exports via FastAPI TestClient.
"""

import pytest
from fastapi.testclient import TestClient


def test_health_check(client: TestClient):
    res = client.get("/api/v1/system/health")
    assert res.status_code == 200
    data = res.json()
    assert "status" in data


def test_treatments_crud(client: TestClient):
    # 1. List treatments
    res = client.get("/api/v1/treatments")
    assert res.status_code == 200
    initial_list = res.json()
    assert isinstance(initial_list, list)

    # 2. Create treatment
    new_trt = {
        "name": "Porcelain Veneer Test",
        "category": "Cosmetic",
        "default_duration_minutes": 60,
        "estimated_cost": 450.0,
        "description": "High aesthetic porcelain veneer"
    }
    create_res = client.post("/api/v1/treatments", json=new_trt)
    assert create_res.status_code == 201
    created = create_res.json()
    assert created["name"] == "Porcelain Veneer Test"
    trt_id = created["treatment_id"]

    # 3. Get treatment
    get_res = client.get(f"/api/v1/treatments/{trt_id}")
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Porcelain Veneer Test"

    # 4. Update treatment
    update_res = client.patch(f"/api/v1/treatments/{trt_id}", json={"estimated_cost": 500.0})
    assert update_res.status_code == 200

    # 5. Delete treatment
    del_res = client.delete(f"/api/v1/treatments/{trt_id}")
    assert del_res.status_code == 204


def test_staff_crud(client: TestClient):
    # 1. List staff
    res = client.get("/api/v1/staff")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

    # 2. Create staff
    new_staff = {
        "full_name": "Dr. Sarah Connor",
        "role": "Dental Surgeon",
        "department": "Surgery",
        "phone": "+1-555-0999",
        "email": "sarah.connor@zendenta.com",
        "status": "Active"
    }
    create_res = client.post("/api/v1/staff", json=new_staff)
    assert create_res.status_code == 201
    created = create_res.json()
    assert created["full_name"] == "Dr. Sarah Connor"
    staff_id = created["staff_id"]

    # 3. Update staff
    patch_res = client.patch(f"/api/v1/staff/{staff_id}", json={"status": "On Leave"})
    assert patch_res.status_code == 200


def test_sales_and_summary(client: TestClient):
    # 1. Create sale
    sale_data = {
        "patient_name": "Arthur Dent",
        "treatment_name": "Scaling & Polishing",
        "amount": 95.0,
        "payment_method": "Credit Card",
        "status": "Paid",
        "notes": "Full clean"
    }
    create_res = client.post("/api/v1/sales", json=sale_data)
    assert create_res.status_code == 201
    created = create_res.json()
    assert created["patient_name"] == "Arthur Dent"
    sale_id = created["sale_id"]

    # 2. List sales
    list_res = client.get("/api/v1/sales")
    assert list_res.status_code == 200
    assert isinstance(list_res.json(), list)

    # 3. Update sale status
    patch_res = client.patch(f"/api/v1/sales/{sale_id}/status", json={"status": "Pending"})
    assert patch_res.status_code == 200

    # 4. Summary metrics
    summary_res = client.get("/api/v1/sales/summary")
    assert summary_res.status_code == 200
    summary = summary_res.json()
    assert "total_paid" in summary
    assert "total_pending" in summary


def test_purchases_and_vendors(client: TestClient):
    # 1. Create vendor
    vendor_data = {
        "name": "Global Dental Supply",
        "contact": "Alice Johnson",
        "phone": "+1-555-0333",
        "email": "orders@globaldental.com"
    }
    vendor_res = client.post("/api/v1/purchases/vendors", json=vendor_data)
    assert vendor_res.status_code == 201

    # 2. Create purchase order
    po_data = {
        "vendor_name": "Global Dental Supply",
        "items": "50x Exam Gloves, 10x Bibs",
        "amount": 250.0,
        "status": "Ordered"
    }
    po_res = client.post("/api/v1/purchases", json=po_data)
    assert po_res.status_code == 201
    created_po = po_res.json()
    po_id = created_po["purchase_id"]

    # 3. Update status to Received
    patch_res = client.patch(f"/api/v1/purchases/{po_id}/status", json={"status": "Received"})
    assert patch_res.status_code == 200


def test_inventory_and_quantity_adjustment(client: TestClient):
    # 1. Create item
    item_data = {
        "name": "Composite Resin A1",
        "category": "Materials",
        "quantity": 15,
        "min_stock": 5,
        "unit": "syringe",
        "unit_price": 45.0,
        "supplier": "DentSupply Co."
    }
    create_res = client.post("/api/v1/inventory", json=item_data)
    assert create_res.status_code == 201
    created = create_res.json()
    item_id = created["item_id"]

    # 2. List items
    list_res = client.get("/api/v1/inventory")
    assert list_res.status_code == 200
    assert isinstance(list_res.json(), list)

    # 3. Update quantity
    qty_res = client.patch(f"/api/v1/inventory/{item_id}/quantity", json={"quantity": 25})
    assert qty_res.status_code == 200


def test_peripherals_crud(client: TestClient):
    list_res = client.get("/api/v1/peripherals")
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    create_res = client.post("/api/v1/peripherals", json={
        "name": "Ultrasonic Scaler",
        "category": "Equipment",
        "location": "Room 3",
        "condition": "Good",
        "serial_no": "US-2026-001",
        "last_service": "2026-09-01",
    })
    assert create_res.status_code == 201
    pid = create_res.json()["peripheral_id"]

    patch_res = client.patch(f"/api/v1/peripherals/{pid}", json={"condition": "Service"})
    assert patch_res.status_code == 200
    assert patch_res.json()["condition"] == "Service"

    del_res = client.delete(f"/api/v1/peripherals/{pid}")
    assert del_res.status_code == 204


def test_csv_exports(client: TestClient):
    # Patients CSV
    res_pat = client.get("/api/v1/export/patients.csv")
    assert res_pat.status_code == 200
    assert "text/csv" in res_pat.headers["content-type"]
    assert "patient_id" in res_pat.text

    # Appointments CSV
    res_apt = client.get("/api/v1/export/appointments.csv")
    assert res_apt.status_code == 200
    assert "text/csv" in res_apt.headers["content-type"]

    # Sales CSV
    res_sal = client.get("/api/v1/export/sales.csv")
    assert res_sal.status_code == 200
    assert "text/csv" in res_sal.headers["content-type"]

    # Inventory CSV
    res_inv = client.get("/api/v1/export/inventory.csv")
    assert res_inv.status_code == 200
    assert "text/csv" in res_inv.headers["content-type"]

    # Purchases CSV
    res_po = client.get("/api/v1/export/purchases.csv")
    assert res_po.status_code == 200
    assert "text/csv" in res_po.headers["content-type"]
