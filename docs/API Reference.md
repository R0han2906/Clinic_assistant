# DentalFlow Backend — Frontend API Reference

> **Base URL:** `http://127.0.0.1:8000`  
> **Interactive Docs:** `http://127.0.0.1:8000/docs` (Swagger UI)  
> **All API routes are prefixed with `/api`**  
> **All request/response bodies are `application/json`**

---

## CORS Policy

CORS is fully open for local development. The following is set in `app/main.py`:

```
Allow-Origins:     *  (all origins)
Allow-Methods:     *  (GET, POST, PUT, DELETE, OPTIONS, etc.)
Allow-Headers:     *  (all headers)
Allow-Credentials: true
```

You do **not** need to set any special headers for development.  
For production, update `allow_origins` in `app/main.py` to your specific frontend domain.

---

## Error Response Format

All errors return a JSON body in this shape:

```json
{
  "detail": "Human-readable error message",
  "error_type": "ExceptionClassName"
}
```

| HTTP Status | Meaning |
|---|---|
| `400` | Bad request / validation error |
| `404` | Resource not found |
| `409` | Conflict (duplicate patient, slot already taken) |
| `500` | Internal write error |
| `503` | Workbook locked — another operation in progress, retry |
| `422` | Pydantic validation error (missing/wrong field types) |

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

---

## System

### `GET /health`
Lightweight liveness ping — no database read.

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
    "emergency_contact": null,
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
  "emergency_contact": "Priya Sharma +91 9988776600",
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
| `emergency_contact` | string | No | Free text |
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
| `status` | string | Filter by status: `confirmed`, `pending`, `rescheduled`, `cancelled`, `completed`, `no_show` |

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
| `notes` | string | No | Admin notes |

**Response `201`:** Full Appointment object with `status: "confirmed"`.  
**Response `409`:** Slot already taken — dentist has an overlapping confirmed/pending appointment.

> **Tip:** Use `GET /api/availability/slots` first to get a valid, free slot, then pass `start_time` and `end_time` directly into this endpoint.

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

## Status Enum Reference

| Value | Meaning |
|---|---|
| `confirmed` | Active booking |
| `pending` | Tentative / awaiting confirmation |
| `rescheduled` | Moved to new date/time |
| `cancelled` | Cancelled by staff or patient |
| `completed` | Patient attended and visit done |
| `no_show` | Patient did not show up |

---

## Common Frontend Workflows

### New Patient Registration
```
1. GET  /api/patients/check-duplicate?phone=...&name=...
   → if is_potential_duplicate: show warning + existing matches
2. POST /api/patients   (force_create: false initially)
   → if 409: show duplicate dialog → resubmit with force_create: true
   → if 201: store patient_id
```

### Book an Appointment
```
1. GET  /api/patients?query=...          → search / select patient
2. GET  /api/dentists                    → show dentist picker
3. GET  /api/availability/slots?date=YYYY-MM-DD&dentist_id=DOC-XXXXXX
                                         → show available time slots
4. POST /api/appointments                → book the selected slot
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
