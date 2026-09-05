import pytest
from fastapi import status

def test_api_health_check(client):
    res = client.get("/health")
    assert res.status_code == status.HTTP_200_OK
    assert res.json() == {"status": "ok"}

def test_api_system_health(client):
    res = client.get("/api/system/health")
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["status"] == "healthy"
    assert data["total_dentists"] == 2

def test_api_patient_lifecycle(client):
    # Register patient
    payload = {
        "full_name": "Pooja Hegde",
        "dob_or_age": "30",
        "phone": "+91 9000011111",
        "email": "pooja@example.com",
        "consent_status": "acknowledged",
        "force_create": False
    }
    res = client.post("/api/patients", json=payload)
    assert res.status_code == status.HTTP_201_CREATED
    data = res.json()
    patient_id = data["patient_id"]
    assert patient_id == "PAT-000001"

    # Get patient profile
    res_get = client.get(f"/api/patients/{patient_id}")
    assert res_get.status_code == status.HTTP_200_OK
    assert res_get.json()["full_name"] == "Pooja Hegde"

    # Add structured visit summary
    visit_payload = {
        "patient_id": patient_id,
        "visit_date": "2026-09-01",
        "dentist_id": "DOC-000001",
        "visit_type": "Initial Consultation",
        "summary": "Patient complained of mild tooth sensitivity in lower molar. Advised desensitizing paste.",
        "follow_up_recommendation": "Review in 2 weeks if pain persists."
    }
    res_visit = client.post(f"/api/patients/{patient_id}/visits", json=visit_payload)
    assert res_visit.status_code == status.HTTP_201_CREATED
    assert res_visit.json()["visit_id"] == "VIS-000001"

    # Retrieve visits
    res_visits_list = client.get(f"/api/patients/{patient_id}/visits")
    assert res_visits_list.status_code == status.HTTP_200_OK
    assert len(res_visits_list.json()) == 1

def test_api_availability_and_appointment_flow(client):
    # Register patient
    p_res = client.post("/api/patients", json={
        "full_name": "Arjun Kapoor",
        "dob_or_age": "35",
        "phone": "+91 9222233333",
        "force_create": False
    })
    patient_id = p_res.json()["patient_id"]

    # Check available slots for a Monday
    slots_res = client.get("/api/availability/slots?date=2026-09-07&dentist_id=DOC-000001")
    assert slots_res.status_code == status.HTTP_200_OK
    slots = slots_res.json()
    assert len(slots) > 0
    first_slot = slots[0]

    # Book the slot
    book_payload = {
        "patient_id": patient_id,
        "dentist_id": "DOC-000001",
        "date": "2026-09-07",
        "start_time": first_slot["start_time"],
        "end_time": first_slot["end_time"],
        "reason": "Root Canal Consultation"
    }
    book_res = client.post("/api/appointments", json=book_payload)
    assert book_res.status_code == status.HTTP_201_CREATED
    apt_data = book_res.json()
    apt_id = apt_data["appointment_id"]
    assert apt_data["status"] == "confirmed"

    # Check slots again: booked slot should no longer be present
    slots_res_after = client.get("/api/availability/slots?date=2026-09-07&dentist_id=DOC-000001")
    slots_after = slots_res_after.json()
    slot_starts = [s["start_time"] for s in slots_after]
    assert first_slot["start_time"] not in slot_starts

    # Reschedule appointment
    reschedule_payload = {
        "new_date": "2026-09-08",
        "new_start_time": "11:00",
        "new_end_time": "11:30",
        "reschedule_reason": "Patient requested next day"
    }
    resched_res = client.post(f"/api/appointments/{apt_id}/reschedule", json=reschedule_payload)
    assert resched_res.status_code == status.HTTP_200_OK
    assert resched_res.json()["status"] == "rescheduled"
    assert resched_res.json()["date"] == "2026-09-08"

def test_update_patient_details(client):
    """Verifies updating patient contact and demographic details via PATCH."""
    # Register patient
    reg_res = client.post("/api/patients", json={
        "full_name": "Vikram Seth",
        "dob_or_age": "35",
        "phone": "+91 9887766554"
    })
    p_id = reg_res.json()["patient_id"]

    # Update patient details
    update_res = client.patch(f"/api/patients/{p_id}", json={
        "phone": "+91 9999988888",
        "address": "Flat 4B, Lotus Apartments",
        "allergies": "Sulfa drugs"
    })
    assert update_res.status_code == status.HTTP_200_OK
    data = update_res.json()
    assert data["phone"] == "+91 9999988888"
    assert data["address"] == "Flat 4B, Lotus Apartments"
    assert data["allergies"] == "Sulfa drugs"
    assert data["full_name"] == "Vikram Seth"

def test_cancel_appointment_endpoint(client):
    """Verifies appointment cancellation endpoint."""
    p_res = client.post("/api/patients", json={
        "full_name": "Meera Patel",
        "dob_or_age": "29",
        "phone": "+91 9776655443"
    })
    p_id = p_res.json()["patient_id"]

    apt_res = client.post("/api/appointments", json={
        "patient_id": p_id,
        "dentist_id": "DOC-000001",
        "date": "2026-09-12",
        "start_time": "14:00",
        "end_time": "14:30",
        "reason": "Teeth whitening"
    })
    apt_id = apt_res.json()["appointment_id"]

    cancel_res = client.post(f"/api/appointments/{apt_id}/cancel", json={"reason": "Patient conflict"})
    assert cancel_res.status_code == status.HTTP_200_OK
    assert cancel_res.json()["status"] == "cancelled"

def test_cancel_patient_request_endpoint(client):
    """Verifies patient request cancellation endpoint."""
    req_res = client.post("/api/v1/patient-requests", json={
        "patient_name": "Rohan Sen",
        "patient_phone": "+91 9112233445",
        "patient_age": "40",
        "dentist_id": "DOC-000001",
        "preferred_date": "2026-09-15",
        "preferred_start_time": "10:00",
        "preferred_end_time": "10:30",
        "reason": "Checkup"
    })
    req_id = req_res.json()["request_id"]

    cancel_res = client.post(f"/api/v1/patient-requests/{req_id}/cancel", json={"review_notes": "Cancelled by patient"})
    assert cancel_res.status_code == status.HTTP_200_OK
    assert cancel_res.json()["status"] == "cancelled"
