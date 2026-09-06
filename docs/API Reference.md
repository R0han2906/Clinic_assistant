# DentalFlow Backend — Frontend API Reference

> **Base URL:** `http://127.0.0.1:8000`  
> **Versioned Base URL:** `http://127.0.0.1:8000/api/v1`  
> **Interactive Docs:** `http://127.0.0.1:8000/docs` (Swagger UI)  
> **Routing Support:** All endpoints are accessible both via `/api/v1/...` and legacy alias `/api/...`  
> **Tracing Header:** All responses return a unique `X-Request-ID` header  
> **All request/response bodies are `application/json`**

---

## CORS Policy

CORS is fully open for local development. The following is set in `app/app.py`:

```
Allow-Origins:     *  (all origins)
Allow-Methods:     *  (GET, POST, PUT, DELETE, OPTIONS, etc.)
Allow-Headers:     *  (all headers)
Allow-Credentials: true
```

You do **not** need to set any special headers for development.  
For production, update `allow_origins` in `app/app.py` to your specific frontend domain.

---

## Error Response Format

All errors return a JSON body with machine-readable error codes and request tracing:

```json
{
  "detail": "Human-readable error message",
  "error_code": "SLOT_UNAVAILABLE",
  "error_type": "SlotConflictError",
  "request_id": "9a2f7c4e-..."
}
```

| HTTP Status | Error Code | Meaning |
|---|---|---|
| `400` | `INVALID_TRANSITION` / `BAD_REQUEST` | Illegal entity state transition or bad payload |
| `404` | `NOT_FOUND` | Resource not found |
| `409` | `DUPLICATE_PATIENT` / `SLOT_UNAVAILABLE` | Duplicate patient detected or slot already taken |
| `422` | `VALIDATION_ERROR` | Pydantic validation error |
| `500` | `WORKBOOK_WRITE_FAILED` | Internal write failure |
| `503` | `WORKBOOK_LOCKED` | Workbook locked — operation in progress, retry |

---

## ID Format Reference

| Entity | ID Pattern | Example |
|---|---|---|
| Patient | `PAT-XXXXXX` | `PAT-000001` |
| Dentist | `DOC-XXXXXX` | `DOC-000001` |
| Appointment | `APT-XXXXXX` | `APT-000001` |
| Visit | `VIS-XXXXXX` | `VIS-000001` |
| Leave | `LVE-XXXXXX` | `LVE-000001` |
| Availability | `AVL-XXXXXX` | `AVL-000001` |
| Treatment | `TRT-XXXXXX` | `TRT-000001` |
| Medical Checkup | `CHK-XXXXXX` | `CHK-000001` |
| Patient Request | `REQ-XXXXXX` | `REQ-000001` |


---

## System

### `GET /health`
Lightness liveness ping — no database read.

**Response `200`:**
```json
{ "status": "ok" }
```

---

### `GET /api/system/health`
Full storage health check — reads the workbook and returns counts.

**Response `200`:**
```json
{
  "status": "healthy",
  "workbook_exists": true,
  "workbook_path": "C:\\...\\data\\clinic_data.xlsx",
  "total_patients": 5,
  "total_appointments": 12,
  "total_dentists": 2,
  "total_backups": 8,
  "last_checked": "2026-09-05T17:00:00.000000"
}
```

---

### `GET /api/system/export-workbook`
Downloads the raw Excel file.  
Response: binary `.xlsx` file (`Content-Disposition: attachment`).

---

## Patients

### `GET /api/patients`
List all patients or search by name / phone / ID.

**Query params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `query` | string | No | Search string — matches name, phone, email, or `PAT-XXXXXX` |

**Response `200` — array of Patient objects:**
```json
[
  {
    "patient_id": "PAT-000001",
    "full_name": "Rahul Sharma",
    "dob_or_age": "32",
    "phone": "+91 9988776655",
    "email": "rahul@example.com",
    "gender": "Male",
    "address": "123 Orchard Road, Singapore",
    "emergency_contact": null,
    "allergies": "Penicillin",
    "medical_conditions": "Hypertension",
    "consent_status": "acknowledged",
    "created_at": "2026-09-05T10:00:00.000000",
    "updated_at": "2026-09-05T10:00:00.000000"
  }
]
```

---

### `POST /api/patients`
Register a new patient. Checks for duplicates by phone and name first.

