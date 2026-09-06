"""
Script to create test data for: Naman
Adds:
1. Patient record for Naman with complete contact & medical profile
2. Scheduled appointment for Naman with an on-duty dentist
3. Clinical visit summary for Naman
4. Paid sale / invoice record for Naman

Usage:
    cd backend
    python scripts/add_test_data_naman.py
"""

import sys
import os
from pathlib import Path
from datetime import datetime, timedelta

# Force UTF-8 encoding on Windows console
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# Setup python path to include backend root
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.repositories import get_repository
from app.models.patient import PatientCreate
from app.models.appointment import AppointmentCreate, AppointmentStatus
from app.models.visit import VisitCreate
from app.models.sales import SaleCreate
from app.core.exceptions import SlotConflictError


def add_testdata():
    print("=" * 60)
    print("        ADDING TEST DATA FOR: NAMAN")
    print("=" * 60)

    repo = get_repository()
    print(f"Using Repository: {repo.__class__.__name__}")

    # ---------------------------------------------------------
    # 1. Create or Find Patient: Naman
    # ---------------------------------------------------------
    print("\n[1/4] Registering Patient: Naman...")
    existing_patients = repo.find_patients("Naman")
    patient = None

    if existing_patients:
        patient = existing_patients[0]
        print(f"   Found existing patient: {patient.full_name} (ID: {patient.patient_id})")
    else:
        patient_data = PatientCreate(
            full_name="Naman",
            dob_or_age="26",
            phone="+91 9876543210",
            email="naman@example.com",
            emergency_contact="Priya Sharma (+91 9876543211)",
            gender="Male",
            address="Flat 402, Green Valley Apartments, Mumbai",
            allergies="None",
            medical_conditions="None",
            consent_status="acknowledged",
            force_create=True
        )
        patient = repo.create_patient(patient_data)
        print(f"   Patient created successfully!")
        print(f"   - Patient ID: {patient.patient_id}")
        print(f"   - Name:       {patient.full_name}")
        print(f"   - Phone:      {patient.phone}")
        print(f"   - Email:      {patient.email}")

    # ---------------------------------------------------------
    # 2. Select an Active Dentist
    # ---------------------------------------------------------
    dentists = repo.list_dentists(active_only=True)
    if not dentists:
        # Fallback list all
        dentists = repo.list_dentists(active_only=False)
    
    selected_dentist = dentists[0] if dentists else None
    dentist_id = selected_dentist.dentist_id if selected_dentist else "DOC-000001"
    dentist_name = selected_dentist.name if selected_dentist else "Dr. Sarah Jenkins"
    print(f"\n[2/4] Assigning Dentist: {dentist_name} ({dentist_id})")

    # ---------------------------------------------------------
    # 3. Create Appointment for Today
    # ---------------------------------------------------------
    today_str = datetime.now().strftime("%Y-%m-%d")
    print(f"\n[3/4] Booking Appointment for {today_str}...")

    # Candidate time slots to prevent slot conflict
    slots_to_try = [
        ("10:00", "10:30"),
        ("11:00", "11:30"),
        ("12:00", "12:30"),
        ("14:00", "14:30"),
        ("15:00", "15:30"),
        ("16:00", "16:30"),
        ("17:00", "17:30"),
    ]

    appointment = None
    bill_number = f"BILL-NAMAN-{datetime.now().strftime('%H%M%S')}"

    for start_t, end_t in slots_to_try:
        try:
            apt_data = AppointmentCreate(
                patient_id=patient.patient_id,
                dentist_id=dentist_id,
                date=today_str,
                start_time=start_t,
                end_time=end_t,
                treatment_name="Tooth Scaling & Polishing",
                source="MANUAL APPOINTMENT",
                payment_status="PAID",
                bill_number=bill_number,
                clinical_notes="Routine prophylaxis and stain removal for lower anterior teeth.",
                reason="Routine Dental Hygiene",
                notes="Patient requested morning checkup. Confirmed on WhatsApp.",
                booking_time=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            )
            appointment = repo.create_appointment(apt_data)
            print(f"   Appointment booked successfully!")
            print(f"   - Appointment ID: {appointment.appointment_id}")
            print(f"   - Date & Time:    {appointment.date} ({appointment.start_time} - {appointment.end_time})")
            print(f"   - Treatment:      {appointment.treatment_name}")
            print(f"   - Payment Status: {appointment.payment_status} ({bill_number})")
            break
        except SlotConflictError:
            continue
        except Exception as e:
            print(f"   Notice attempting slot {start_t}: {e}")
            continue

    if not appointment:
        print("   Notice: All default slots occupied for today. Appointment creation skipped.")

    # ---------------------------------------------------------
    # 4. Create Clinical Visit Record
    # ---------------------------------------------------------
    print("\n[4/4] Creating Clinical Visit & Invoice...")
    try:
        visit_data = VisitCreate(
            patient_id=patient.patient_id,
            visit_date=today_str,
            dentist_id=dentist_id,
            visit_type="Dental Cleaning & Examination",
            summary="Completed ultrasonic scaling and polishing. Plaque score is low. Advised soft-bristle toothbrush.",
            follow_up_recommendation="Next preventive review recommended in 6 months."
        )
        visit = repo.create_visit(visit_data)
        print(f"   Visit recorded successfully!")
        print(f"   - Visit ID:   {visit.visit_id}")
        print(f"   - Visit Type: {visit.visit_type}")
    except Exception as e:
        print(f"   Notice recording visit: {e}")

    # ---------------------------------------------------------
    # 5. Create Sale / Invoice
    # ---------------------------------------------------------
    try:
        sale_data = SaleCreate(
            patient_id=patient.patient_id,
            patient_name=patient.full_name,
            treatment_name="Tooth Scaling & Polishing",
            amount=120.0,
            status="Paid",
            payment_method="Credit Card",
            bill_number=bill_number,
            sale_date=today_str,
            notes="Full cleaning fee settled at front desk via card payment."
        )
        sale = repo.create_sale(sale_data)
        print(f"   Sale Invoice created successfully!")
        print(f"   - Sale ID:    {sale.sale_id}")
        print(f"   - Amount:     ${sale.amount:.2f}")
        print(f"   - Status:     {sale.status} ({sale.payment_method})")
    except Exception as e:
        print(f"   Notice creating sale: {e}")

    print("\n" + "=" * 60)
    print("   SUCCESS! Test data for NAMAN is ready in the system.")
    print("=" * 60)
    print("\nYou can immediately view Naman's records across the application:")
    print(f"  • Patients Directory:    http://localhost:3000/patients")
    print(f"  • Patient Detail Profile: http://localhost:3000/patients/{patient.patient_id}")
    print(f"  • Schedule Calendar:     http://localhost:3000/reservations")
    print(f"  • Sales & Invoices:      http://localhost:3000/sales")
    print(f"  • Main Dashboard:        http://localhost:3000/dashboard\n")


if __name__ == "__main__":
    add_testdata()
