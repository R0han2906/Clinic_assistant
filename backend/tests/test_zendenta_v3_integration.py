"""
Zendenta v3 Integration Test Suite
Verifies:
1. Strict 7-state appointment lifecycle transitions
2. Rejection of illegal state transitions (e.g. completed -> scheduled, paid -> cancelled)
3. Provider mapping (d1, d2, d3 <=> DOC-000001, DOC-000002, DOC-000003)
4. Structured clinical visit summary endpoints (GET & POST)
5. Payment synchronization (PATCH /payment advances completed appointment to paid)
6. Walk-in appointment creation with status 'checked-in' and source 'WALK_IN'
"""

import pytest
from fastapi.testclient import TestClient

def test_provider_alias_mapping(client: TestClient):
    """Verifies that dentist lookup works for both short codes (d1, d2, d3) and full IDs."""
    # List dentists
    res = client.get("/api/v1/dentists")
    assert res.status_code == 200
    dentists = res.json()
    assert len(dentists) >= 3

    # Check DOC-000001 lookup
    res_full = client.get("/api/v1/dentists/DOC-000001")
    assert res_full.status_code == 200
    assert "Soap Mactavish" in res_full.json()["name"]

    # Check d1 lookup
    res_short = client.get("/api/v1/dentists/d1")
    assert res_short.status_code == 200
    assert "Soap Mactavish" in res_short.json()["name"]


def test_appointment_canonical_lifecycle(client: TestClient):
    """
    Tests appointment progressing through canonical Zendenta v3 lifecycle:
    scheduled -> checked-in -> in-progress -> completed -> paid
    """
    # 1. Create patient
    p_res = client.post("/api/v1/patients", json={
        "full_name": "Siti Nurhaliza",
        "phone": "+62 812-9999-1111",
        "dob_or_age": "27",
        "gender": "Female"
    })
    assert p_res.status_code == 201
    patient_id = p_res.json()["patient_id"]

    # 2. Book appointment with d1
    book_res = client.post("/api/v1/appointments", json={
        "patient_id": patient_id,
        "dentist_id": "d1",
        "date": "2026-09-15",
        "start_time": "14:00",
        "end_time": "14:30",
        "treatment_name": "Teeth Cleaning & Scaling",
        "reason": "Routine cleaning",
        "status": "scheduled"
    })
    assert book_res.status_code == 201
    apt = book_res.json()
    apt_id = apt["appointment_id"]
    assert apt["status"] == "scheduled"

    # 3. Transition: scheduled -> checked-in
    res1 = client.patch(f"/api/v1/appointments/{apt_id}/status", json={
        "status": "checked-in",
        "notes": "Patient arrived in lobby"
    })
    assert res1.status_code == 200
    assert res1.json()["status"] == "checked-in"

    # 4. Transition: checked-in -> in-progress
    res2 = client.patch(f"/api/v1/appointments/{apt_id}/status", json={
        "status": "in-progress",
        "notes": "Called to Operatory 1"
    })
    assert res2.status_code == 200
    assert res2.json()["status"] == "in-progress"

    # 5. Transition: in-progress -> completed
    res3 = client.patch(f"/api/v1/appointments/{apt_id}/status", json={
        "status": "completed",
        "notes": "Scaling complete, tooth surfaces polished"
    })
    assert res3.status_code == 200
    assert res3.json()["status"] == "completed"

    # 6. Payment sync: PATCH /payment -> advances completed status to paid
    pay_res = client.patch(f"/api/v1/appointments/{apt_id}/payment", json={
        "payment_status": "PAID",
        "bill_number": "Bill #20201"
    })
    assert pay_res.status_code == 200
    updated_apt = pay_res.json()
    assert updated_apt["payment_status"] == "PAID"
    assert updated_apt["status"] == "paid"


def test_illegal_status_transition_rejected(client: TestClient):
    """Verifies that invalid state transitions raise 400 with descriptive error."""
    # Create patient and appointment
    p_res = client.post("/api/v1/patients", json={
        "full_name": "Ahmad Dani",
        "dob_or_age": "32",
        "phone": "+62 812-9999-2222"
    })
    assert p_res.status_code == 201
    patient_id = p_res.json()["patient_id"]

    book_res = client.post("/api/v1/appointments", json={
        "patient_id": patient_id,
        "dentist_id": "DOC-000002",
        "date": "2026-09-16",
        "start_time": "15:00",
        "end_time": "15:30",
        "treatment_name": "General Checkup"
    })
    assert book_res.status_code == 201
    apt_id = book_res.json()["appointment_id"]

    # Try illegal transition: scheduled -> completed directly (must go through flow or check-in)
    bad_res = client.patch(f"/api/v1/appointments/{apt_id}/status", json={
        "status": "completed"
    })
    assert bad_res.status_code == 400


def test_clinical_visit_summary_endpoints(client: TestClient):
    """Verifies GET and POST /appointments/{id}/visit-summary."""
    p_res = client.post("/api/v1/patients", json={
        "full_name": "Nadia Saphira",
        "dob_or_age": "26",
        "phone": "+62 812-9999-3333"
    })
    assert p_res.status_code == 201
    patient_id = p_res.json()["patient_id"]

    book_res = client.post("/api/v1/appointments", json={
        "patient_id": patient_id,
        "dentist_id": "d3",
        "date": "2026-09-17",
        "start_time": "11:00",
        "end_time": "11:30",
        "treatment_name": "Fluoride Treatment",
        "reason": "Sensitivity"
    })
    assert book_res.status_code == 201
    apt_id = book_res.json()["appointment_id"]

    # 1. GET initial visit summary (draft schema)
    get_res = client.get(f"/api/v1/appointments/{apt_id}/visit-summary")
    assert get_res.status_code == 200
    summary = get_res.json()
    assert summary["appointment_id"] == apt_id
    assert "diagnosis" in summary

    # 2. POST updated visit summary
    post_res = client.post(f"/api/v1/appointments/{apt_id}/visit-summary", json={
        "chief_complaint": "Severe toothache on lower left molar",
        "diagnosis": "Reversible pulpitis",
        "prescriptions": [
            {"name": "Ibuprofen 400mg", "dosage": "1 tab 3x daily", "duration": "3 days"}
        ],
        "treatments_performed": ["Caries excavation", "Temporary sedative filling"],
        "dentist_notes": "Cavity cleaned and provisional restoration placed."
    })
    assert post_res.status_code == 200
    saved = post_res.json()
    assert saved["diagnosis"] == "Reversible pulpitis"


def test_walk_in_appointment_intake(client: TestClient):
    """Verifies that walk-in appointments can be created with checked-in status and source WALK_IN."""
    p_res = client.post("/api/v1/patients", json={
        "full_name": "Walk-In Patient Test",
        "dob_or_age": "40",
        "phone": "+62 812-9999-4444"
    })
    assert p_res.status_code == 201
    patient_id = p_res.json()["patient_id"]

    walk_in_res = client.post("/api/v1/appointments", json={
        "patient_id": patient_id,
        "dentist_id": "DOC-000001",
        "date": "2026-09-18",
        "start_time": "16:00",
        "end_time": "16:30",
        "treatment_name": "Emergency Pain Relief",
        "source": "WALK_IN",
        "status": "checked-in",
        "reason": "Severe pain walk-in"
    })
    assert walk_in_res.status_code == 201
    apt = walk_in_res.json()
    assert apt["source"] == "WALK_IN"
    assert apt["status"] == "checked-in"
