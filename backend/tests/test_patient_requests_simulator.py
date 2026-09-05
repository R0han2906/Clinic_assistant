import pytest
from fastapi import status

def test_simulator_patient_request_lifecycle(client):
    """
    Verifies the complete lifecycle of a Patient Request:
    1. Submission from simulator (/api/v1/patient-requests)
    2. Listing pending requests
    3. Staff one-click approval -> creates patient & confirms appointment (APT-XXXXXX)
    """
    # 1. Submit request via Simulator API (versioned /api/v1)
    req_payload = {
        "patient_name": "Aarav Gupta",
        "patient_phone": "+91 9876500001",
        "patient_age": "28",
        "dentist_id": "DOC-000001",
        "preferred_date": "2026-09-14",
        "preferred_start_time": "10:00",
        "preferred_end_time": "10:30",
        "reason": "Bleeding gums and sensitivity",
        "source": "simulator"
    }
    create_res = client.post("/api/v1/patient-requests", json=req_payload)
    assert create_res.status_code == status.HTTP_201_CREATED
    req_data = create_res.json()
    assert req_data["request_id"].startswith("REQ-")
    assert req_data["status"] == "pending"
    assert req_data["patient_name"] == "Aarav Gupta"
    req_id = req_data["request_id"]

    # Also verify backward-compatible endpoint /api/patient-requests
    compat_res = client.get(f"/api/patient-requests/{req_id}")
    assert compat_res.status_code == status.HTTP_200_OK
    assert compat_res.json()["request_id"] == req_id

    # 2. List pending requests
    list_res = client.get("/api/v1/patient-requests?status=pending")
    assert list_res.status_code == status.HTTP_200_OK
    requests = list_res.json()
    assert len(requests) >= 1
    assert any(r["request_id"] == req_id for r in requests)

    # 3. Staff approves request
    approve_res = client.post(f"/api/v1/patient-requests/{req_id}/approve", json={
        "review_notes": "Confirmed by front desk reception."
    })
    assert approve_res.status_code == status.HTTP_200_OK
    data = approve_res.json()
    assert data["patient_request"]["status"] == "approved"
    assert data["patient_request"]["appointment_id"] is not None
    assert data["appointment"]["status"] == "confirmed"
    assert data["appointment"]["date"] == "2026-09-14"

    # Verify that the slot is now blocked on availability
    slots_res = client.get("/api/v1/availability/slots?date=2026-09-14&dentist_id=DOC-000001")
    assert slots_res.status_code == status.HTTP_200_OK
    booked_slots = [s["start_time"] for s in slots_res.json()]
    assert "10:00" not in booked_slots


def test_simulator_patient_request_rejection(client):
    """Verifies rejecting a request with staff reason."""
    req_payload = {
        "patient_name": "Siddharth Rao",
        "patient_phone": "+91 9876500002",
        "dentist_id": "DOC-000001",
        "preferred_date": "2026-09-15",
        "preferred_start_time": "11:00",
        "preferred_end_time": "11:30",
        "reason": "Wisdom tooth pain"
    }
    create_res = client.post("/api/v1/patient-requests", json=req_payload)
    assert create_res.status_code == status.HTTP_201_CREATED
    req_id = create_res.json()["request_id"]

    reject_res = client.post(f"/api/v1/patient-requests/{req_id}/reject", json={
        "review_notes": "Patient requested slot outside clinic operating hours."
    })
    assert reject_res.status_code == status.HTTP_200_OK
    assert reject_res.json()["status"] == "rejected"
    assert "operating hours" in reject_res.json()["review_notes"]


def test_simulator_unavailable_slot_conflict(client):
    """Submitting a request for an invalid or non-working day returns 409 conflict."""
    # Sunday (2026-09-13 is Sunday)
    req_payload = {
        "patient_name": "Sunday Caller",
        "patient_phone": "+91 9876500003",
        "dentist_id": "DOC-000001",
        "preferred_date": "2026-09-13",
        "preferred_start_time": "10:00",
        "preferred_end_time": "10:30"
    }
    res = client.post("/api/v1/patient-requests", json=req_payload)
    assert res.status_code == status.HTTP_409_CONFLICT


def test_simulator_patient_request_cancellation(client):
    """Verifies cancelling a simulator patient request before or after approval."""
    req_payload = {
        "patient_name": "Kavita Reddy",
        "patient_phone": "+91 9876500099",
        "dentist_id": "DOC-000001",
        "preferred_date": "2026-09-17",
        "preferred_start_time": "14:00",
        "preferred_end_time": "14:30",
        "reason": "Teeth cleaning"
    }
    create_res = client.post("/api/v1/patient-requests", json=req_payload)
    assert create_res.status_code == status.HTTP_201_CREATED
    req_id = create_res.json()["request_id"]

    cancel_res = client.post(f"/api/v1/patient-requests/{req_id}/cancel", json={"review_notes": "Cancelled by patient"})
    assert cancel_res.status_code == status.HTTP_200_OK
    assert cancel_res.json()["status"] == "cancelled"
    assert cancel_res.json()["review_notes"] == "Cancelled by patient"

