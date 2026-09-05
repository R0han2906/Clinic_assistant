"""
CLI Tool: Create Demo Workbook
Initializes clinic_data.xlsx with sample dentists, working hours, treatment catalog, and demo data.
"""
import sys
from pathlib import Path
from datetime import datetime, date

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.core.config import settings
from app.repositories.excel_repository import ExcelClinicRepository
from app.models.patient import PatientCreate
from app.models.appointment import AppointmentCreate

def create_demo_workbook():
    print(f"[*] Initializing demo workbook at: {settings.WORKBOOK_PATH}")
    repo = ExcelClinicRepository(
        workbook_path=settings.WORKBOOK_PATH,
        backup_dir=settings.BACKUP_DIR
    )

    # Seed demo patients if none exist
    patients = repo.list_patients()
    if not patients:
        print("[*] Seeding demo patients...")
        p1 = repo.create_patient(PatientCreate(
            full_name="Rahul Sharma",
            dob_or_age="1992-05-14",
            phone="+91 9988776655",
            email="rahul.sharma@example.com",
            gender="Male",
            address="12 MG Road, Bangalore",
            allergies="Penicillin"
        ))
        p2 = repo.create_patient(PatientCreate(
            full_name="Pooja Hegde",
            dob_or_age="1996-10-22",
            phone="+91 9876543210",
            email="pooja.h@example.com",
            gender="Female",
            address="45 Residency Road, Bangalore"
        ))
        print(f"[✓] Created demo patients: {p1.patient_id}, {p2.patient_id}")

        # Seed demo appointment
        today_str = date.today().isoformat()
        apt = repo.create_appointment(AppointmentCreate(
            patient_id=p1.patient_id,
            dentist_id="DOC-000001",
            date=today_str,
            start_time="10:00",
            end_time="10:30",
            reason="Routine Checkup",
            treatment_name="General Checkup",
            source="STAFF_DESK"
        ))
        print(f"[✓] Created demo appointment: {apt.appointment_id} on {today_str} at 10:00")

    print("[✓] Demo workbook setup complete.")

if __name__ == "__main__":
    create_demo_workbook()
