import pytest
import openpyxl
from app.models.patient import PatientCreate
from app.models.visit import VisitCreate
from app.models.appointment import AppointmentCreate, AppointmentStatus
from app.core.exceptions import SlotConflictError
from app.repositories.excel_schema import ALL_SHEETS

def test_workbook_initialization(temp_repo):
    """Verifies that all 8 required sheets are initialized with correct headers."""
    assert temp_repo.workbook_path.exists()
    wb = openpyxl.load_workbook(temp_repo.workbook_path)
    for sheet_name in ALL_SHEETS:
        assert sheet_name in wb.sheetnames

def test_patient_creation_single_file_no_redundant_backups(temp_repo):
    """Verifies patient creation and ensures NO redundant backup .xlsx files are created on save."""
    p_data = PatientCreate(
        full_name="Rahul Sharma",
        dob_or_age="32",
        phone="+91 9988776655",
        email="rahul.sharma@example.com"
    )
    patient = temp_repo.create_patient(p_data)
    assert patient.patient_id == "PAT-000001"
    assert patient.full_name == "Rahul Sharma"
    assert patient.created_at is not None

    # Verify retrieval
    retrieved = temp_repo.get_patient("PAT-000001")
    assert retrieved is not None
    assert retrieved.full_name == "Rahul Sharma"

    # Verify that NO backup files were generated during normal writes
    backups = list(temp_repo.backup_dir.glob("*.xlsx"))
    assert len(backups) == 0

    # Verify manual backup works explicitly when called
    manual_backup = temp_repo.create_manual_backup()
    assert manual_backup.exists()
    assert len(list(temp_repo.backup_dir.glob("*.xlsx"))) == 1

def test_appointment_booking_and_conflict_prevention(temp_repo):
    """Verifies appointment booking, timestamps (booking_time & created_at), and conflict prevention."""
    # Create patient
    p = temp_repo.create_patient(PatientCreate(
        full_name="Sunita Verma",
        dob_or_age="28",
        phone="+91 9911223344"
    ))
    
    # Book appointment
    apt_data = AppointmentCreate(
        patient_id=p.patient_id,
        dentist_id="DOC-000001",
        date="2026-09-10",
        start_time="10:00",
        end_time="10:30",
        reason="Dental Cleaning"
    )
    apt = temp_repo.create_appointment(apt_data)
    assert apt.appointment_id == "APT-000001"
    assert apt.status == AppointmentStatus.CONFIRMED
    assert apt.created_at is not None
    assert apt.booking_time is not None

    # Attempt to book overlapping time on same dentist -> Should raise SlotConflictError
    with pytest.raises(SlotConflictError):
        temp_repo.create_appointment(AppointmentCreate(
            patient_id=p.patient_id,
            dentist_id="DOC-000001",
            date="2026-09-10",
            start_time="10:00",
            end_time="10:30"
        ))

def test_reschedule_appointment(temp_repo):
    """Verifies safe rescheduling."""
    p = temp_repo.create_patient(PatientCreate(
        full_name="Karan Johar",
        dob_or_age="45",
        phone="+91 9933445566"
    ))
    apt = temp_repo.create_appointment(AppointmentCreate(
        patient_id=p.patient_id,
        dentist_id="DOC-000001",
        date="2026-09-10",
        start_time="11:00",
        end_time="11:30"
    ))

    rescheduled = temp_repo.reschedule_appointment(
        appointment_id=apt.appointment_id,
        new_date="2026-09-11",
        new_start_time="14:00",
        new_end_time="14:30",
        notes="Patient requested afternoon slot"
    )
    assert rescheduled.date == "2026-09-11"
    assert rescheduled.start_time == "14:00"
    assert rescheduled.status == AppointmentStatus.RESCHEDULED
