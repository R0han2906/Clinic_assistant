from typing import Dict, List, Any
from datetime import datetime

# Canonical sheet names
SHEET_PATIENTS = "Patients"
SHEET_VISITS = "Visits"
SHEET_DENTISTS = "Dentists"
SHEET_AVAILABILITY = "Availability"
SHEET_LEAVES = "Leaves"
SHEET_APPOINTMENTS = "Appointments"
SHEET_STAFF = "Staff"
SHEET_AUDIT = "AuditLog"
SHEET_METADATA = "Metadata"
SHEET_CHECKUPS = "MedicalCheckups"
SHEET_TREATMENTS = "Treatments"
SHEET_PATIENT_REQUESTS = "PatientRequests"

ALL_SHEETS = [
    SHEET_PATIENTS,
    SHEET_VISITS,
    SHEET_DENTISTS,
    SHEET_AVAILABILITY,
    SHEET_LEAVES,
    SHEET_APPOINTMENTS,
    SHEET_STAFF,
    SHEET_AUDIT,
    SHEET_METADATA,
    SHEET_CHECKUPS,
    SHEET_TREATMENTS,
    SHEET_PATIENT_REQUESTS
]

# Column definitions for each sheet
SHEET_COLUMNS: Dict[str, List[str]] = {
    SHEET_PATIENTS: [
        "patient_id", "full_name", "dob_or_age", "phone", "email",
        "emergency_contact", "gender", "address", "allergies", "medical_conditions",
        "consent_status", "created_at", "updated_at"
    ],
    SHEET_VISITS: [
        "visit_id", "patient_id", "visit_date", "dentist_id",
        "visit_type", "summary", "follow_up_recommendation", "created_at"
    ],
    SHEET_DENTISTS: [
        "dentist_id", "name", "specialty", "phone", "email",
        "color_code", "is_active", "created_at"
    ],
    SHEET_AVAILABILITY: [
        "availability_id", "dentist_id", "day_of_week", "start_time",
        "end_time", "break_start", "break_end", "is_working_day"
    ],
    SHEET_LEAVES: [
        "leave_id", "dentist_id", "start_date", "end_date",
        "reason", "created_at"
    ],
    SHEET_APPOINTMENTS: [
        "appointment_id", "patient_id", "dentist_id", "date",
        "start_time", "end_time", "booking_time", "treatment_name", "source",
        "payment_status", "bill_number", "clinical_notes",
        "status", "reason", "notes", "created_at", "updated_at"
    ],
    SHEET_CHECKUPS: [
        "checkup_id", "patient_id", "appointment_id", "dentist_id",
        "blood_pressure", "medical_conditions", "allergies", "oral_hygiene_habits",
        "teeth_findings_json", "canker_sores", "canker_sores_notes",
        "anomalous_teeth", "anomalous_teeth_notes", "other_oral_notes",
        "consent_status", "refusal_reason", "status", "created_at", "updated_at"
    ],
    SHEET_TREATMENTS: [
        "treatment_id", "name", "category", "default_duration_minutes",
        "estimated_cost", "description"
    ],
    SHEET_PATIENT_REQUESTS: [
        "request_id", "patient_name", "patient_phone", "patient_age", "patient_id",
        "dentist_id", "preferred_date", "preferred_start_time", "preferred_end_time",
        "booking_time", "reason", "source", "status", "review_notes", "appointment_id",
        "created_at", "updated_at"
    ],
    SHEET_STAFF: [
        "staff_id", "username", "full_name", "role", "is_active", "created_at"
    ],
    SHEET_AUDIT: [
        "log_id", "timestamp", "staff_id", "entity_type", "entity_id",
        "action", "details"
    ],
    SHEET_METADATA: [
        "key", "value", "updated_at"
    ]
}

# Initial seed data for a fresh dental clinic setup
DEFAULT_DENTISTS = [
    {
        "dentist_id": "DOC-000001",
        "name": "Drg Soap Mactavish",
        "specialty": "Chief Dentist & Orthodontics",
        "phone": "+62 812-3456-7890",
        "email": "soap.mactavish@zendenta.local",
        "color_code": "#2563eb",
        "is_active": True,
        "created_at": datetime.now().isoformat()
    },
    {
        "dentist_id": "DOC-000002",
        "name": "Drg Jerald O'Hara",
        "specialty": "Endodontist & Oral Surgery",
        "phone": "+62 812-3456-7891",
        "email": "jerald.ohara@zendenta.local",
        "color_code": "#059669",
        "is_active": True,
        "created_at": datetime.now().isoformat()
    },
    {
        "dentist_id": "DOC-000003",
        "name": "Drg Putri Larasati",
        "specialty": "Pediatric & Restorative Dentistry",
        "phone": "+62 812-3456-7892",
        "email": "putri.larasati@zendenta.local",
        "color_code": "#d97706",
        "is_active": True,
        "created_at": datetime.now().isoformat()
    }
]

