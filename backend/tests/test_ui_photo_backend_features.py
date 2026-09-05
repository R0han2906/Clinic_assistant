import pytest
from fastapi import status

def test_treatments_catalog(client):
    """Verifies that the dental treatments catalog returns standard clinic procedures."""
    res = client.get("/api/treatments")
    assert res.status_code == status.HTTP_200_OK
    treatments = res.json()
    assert len(treatments) >= 5
    names = [t["name"] for t in treatments]
    assert "Tooth Scaling" in names
    assert "General Checkup" in names
    assert "Dental Extraction" in names

def test_patient_extended_fields_from_photos(client):
    """Verifies patient creation and retrieval with gender, address, allergies, and conditions."""
    payload = {
        "full_name": "Christopher Smallwood",
        "dob_or_age": "2002-01-21",
        "phone": "+1 (409)-832-3913",
        "email": "christopherw12@mail.com",
        "gender": "Male",
        "address": "4337 Lynn Ogden Lane, Beaumont, TX 77701",
        "allergies": "Penicillin",
        "medical_conditions": "Heart Disease, Hepatitis",
        "consent_status": "acknowledged"
    }
    res = client.post("/api/patients", json=payload)
    assert res.status_code == status.HTTP_201_CREATED
    patient = res.json()
    assert patient["gender"] == "Male"
    assert "Beaumont" in patient["address"]
    assert patient["allergies"] == "Penicillin"

    # Fetch patient profile
    p_id = patient["patient_id"]
    get_res = client.get(f"/api/patients/{p_id}")
    assert get_res.status_code == status.HTTP_200_OK
    data = get_res.json()
    assert data["full_name"] == "Christopher Smallwood"
    assert data["gender"] == "Male"
    assert data["address"] == "4337 Lynn Ogden Lane, Beaumont, TX 77701"

def test_appointment_treatment_billing_and_reminders(client):
    """Verifies booking with treatment name, source, bill reference, payment updates, and reminders."""
    # Register patient
    p_res = client.post("/api/patients", json={
        "full_name": "Sekar Nandita",
        "dob_or_age": "28",
        "phone": "+1 (409)-555-0199",
        "gender": "Female",
        "address": "845 Euclid Avenue, CA"
    })
    p_id = p_res.json()["patient_id"]

    # Book Tooth Scaling
    apt_payload = {
        "patient_id": p_id,
        "dentist_id": "DOC-000001",
        "date": "2026-09-10",
        "start_time": "10:00",
        "end_time": "11:00",
        "treatment_name": "Tooth Scaling",
        "source": "MANUAL APPOINTMENT",
        "payment_status": "UNPAID",
        "bill_number": "Bill #10102",
        "reason": "Routine scaling and tartar cleaning"
    }
    book_res = client.post("/api/appointments", json=apt_payload)
    assert book_res.status_code == status.HTTP_201_CREATED
    apt = book_res.json()
    apt_id = apt["appointment_id"]
    assert apt["treatment_name"] == "Tooth Scaling"
    assert apt["bill_number"] == "Bill #10102"
    assert apt["payment_status"] == "UNPAID"

    # Send payment reminder
    remind_res = client.post(f"/api/appointments/{apt_id}/remind-payment")
    assert remind_res.status_code == status.HTTP_200_OK
    remind_data = remind_res.json()
    assert remind_data["appointment_id"] == apt_id
    assert "Bill #10102" in remind_data["message"]

    # Update payment status
    pay_res = client.patch(f"/api/appointments/{apt_id}/payment", json={
        "payment_status": "PAID",
        "bill_number": "Bill #10102"
    })
    assert pay_res.status_code == status.HTTP_200_OK
    assert pay_res.json()["payment_status"] == "PAID"

def test_medical_checkup_and_odontogram_flow(client):
    """
    Verifies the 4-step medical checkup & odontogram engine:
    Step 1: Medical data (Blood Pressure, conditions, allergies)
    Step 2: 32-tooth odontogram findings
    Step 3: Oral check (canker sores, anomalous teeth)
    Step 4: Plan agreement & consent
    """
    # Create patient and appointment
    p_res = client.post("/api/patients", json={
        "full_name": "Daniswara",
        "dob_or_age": "32",
        "phone": "+1 (409)-888-7777"
    })
    p_id = p_res.json()["patient_id"]

    apt_res = client.post("/api/appointments", json={
        "patient_id": p_id,
        "dentist_id": "DOC-000001",
        "date": "2026-09-12",
        "start_time": "14:30",
        "end_time": "15:30",
        "treatment_name": "General Checkup"
    })
    apt_id = apt_res.json()["appointment_id"]

    # Save 4-step Medical Checkup
    checkup_payload = {
        "patient_id": p_id,
        "appointment_id": apt_id,
        "dentist_id": "DOC-000001",
        "dentist_name": "Dr. Sarah Jenkins",
        "blood_pressure": "130/80",
        "medical_conditions": ["Heart Disease", "Hepatitis"],
        "allergies": "Local Anesthetics",
        "oral_hygiene_habits": "Brushes once daily, uses soft bristle",
        "teeth_findings": [
            {
                "tooth_number": 18,
                "tooth_name": "2nd Molar",
                "condition": "Caries",
                "treatment": "Tooth filling",
                "notes": "Occlusal caries detected",
                "status_category": "recent_findings"
            },
            {
                "tooth_number": 34,
                "tooth_name": "Lateral Incisor",
                "condition": "Non vital",
                "treatment": "Replace tooth",
                "notes": "Sick tooth, so we can filling this tooth for repair",
                "status_category": "recommended_treatment"
            }
        ],
        "canker_sores": True,
        "canker_sores_notes": "The lower and upper lips have canker sores",
        "anomalous_teeth": False,
        "other_oral_notes": "Moderate tartar buildup on lower anteriors",
        "consent_status": "approved",
        "status": "completed"
    }
    save_res = client.post("/api/checkups", json=checkup_payload)
    assert save_res.status_code == status.HTTP_201_CREATED
    chk = save_res.json()
    assert chk["checkup_id"].startswith("CHK-")
    assert chk["blood_pressure"] == "130/80"
    assert len(chk["teeth_findings"]) == 2
    assert chk["teeth_findings"][0]["tooth_number"] == 18
    assert chk["canker_sores"] is True

    # Retrieve checkup by appointment
    apt_chk_res = client.get(f"/api/checkups/appointment/{apt_id}")
    assert apt_chk_res.status_code == status.HTTP_200_OK
    assert apt_chk_res.json()["checkup_id"] == chk["checkup_id"]

    # Verify that the appointment received the clinical summary banner and status
    apt_get_res = client.get(f"/api/appointments/{apt_id}")
    assert apt_get_res.status_code == status.HTTP_200_OK
    apt_data = apt_get_res.json()
    assert apt_data["clinical_notes"] == "The lower and upper lips have canker sores"
    assert apt_data["status"] == "finished"

    # Retrieve checkup by patient ID
    p_chk_res = client.get(f"/api/checkups/patient/{p_id}")
    assert p_chk_res.status_code == status.HTTP_200_OK
    assert len(p_chk_res.json()) == 1