**Request body:**
```json
{
  "full_name": "Rahul Sharma",
  "dob_or_age": "32",
  "phone": "+91 9988776655",
  "email": "rahul@example.com",
  "gender": "Male",
  "address": "123 Orchard Road, Singapore",
  "emergency_contact": "Priya Sharma +91 9988776600",
  "allergies": "Penicillin",
  "medical_conditions": "Hypertension",
  "consent_status": "acknowledged",
  "force_create": false
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `full_name` | string | ✅ | Min 1 character |
| `dob_or_age` | string | ✅ | Either `"1994-03-15"` or `"32"` |
| `phone` | string | ✅ | Min 7 characters |
| `email` | string | No | |
| `gender` | string | No | e.g. `"Male"`, `"Female"`, `"Other"` |
| `address` | string | No | Residential/clinic address |
| `emergency_contact` | string | No | Free text |
| `allergies` | string | No | Known medical/drug allergies |
| `medical_conditions` | string | No | Known pre-existing conditions |
| `consent_status` | string | No | Defaults to `"acknowledged"` |
| `force_create` | boolean | No | Default `false`. Set `true` to bypass duplicate warning |

**Response `201`:** Full Patient object (same as GET response).

**Response `409` — Duplicate detected (when `force_create: false`):**
```json
{
  "detail": {
    "message": "Potential duplicate patient detected: Found 1 existing patient(s) with matching phone or name.",
    "is_potential_duplicate": true,
    "existing_matches": [
      {
        "patient_id": "PAT-000001",
        "full_name": "Rahul Sharma",
        "phone": "+91 9988776655",
        ...
      }
    ]
  }
}
```

> **Frontend flow:** Show the existing matches to staff and ask "Is this the same person?". If they confirm it's a new person, re-submit with `force_create: true`.

---

### `GET /api/patients/check-duplicate`
Pre-flight duplicate check before showing the registration form result.

**Query params:**

| Param | Type | Required |
|---|---|---|
| `phone` | string | ✅ |
| `name` | string | ✅ |

**Response `200`:**
```json
{
  "is_potential_duplicate": true,
  "matching_patients": [ { ...PatientObject } ],
  "message": "Potential duplicate patient detected: Found 1 existing patient(s)..."
}
```

---

### `GET /api/patients/{patient_id}`
Get a single patient profile.

**Response `200`:** Patient object.  
**Response `404`:** Patient not found.

---

### `PATCH /api/patients/{patient_id}` (or `PUT /api/patients/{patient_id}`)
Update demographics, contact details, address, or medical flags for an existing patient.

**Request body (all fields optional):**
```json
{
  "full_name": "Rahul Sharma",
  "dob_or_age": "33",
  "phone": "+91 9988776655",
  "email": "rahul.updated@example.com",
  "gender": "Male",
  "address": "456 Marina Boulevard, Singapore",
  "emergency_contact": "Anita Sharma +91 9876543210",
  "allergies": "Penicillin, Sulfa drugs",
  "medical_conditions": "Hypertension, Mild Asthma",
  "consent_status": "acknowledged"
}
```

**Response `200`:** Updated Patient object with refreshed `updated_at` timestamp.  
**Response `404`:** Patient not found.

---


### `GET /api/patients/{patient_id}/visits`
Get all previous visit summaries for a patient, sorted newest first.

**Response `200`:**
```json
[
  {
    "visit_id": "VIS-000001",
    "patient_id": "PAT-000001",
    "visit_date": "2026-09-01",
    "dentist_id": "DOC-000001",
    "dentist_name": "Dr. Sarah Jenkins",
    "visit_type": "Initial Consultation",
    "summary": "Patient complained of mild tooth sensitivity...",
    "follow_up_recommendation": "Review in 2 weeks if pain persists.",
    "created_at": "2026-09-01T14:00:00.000000"
  }
]
```

---

### `POST /api/patients/{patient_id}/visits`
Add a structured visit summary record.

**Request body:**
```json
{
  "patient_id": "PAT-000001",
  "visit_date": "2026-09-05",
  "dentist_id": "DOC-000001",
  "visit_type": "Cleaning",
  "summary": "Full mouth cleaning completed. Mild plaque buildup noted.",
  "follow_up_recommendation": "6-month routine checkup."
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `patient_id` | string | ✅ | Must match URL `patient_id` |
| `visit_date` | string | ✅ | `YYYY-MM-DD` |
| `dentist_id` | string | ✅ | e.g. `DOC-000001` |
| `visit_type` | string | ✅ | e.g. `Checkup`, `Cleaning`, `Root Canal`, `Extraction` |
| `summary` | string | ✅ | Admin clinical notes |
| `follow_up_recommendation` | string | No | |

**Response `201`:** Full Visit object.

---

## Dentists

### `GET /api/dentists`
List all active dentists.

**Response `200`:**
```json
[
  {
    "dentist_id": "DOC-000001",
    "name": "Dr. Sarah Jenkins",
    "specialty": "Chief Dentist & Orthodontics",
    "phone": "+91 9876543210",
    "email": "dr.jenkins@smilecare.local",
    "color_code": "#2B6CB0",
    "is_active": true,
    "created_at": "2026-09-05T00:00:00.000000"
  }
]
```

---

### `GET /api/dentists/{dentist_id}`
Get a single dentist profile.  
**Response `404`:** Dentist not found.

---

### `POST /api/dentists`
Register a new dentist.

**Request body:**
```json
{
  "name": "Dr. Priya Nair",
  "specialty": "Pediatric Dentistry",
  "phone": "+91 9876540000",
  "email": "dr.nair@smilecare.local",
  "color_code": "#9F7AEA",
  "is_active": true
}
```

**Response `201`:** Full Dentist object with `dentist_id`.

---

## Treatments

### `GET /api/treatments`
List the clinic's treatment and procedure catalog (e.g. Teeth Checkup, Dental Braces, Scaling & Polishing, Teeth Whitening).

**Query params:**

| Param | Type | Required | Notes |
|---|---|---|---|
| `category` | string | No | Filter by category (e.g. `General`, `Orthodontics`, `Preventive`, `Cosmetic`) |

**Response `200` — array of Treatment objects:**
```json
[
  {
    "treatment_id": "TRT-000001",
    "name": "Teeth Checkup",
    "category": "General",
    "default_duration_minutes": 30,
    "estimated_cost": 50.0,
    "description": "Comprehensive routine oral and dental examination"
  },
  {
    "treatment_id": "TRT-000002",
    "name": "Dental Braces",
    "category": "Orthodontics",
    "default_duration_minutes": 60,
    "estimated_cost": 2500.0,
    "description": "Orthodontic alignment consultation and fitting"
  }
]
```

---

## Dentist Schedule (Weekly Timetable)

The clinic sets working hours for each dentist per day of week.  
`day_of_week` values: `0=Monday`, `1=Tuesday`, ... `6=Sunday`

---

### `GET /api/dentists/{dentist_id}/schedule`
Get the full 7-day weekly schedule for a dentist.

**Response `200`:**
```json
[
  {
    "availability_id": "AVL-000001",
    "dentist_id": "DOC-000001",
    "day_of_week": 0,
    "start_time": "09:00",
    "end_time": "17:00",
    "break_start": "13:00",
    "break_end": "14:00",
    "is_working_day": true
  },
  {
    "availability_id": "AVL-000007",
    "dentist_id": "DOC-000001",
    "day_of_week": 6,
    "start_time": "00:00",
    "end_time": "00:00",
    "break_start": null,
    "break_end": null,
    "is_working_day": false
  }
]
```

---

### `PUT /api/dentists/{dentist_id}/schedule/{day_of_week}`
Update a single day's working schedule. Creates the row if it doesn't exist.

**Path param `day_of_week`:** integer `0–6`

**Request body:**
```json
{
  "start_time": "08:00",
  "end_time": "16:00",
  "break_start": "13:00",
  "break_end": "14:00",
  "is_working_day": true
}
```

To mark a day as **off** (no slots):
```json
{
  "start_time": "00:00",
  "end_time": "00:00",
  "break_start": null,
  "break_end": null,
  "is_working_day": false
}
```

**Response `200`:** Updated `WorkingScheduleItem` object.

---

## Dentist Leaves (Blocked Dates)

### `GET /api/dentists/{dentist_id}/leaves`
Get all leave periods registered for a dentist, sorted by start date.

**Response `200`:**
```json
[
  {
    "leave_id": "LVE-000001",
    "dentist_id": "DOC-000001",
    "start_date": "2026-09-10",
    "end_date": "2026-09-12",
    "reason": "Medical Conference",
    "created_at": "2026-09-05T18:00:00.000000"
  }
]
```

---

### `POST /api/dentists/{dentist_id}/leaves`
Block a dentist for a date range. Slot calculation automatically returns zero slots for blocked dates.

**Request body:**
```json
{
  "start_date": "2026-09-10",
  "end_date": "2026-09-12",
  "reason": "Medical Conference"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `start_date` | string | ✅ | `YYYY-MM-DD` |
| `end_date` | string | ✅ | `YYYY-MM-DD` (inclusive) |
| `reason` | string | No | Free text note |

**Response `201`:** Full `LeaveItem` object.

> **Effect on availability:** After posting a leave, `GET /api/availability/slots?date=2026-09-11&dentist_id=DOC-000001` will return `[]`.

---

## Availability

### `GET /api/availability/slots`
Compute all free, bookable 30-minute slots for a given date.

**The slot engine subtracts:**
1. Non-working days (`is_working_day: false`)
2. Break/lunch windows (`break_start` → `break_end`)
3. Approved leave periods
4. Already confirmed / pending / rescheduled appointments

**Query params:**

| Param | Type | Required | Notes |
|---|---|---|---|
| `date` | string | ✅ | `YYYY-MM-DD` |
| `dentist_id` | string | No | Filter to one dentist. Omit to get slots for all active dentists |
| `duration` | integer | No | Slot size in minutes. Default `30` |

**Response `200`:**
```json
[
  {
    "dentist_id": "DOC-000001",
    "dentist_name": "Dr. Sarah Jenkins",
    "date": "2026-09-07",
    "start_time": "09:00",
    "end_time": "09:30",
    "duration_minutes": 30,
    "is_available": true
  },
  {
    "dentist_id": "DOC-000001",
    "dentist_name": "Dr. Sarah Jenkins",
    "date": "2026-09-07",
    "start_time": "09:30",
    "end_time": "10:00",
    "duration_minutes": 30,
    "is_available": true
  }
]
```

Returns `[]` if:
- The date is a Sunday / non-working day
- The dentist is on approved leave
- All slots are already booked

---

## Appointments

### `GET /api/appointments`
List appointments with optional filters.

**Query params:**

| Param | Type | Notes |
|---|---|---|
| `date` | string | Filter by date `YYYY-MM-DD` |
| `dentist_id` | string | Filter by dentist |
| `patient_id` | string | Filter by patient |
| `status` | string | Filter by status: `confirmed`, `pending`, `registered`, `waiting_payment`, `finished`, `rescheduled`, `cancelled`, `completed`, `no_show` |

**Response `200` — array of Appointment objects:**
```json
[
  {
    "appointment_id": "APT-000001",
    "patient_id": "PAT-000001",
    "patient_name": "Rahul Sharma",
    "patient_phone": "+91 9988776655",
    "dentist_id": "DOC-000001",
    "dentist_name": "Dr. Sarah Jenkins",
    "date": "2026-09-07",
    "start_time": "09:00",
    "end_time": "09:30",
    "status": "confirmed",
    "reason": "Root Canal Consultation",
    "treatment_name": "Teeth Checkup",
    "source": "Web Booking",
    "payment_status": "unpaid",
    "bill_number": "INV-2026-001",
    "clinical_notes": "The lower and upper lips have canker sores",
    "notes": null,
    "created_at": "2026-09-05T18:00:00.000000",
    "updated_at": "2026-09-05T18:00:00.000000"
  }
]
```

---

### `GET /api/appointments/today`
Shortcut — returns all appointments for today's date.

**Response `200`:** Array of Appointment objects.

---

### `GET /api/appointments/{appointment_id}`
Get a single appointment by ID.  
**Response `404`:** Not found.

---

### `POST /api/appointments`
Book a new appointment. Automatically conflict-checks the dentist's schedule under lock.

**Request body:**
```json
{
  "patient_id": "PAT-000001",
  "dentist_id": "DOC-000001",
  "date": "2026-09-07",
  "start_time": "09:00",
  "end_time": "09:30",
  "reason": "Checkup",
  "treatment_name": "Teeth Checkup",
  "source": "Web Booking",
  "payment_status": "unpaid",
  "bill_number": "INV-2026-001",
  "clinical_notes": null,
  "notes": "Patient prefers morning slot"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `patient_id` | string | ✅ | Must exist |
| `dentist_id` | string | ✅ | Must exist |
| `date` | string | ✅ | `YYYY-MM-DD` |
| `start_time` | string | ✅ | `HH:MM` (24h) |
| `end_time` | string | ✅ | `HH:MM` (24h), must be after `start_time` |
| `reason` | string | No | Chief complaint |
| `treatment_name` | string | No | Selected procedure name from Treatments catalog |
| `source` | string | No | Booking source (e.g. `Web Booking`, `WhatsApp`, `Phone`, `Walk-in`) |
| `payment_status` | string | No | `unpaid`, `paid`, `refunded`, `pending` (defaults to `unpaid`) |
| `bill_number` | string | No | Invoice or billing identifier (e.g. `INV-2026-001`) |
| `clinical_notes` | string | No | Clinical highlights (displayed in Reservation Details drawer) |
| `notes` | string | No | Admin notes |

**Response `201`:** Full Appointment object with `status: "confirmed"`.  
**Response `409`:** Slot already taken — dentist has an overlapping confirmed/pending appointment.

---

### `PATCH /api/appointments/{appointment_id}/payment`
Update the payment and billing status of an appointment. If an appointment is in `completed` status and `payment_status` is updated to `PAID`, the appointment status is automatically advanced to `paid`.

**Request body:**
```json
{
  "payment_status": "PAID",
  "bill_number": "INV-2026-001"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `payment_status` | string | ✅ | `UNPAID`, `PAID`, `WAITING_PAYMENT`, `REFUNDED` |
| `bill_number` | string | No | Optional invoice tracking code (e.g. `Bill #10102`) |

**Response `200`:** Updated Appointment object.

---

### `PATCH /api/appointments/{appointment_id}/status`
Transitions an appointment across the **canonical 7 states** of the Zendenta v3 receptionist lifecycle:
`scheduled` → `checked-in` → `in-progress` → `completed` → `paid` (with `cancelled` and `no-show` branches).

**Allowed Transitions Table:**
| Current State | Allowed Next States |
|---|---|
| `scheduled` | `checked-in`, `in-progress`, `cancelled`, `no-show` |
| `checked-in` | `in-progress`, `cancelled`, `no-show`, `scheduled` |
| `in-progress` | `completed`, `cancelled` |
| `completed` | `paid` |
| `paid` | Terminal (no further transitions) |
| `cancelled` | Terminal (no further transitions) |
| `no-show` | Terminal (no further transitions) |

**Request body:**
```json
{
  "status": "checked-in",
  "notes": "Patient arrived at reception and verified insurance"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `status` | string | ✅ | One of: `scheduled`, `checked-in`, `in-progress`, `completed`, `paid`, `cancelled`, `no-show` |
| `notes` | string | No | Transition audit note appended to appointment history |

**Response `200`:** Updated Appointment object.  
**Response `400`:** `INVALID_TRANSITION` — illegal transition requested.

---

### `GET /api/appointments/{appointment_id}/visit-summary`
Retrieves structured clinical summary for an appointment. If a clinical visit has not been finalized yet, generates a structured clinical draft containing chief complaint, diagnosis, prescriptions, follow-up, and itemized billing.

**Response `200`:**
```json
{
  "appointment_id": "APT-000001",
  "patient_id": "PAT-000001",
  "patient_name": "Rafli Jainudin",
  "dentist_id": "DOC-000001",
  "dentist_name": "Drg Soap Mactavish",
  "date": "2026-09-06",
  "treatment_name": "Teeth Cleaning & Scaling",
  "chief_complaint": "Routine checkup and plaque removal",
  "diagnosis": "Healthy dentition, mild gingival inflammation resolved",
  "prescriptions": [],
  "treatments_performed": ["Teeth Cleaning & Scaling", "Polishing"],
  "follow_up": {
    "timeframe": "6 months",
    "notes": "Routine follow-up cleaning"
  },
  "dentist_notes": "Scaling completed smoothly. Oral hygiene instructions provided.",
  "billing": {
    "bill_number": "Bill #10101",
    "amount": 120.0,
    "status": "PAID"
  }
}
```

---

### `POST /api/appointments/{appointment_id}/visit-summary`
Persists or updates the clinical visit summary for an appointment, synchronizing the appointment's clinical notes banner and storing a persistent record in the Visits table.

**Request body:**
```json
{
  "chief_complaint": "Severe toothache on lower left molar",
  "diagnosis": "Reversible pulpitis",
  "prescriptions": [
    {
      "name": "Ibuprofen 400mg",
      "dosage": "1 tablet 3x daily",
      "duration": "3 days",
      "notes": "Take after meals"
    }
  ],
  "treatments_performed": ["Caries excavation", "Provisional restoration"],
  "follow_up": {
    "timeframe": "2 weeks",
    "notes": "Permanent composite filling review"
  },
  "dentist_notes": "Cavity debrided and sealed. Patient reported pain relief.",
  "billing": {
    "bill_number": "Bill #10105",
    "amount": 180.0,
    "status": "UNPAID"
  }
}
```

**Response `200`:** Updated `ClinicalVisitSummary` object.

---

### `POST /api/appointments/{appointment_id}/remind-payment`
Trigger a payment reminder message (SMS / WhatsApp notification simulation) to the patient for unpaid appointments.

**Response `200`:**
```json
{
  "status": "sent",
  "appointment_id": "APT-000001",
  "patient_name": "Rahul Sharma",
  "phone": "+91 9988776655",
  "bill_number": "INV-2026-001",
  "message": "Payment reminder sent to Rahul Sharma (+91 9988776655) for Bill INV-2026-001."
}
```

---

### `POST /api/appointments/{appointment_id}/reschedule`
Move an appointment to a new date/time or dentist.

**Request body:**
```json
{
  "new_date": "2026-09-08",
  "new_start_time": "11:00",
  "new_end_time": "11:30",
  "new_dentist_id": null,
  "reschedule_reason": "Patient requested next day"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `new_date` | string | ✅ | `YYYY-MM-DD` |
| `new_start_time` | string | ✅ | `HH:MM` |
| `new_end_time` | string | ✅ | `HH:MM` |
| `new_dentist_id` | string | No | Omit to keep same dentist |
| `reschedule_reason` | string | No | |

**Response `200`:** Updated Appointment object with `status: "rescheduled"`.  
**Response `409`:** New slot is already taken.

---

### `POST /api/appointments/{appointment_id}/cancel`
Cancel an appointment.

**Request body (optional):**
```json
{ "reason": "Patient called to cancel" }
```

**Response `200`:** Updated Appointment object with `status: "cancelled"`.

---

### `POST /api/appointments/{appointment_id}/complete`
Mark an appointment as completed after the patient visit.

**Request body (optional):**
```json
{ "notes": "Procedure completed successfully." }
```

**Response `200`:** Updated Appointment object with `status: "completed"`.

---

## Medical Checkups (Odontogram & Clinical Examination)

Powers the interactive 4-step clinical wizard from the clinical checkup UI frames.

### Checkup Wizard Steps:
1. **Patient Information & Vitals / History:** Sickness description, allergies, blood pressure, temperature, weight.
2. **Odontogram (Teeth Examination):** Detailed findings for standard adult 32-tooth odontogram (teeth 11–48) recording conditions like `healthy`, `cavity`, `missing`, `filling`, `crown`, `fractured`, etc.
3. **Oral Condition Check:** Inspection of lips, tongue, gums, palate, and canker sores.
4. **Treatment Plan & Informed Consent:** Final clinical notes, recommended treatments, and patient agreement.

> **Automatic Appointment Sync:** When a checkup is submitted via `POST /api/checkups`, the backend automatically extracts summary oral highlights (e.g. canker sore observations), updates the linked appointment's `clinical_notes`, and transitions the appointment status to `finished`.

---

### `POST /api/checkups`
Save a complete or in-progress clinical checkup.

**Request body:**
```json
{
  "appointment_id": "APT-000001",
  "patient_id": "PAT-000001",
  "dentist_id": "DOC-000001",
  "blood_pressure": "120/80",
  "temperature": "36.6",
  "weight_kg": "65.0",
  "sickness_description": "None reported",
  "allergies_description": "Penicillin",
  "tooth_findings": [
    {
      "tooth_number": 18,
      "condition": "cavity",
      "notes": "Mesial surface lesion"
    },
    {
      "tooth_number": 24,
      "condition": "healthy",
      "notes": null
    }
  ],
  "oral_conditions": {
    "lips": "Lower and upper lips have mild canker sores",
    "tongue": "Normal",
    "gums": "Mild gingivitis in quadrant 1",
    "palate": "Normal",
    "canker_sores": true
  },
  "plan_agreement_notes": "Patient agreed to composite restoration next week",
  "dentist_notes": "Prescribed antiseptic oral rinse",
  "is_completed": true
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `appointment_id` | string | ✅ | Linked appointment |
| `patient_id` | string | ✅ | Linked patient |
| `dentist_id` | string | ✅ | Attending dentist |
| `blood_pressure` | string | No | e.g. `"120/80"` |
| `temperature` | string | No | e.g. `"36.6"` |
| `weight_kg` | string | No | e.g. `"65.0"` |
| `sickness_description`| string | No | Step 1 medical complaints |
| `allergies_description`| string | No | Step 1 known allergies |
| `tooth_findings` | array | No | Step 2 odontogram list (`tooth_number`, `condition`, `notes`) |
| `oral_conditions` | object | No | Step 3 soft tissue & canker sore findings |
| `plan_agreement_notes` | string | No | Step 4 agreed care plan |
| `dentist_notes` | string | No | Final clinical observations |
| `is_completed` | boolean | No | Default `true`. Triggers appointment status to `finished` |

**Response `201`:** Full `MedicalCheckupResponse` object with `checkup_id: "CHK-000001"`.

---

### `GET /api/checkups/{checkup_id}`
Get a checkup record by its checkup ID (`CHK-XXXXXX`).

**Response `200`:** Medical Checkup object.  
**Response `404`:** Checkup not found.

---

### `GET /api/checkups/appointment/{appointment_id}`
Retrieve the checkup record associated with a specific appointment.

**Response `200`:** Medical Checkup object (or `null` if no checkup recorded yet).

---

### `GET /api/checkups/patient/{patient_id}`
Retrieve all checkup records for a patient, sorted newest first.

**Response `200`:** Array of Medical Checkup objects.

---

## Patient Requests (Simulator & WhatsApp)

Powers the Patient Request Simulator (and future WhatsApp webhook adapter). Allows patients to submit appointment booking requests that clinic staff can review, approve, or reject.

### `POST /api/v1/patient-requests`
Submit a new booking request. Automatically validates that the requested dentist has an available slot for the date and time.

**Request body:**
```json
{
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
```

**Response `201`:**
```json
{
  "request_id": "REQ-000001",
  "patient_name": "Aarav Gupta",
  "patient_phone": "+91 9876500001",
  "patient_age": "28",
  "patient_id": null,
  "dentist_id": "DOC-000001",
  "preferred_date": "2026-09-14",
  "preferred_start_time": "10:00",
  "preferred_end_time": "10:30",
  "reason": "Bleeding gums and sensitivity",
  "source": "simulator",
  "status": "pending",
  "review_notes": null,
  "appointment_id": null,
  "created_at": "2026-09-05T19:00:00.000000",
  "updated_at": "2026-09-05T19:00:00.000000"
}
```

---

### `GET /api/v1/patient-requests`
List all requests, sorted newest first. Optional filter by status: `?status=pending` (or `approved`, `rejected`).

**Response `200`:** Array of Patient Request objects.

---

### `GET /api/v1/patient-requests/{request_id}`
Retrieve details for a single request.

---

### `POST /api/v1/patient-requests/{request_id}/approve`
Staff one-click approval:
- Automatically creates or links the patient record
- Confirms and books the appointment under lock (`APT-XXXXXX`)
- Marks the request as `approved`

**Request body (optional):**
```json
{ "review_notes": "Confirmed by clinic reception." }
```

**Response `200`:**
```json
{
  "patient_request": {
    "request_id": "REQ-000001",
    "status": "approved",
    "appointment_id": "APT-000002"
  },
  "appointment": {
    "appointment_id": "APT-000002",
    "status": "confirmed"
  }
}
```

---

### `POST /api/v1/patient-requests/{request_id}/reject`
Staff rejects a request with an optional reason note.

**Request body (optional):**
```json
{ "review_notes": "Requested dentist is fully booked." }
```

**Response `200`:** Updated Patient Request object with `status: "rejected"`.

---

### `POST /api/v1/patient-requests/{request_id}/cancel`
Patient or staff cancels a request (used by simulator cancellation card).
If the request was already approved and linked to an appointment (`appointment_id`), the linked appointment is automatically cancelled as well.

**Request body (optional):**
```json
{ "review_notes": "Patient requested cancellation due to scheduling conflict." }
```

**Response `200`:** Updated Patient Request object with `status: "cancelled"`.

---

## Status Enum Reference

### Appointment Status (`status`)

| Value | Meaning |
|---|---|
| `confirmed` | Active booking |
| `pending` | Tentative / awaiting confirmation |
| `registered` | Patient arrived and checked in at reception desk |
| `waiting_payment` | Treatment concluded; awaiting invoice settlement |
| `finished` | Visit and clinical checkup fully completed |
| `rescheduled` | Moved to new date/time |
| `cancelled` | Cancelled by staff or patient |
| `completed` | Patient attended and visit finalized |
| `no_show` | Patient did not show up |

### Payment Status (`payment_status`)

| Value | Meaning |
|---|---|
| `unpaid` | Invoice generated, payment pending |
| `paid` | Full balance paid |
| `pending` | Partial payment or awaiting insurance clearance |
| `refunded` | Charge refunded |

### Patient Request Status (`status`)

| Value | Meaning |
|---|---|
| `pending` | Submitted by simulator or WhatsApp; awaiting clinic review |
| `approved` | Accepted by staff; confirmed appointment created (`APT-XXXXXX`) |
| `rejected` | Declined by staff with review notes |
| `converted` | Converted directly into an active appointment |
| `cancelled` | Cancelled by patient or staff via simulator |

---


## Common Frontend Workflows

### New Patient Registration
```
1. GET  /api/patients/check-duplicate?phone=...&name=...
   → if is_potential_duplicate: show warning + existing matches
2. POST /api/patients   (force_create: false initially, with gender, address, allergies)
   → if 409: show duplicate dialog → resubmit with force_create: true
   → if 201: store patient_id
```

### Book an Appointment with Treatment Catalog
```
1. GET  /api/patients?query=...          → search / select patient
2. GET  /api/dentists                    → show dentist picker
3. GET  /api/treatments                  → show treatment dropdown (e.g. "Teeth Checkup")
4. GET  /api/availability/slots?date=YYYY-MM-DD&dentist_id=DOC-XXXXXX
                                         → show available time slots
5. POST /api/appointments                → book slot with treatment_name and bill_number
```

### 4-Step Clinical Checkup Flow (Odontogram & Examination)
```
1. GET  /api/appointments/{id}           → load appointment and patient info
2. Wizard Step 1: Input vitals, medical history, and allergies
3. Wizard Step 2: Interactive 32-tooth odontogram (assign tooth conditions)
4. Wizard Step 3: Record soft tissue conditions & canker sore notes
5. Wizard Step 4: Finalize treatment agreement and clinical notes
6. POST /api/checkups
   → Auto-updates appointment clinical_notes banner
   → Updates appointment status to "finished"
```

### Reservation Details Drawer & Payment Reminder
```
1. Click appointment in Daily Calendar / Schedule
2. GET /api/appointments/{id}
   → Shows patient card, procedure ("Teeth Checkup"), bill_number, payment_status,
     and clinical alert banner ("The lower and upper lips have canker sores")
3. If payment_status is "unpaid":
   → Click "Send Reminder" → POST /api/appointments/{id}/remind-payment
   → When patient settles bill → PATCH /api/appointments/{id}/payment { "payment_status": "paid" }
```

### Today's Schedule View
```
GET /api/appointments/today
→ Sort by start_time
→ Group by dentist_id if showing multiple chairs
```

### Dentist is Off for a Holiday
```
POST /api/dentists/DOC-000001/leaves
  { "start_date": "2026-09-15", "end_date": "2026-09-17", "reason": "Holiday" }
→ GET /api/availability/slots?date=2026-09-16&dentist_id=DOC-000001
  Returns: []   ← automatically blocked
```

### Change Dentist Working Hours
```
PUT /api/dentists/DOC-000001/schedule/1
  { "start_time": "10:00", "end_time": "18:00", "break_start": "14:00", "break_end": "15:00", "is_working_day": true }
```

### Patient Request Simulator Workflow
```
1. Simulator UI submits request:
   POST /api/v1/patient-requests
   {
     "patient_name": "Aarav Gupta",
     "patient_phone": "+91 9876500001",
     "dentist_id": "DOC-000001",
     "preferred_date": "2026-09-14",
     "preferred_start_time": "10:00",
     "preferred_end_time": "10:30",
     "source": "simulator"
   }
   → Returns REQ-000001 in status "pending"

2. Staff reviews pending requests on website dashboard:
   GET /api/v1/patient-requests?status=pending

3. Staff accepts request:
   POST /api/v1/patient-requests/REQ-000001/approve
   → System auto-registers/matches patient
   → Books confirmed appointment under filelock
   → Request transitions to "approved" with appointment_id
```

### Update Patient Profile Flow (Simulator or Reception)
```
1. Front desk or patient requests detail update:
   PATCH /api/patients/PAT-000001
   {
     "phone": "+91 9999988888",
     "address": "Flat 4B, Lotus Apartments",
     "allergies": "Sulfa drugs"
   }
   → Returns updated Patient record with refreshed updated_at timestamp.
```

### Cancellation Flow (Dual Reference: REQ- & APT-)
```
1. Simulator checks reference format:
   - If ID starts with "REQ-":
     POST /api/v1/patient-requests/REQ-000001/cancel
     { "review_notes": "Cancelled by patient" }
     → Marks request as "cancelled" and auto-cancels linked appointment if approved.
   - If ID starts with "APT-":
     POST /api/appointments/APT-000001/cancel
     { "reason": "Patient requested cancellation" }
     → Marks appointment as "cancelled" and immediately frees the slot on availability.
```