# Standard working hours (Monday to Saturday: 09:00 - 17:00, lunch 13:00 - 14:00; Sunday off)
DEFAULT_AVAILABILITY = []
avail_counter = 1
for dentist in DEFAULT_DENTISTS:
    for day in range(7):  # 0=Monday, 6=Sunday
        is_working = (day < 6)  # Mon-Sat working, Sun off
        DEFAULT_AVAILABILITY.append({
            "availability_id": f"AVL-{avail_counter:06d}",
            "dentist_id": dentist["dentist_id"],
            "day_of_week": day,
            "start_time": "09:00" if is_working else "00:00",
            "end_time": "17:00" if is_working else "00:00",
            "break_start": "13:00" if is_working else "",
            "break_end": "14:00" if is_working else "",
            "is_working_day": is_working
        })
        avail_counter += 1

DEFAULT_METADATA = [
    {"key": "schema_version", "value": "1.0.0", "updated_at": datetime.now().isoformat()},
    {"key": "clinic_name", "value": "SmileCare Dental Clinic", "updated_at": datetime.now().isoformat()},
    {"key": "timezone", "value": "Asia/Kolkata", "updated_at": datetime.now().isoformat()},
    {"key": "slot_duration_minutes", "value": "30", "updated_at": datetime.now().isoformat()},
    {"key": "workbook_version", "value": "1", "updated_at": datetime.now().isoformat()}
]

DEFAULT_TREATMENTS = [
    {
        "treatment_id": "TRT-001",
        "name": "Tooth Scaling",
        "category": "Preventive",
        "default_duration_minutes": 30,
        "estimated_cost": 120.0,
        "description": "Ultrasonic scaling and tartar removal to maintain periodontal health."
    },
    {
        "treatment_id": "TRT-002",
        "name": "General Checkup",
        "category": "Diagnostic",
        "default_duration_minutes": 30,
        "estimated_cost": 50.0,
        "description": "Comprehensive clinical and visual dental checkup."
    },
    {
        "treatment_id": "TRT-003",
        "name": "Bleaching",
        "category": "Cosmetic",
        "default_duration_minutes": 60,
        "estimated_cost": 250.0,
        "description": "Professional in-clinic laser or chemical tooth bleaching."
    },
    {
        "treatment_id": "TRT-004",
        "name": "Dental Extraction",
        "category": "Surgery",
        "default_duration_minutes": 45,
        "estimated_cost": 150.0,
        "description": "Safe extraction of diseased, impacted, or unrestorable teeth."
    },
    {
        "treatment_id": "TRT-005",
        "name": "Tooth Filling (Composite)",
        "category": "Restorative",
        "default_duration_minutes": 45,
        "estimated_cost": 180.0,
        "description": "Tooth-colored composite resin restoration for cavities and caries."
    },
    {
        "treatment_id": "TRT-006",
        "name": "Root Canal Treatment",
        "category": "Endodontics",
        "default_duration_minutes": 60,
        "estimated_cost": 350.0,
        "description": "Pulp extirpation, cleaning, and obturation for infected root canals."
    },
    {
        "treatment_id": "TRT-007",
        "name": "Crown & Bridge",
        "category": "Prosthodontics",
        "default_duration_minutes": 60,
        "estimated_cost": 500.0,
        "description": "Zirconia or porcelain crown fabrication for damaged teeth."
    }
]

