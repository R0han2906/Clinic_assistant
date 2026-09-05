import pytest
from fastapi import status

def test_request_id_middleware_and_headers(client):
    """Verifies that all responses include the X-Request-ID header."""
    res = client.get("/health")
    assert res.status_code == status.HTTP_200_OK
    assert "X-Request-ID" in res.headers
    assert len(res.headers["X-Request-ID"]) > 10

def test_not_found_error_structure(client):
    """Verifies that 404 responses include structured error_code and request_id."""
    res = client.get("/api/v1/patients/PAT-999999")
    assert res.status_code == status.HTTP_404_NOT_FOUND
    data = res.json()
    assert data["error_code"] == "NOT_FOUND"
    assert data["error_type"] == "ResourceNotFoundError"
    assert "detail" in data
    assert "request_id" in data

def test_slot_conflict_error_code(client):
    """Verifies that booking conflict returns structured 409 with SLOT_UNAVAILABLE."""
    # Register patient
    p_res = client.post("/api/v1/patients", json={
        "full_name": "Conflict Tester",
        "dob_or_age": "30",
        "phone": "+91 9999900001"
    })
    p_id = p_res.json()["patient_id"]

    # Book slot
    client.post("/api/v1/appointments", json={
        "patient_id": p_id,
        "dentist_id": "DOC-000001",
        "date": "2026-09-16",
        "start_time": "10:00",
        "end_time": "10:30"
    })

    # Attempt second booking on same slot
    res_conflict = client.post("/api/v1/appointments", json={
        "patient_id": p_id,
        "dentist_id": "DOC-000001",
        "date": "2026-09-16",
        "start_time": "10:00",
        "end_time": "10:30"
    })
    assert res_conflict.status_code == status.HTTP_409_CONFLICT
    err = res_conflict.json()
    assert err["error_code"] == "SLOT_UNAVAILABLE"
    assert err["error_type"] == "SlotConflictError"