DEFAULT_PATIENTS = [
    {
        "patient_id": "PAT-000001",
        "full_name": "Rafli Jainudin",
        "dob_or_age": "28",
        "phone": "+62 812-1111-2222",
        "email": "rafli.jainudin@example.com",
        "emergency_contact": "+62 812-9999-0001",
        "gender": "Male",
        "address": "Jl. Sudirman No. 42, Jakarta",
        "allergies": "None",
        "medical_conditions": "None",
        "consent_status": "acknowledged",
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    },
    {
        "patient_id": "PAT-000002",
        "full_name": "Siti Rahma",
        "dob_or_age": "34",
        "phone": "+62 812-3333-4444",
        "email": "siti.rahma@example.com",
        "emergency_contact": "+62 812-9999-0002",
        "gender": "Female",
        "address": "Jl. Gatot Subroto No. 12, Jakarta",
        "allergies": "Penicillin",
        "medical_conditions": "Hypertension",
        "consent_status": "acknowledged",
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    },
    {
        "patient_id": "PAT-000003",
        "full_name": "Sekar Nandita",
        "dob_or_age": "26",
        "phone": "+62 812-4444-5555",
        "email": "sekar.nandita@example.com",
        "emergency_contact": "+62 812-9999-0003",
        "gender": "Female",
        "address": "Jl. Thamrin No. 8, Jakarta",
        "allergies": "None",
        "medical_conditions": "None",
        "consent_status": "acknowledged",
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    },
    {
        "patient_id": "PAT-000004",
        "full_name": "Budi Santoso",
        "dob_or_age": "42",
        "phone": "+62 812-5555-6666",
        "email": "budi.santoso@example.com",
        "emergency_contact": "+62 812-9999-0004",
        "gender": "Male",
        "address": "Jl. Rasuna Said No. 5, Jakarta",
        "allergies": "None",
        "medical_conditions": "Diabetes Mellitus",
        "consent_status": "acknowledged",
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    },
    {
        "patient_id": "PAT-000005",
        "full_name": "Daniswara",
        "dob_or_age": "32",
        "phone": "+62 812-6666-7777",
        "email": "daniswara@example.com",
        "emergency_contact": "+62 812-9999-0005",
        "gender": "Male",
        "address": "Jl. Senopati No. 18, Jakarta",
        "allergies": "Aspirin",
        "medical_conditions": "None",
        "consent_status": "acknowledged",
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    },
    {
        "patient_id": "PAT-000006",
        "full_name": "Christopher Smallwood",
        "dob_or_age": "31",
        "phone": "+62 812-7777-8888",
        "email": "christopher.smallwood@example.com",
        "emergency_contact": "+62 812-9999-0006",
        "gender": "Male",
        "address": "Jl. Kemang Raya No. 88, Jakarta",
        "allergies": "Latex",
        "medical_conditions": "Asthma",
        "consent_status": "acknowledged",
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }
]

today_str = datetime.now().strftime("%Y-%m-%d")
DEFAULT_APPOINTMENTS = [
    {
        "appointment_id": "APT-000001",
        "patient_id": "PAT-000001",
        "dentist_id": "DOC-000001",
        "date": today_str,
        "start_time": "09:00",
        "end_time": "10:00",
        "treatment_name": "Teeth Cleaning & Scaling",
        "source": "MANUAL APPOINTMENT",
        "payment_status": "PAID",
        "bill_number": "Bill #10101",
        "clinical_notes": "Scaling completed thoroughly.",
        "status": "completed",
        "reason": "Routine prophylaxis",
        "notes": "Arrived on time",
        "booking_time": datetime.now().isoformat(),
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    },
    {
        "appointment_id": "APT-000002",
        "patient_id": "PAT-000003",
        "dentist_id": "DOC-000001",
        "date": today_str,
        "start_time": "10:00",
        "end_time": "11:00",
        "treatment_name": "General Consultation",
        "source": "MANUAL APPOINTMENT",
        "payment_status": "UNPAID",
        "bill_number": "Bill #10102",
        "clinical_notes": "In chair examining upper right.",
        "status": "in-progress",
        "reason": "Toothache #16",
        "notes": "Patient in operatory",
        "booking_time": datetime.now().isoformat(),
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    },
    {
        "appointment_id": "APT-000003",
        "patient_id": "PAT-000004",
        "dentist_id": "DOC-000002",
        "date": today_str,
        "start_time": "11:00",
        "end_time": "12:00",
        "treatment_name": "Dental Filling",
        "source": "WALK_IN",
        "payment_status": "UNPAID",
        "bill_number": "Bill #10103",
        "clinical_notes": "Verified insurance in lobby.",
        "status": "checked-in",
        "reason": "Filling cracked",
        "notes": "Walk-in arrival",
        "booking_time": datetime.now().isoformat(),
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    },
    {
        "appointment_id": "APT-000004",
        "patient_id": "PAT-000006",
        "dentist_id": "DOC-000003",
        "date": today_str,
        "start_time": "14:00",
        "end_time": "15:00",
        "treatment_name": "Tooth Extraction",
        "source": "ONLINE",
        "payment_status": "UNPAID",
        "bill_number": "Bill #10104",
        "clinical_notes": "",
        "status": "scheduled",
        "reason": "Wisdom tooth extraction",
        "notes": "Confirmed via SMS",
        "booking_time": datetime.now().isoformat(),
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    },
    {
        "appointment_id": "APT-000005",
        "patient_id": "PAT-000002",
        "dentist_id": "DOC-000001",
        "date": today_str,
        "start_time": "15:00",
        "end_time": "16:00",
        "treatment_name": "Teeth Whitening",
        "source": "MANUAL APPOINTMENT",
        "payment_status": "UNPAID",
        "bill_number": "Bill #10105",
        "clinical_notes": "",
        "status": "scheduled",
        "reason": "Laser bleaching session",
        "notes": "Second session",
        "booking_time": datetime.now().isoformat(),
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }
]


