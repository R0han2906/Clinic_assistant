# Zendenta Clinic Backend — API Documentation

> **Base URL:** `http://127.0.0.1:8000`  
> **API Version Prefix:** `/api/v1` (with backward-compatible `/api` aliases)  
> **Interactive Swagger UI:** `http://127.0.0.1:8000/docs`  
> **ReDoc:** `http://127.0.0.1:8000/redoc`  
> **Tracing Header:** Every response includes `X-Request-ID` (UUID)  
> **Time Format:** All times strictly adhere to **24-Hour format (`HH:mm`)**

---

## 1. Authentication & Proxy Architecture

- **Front-Desk Direct Access:** In the current release, authentication is bypassed to maximize front-desk operational throughput during clinic hours.
- **Next.js Reverse Proxy Integration:** In web browser environments, all requests route through the Next.js reverse proxy (`/api/:path*` → `http://127.0.0.1:8000/api/:path*`), completely eliminating CORS preflight overhead and IPv6 `[::1]` resolution mismatches.

---

## 2. Patient Requests (WhatsApp Simulator Intake)

Manages remote inbound appointment booking requests initiated from the Patient WhatsApp Simulator (`simulator/`).

### `POST /api/v1/patient-requests`
Submits a new inbound patient booking request.

**Request Body:**
```json
{
  "patient_name": "Rohan Verma",
  "patient_phone": "9876543210",
  "patient_age": "29",
  "dentist_id": "DEN-000001",
  "preferred_date": "2026-09-15",
  "preferred_start_time": "14:00",
  "preferred_end_time": "14:30",
  "reason": "Teeth Checkup",
  "source": "simulator"
}
```

**Response (`201 Created`):**
```json
{
  "request_id": "REQ-000001",
  "patient_name": "Rohan Verma",
  "patient_phone": "9876543210",
  "dentist_id": "DEN-000001",
  "preferred_date": "2026-09-15",
  "preferred_start_time": "14:00",
  "preferred_end_time": "14:30",
  "status": "pending",
  "created_at": "2026-09-08T15:00:00Z"
}
```

---

### `GET /api/v1/patient-requests`
Lists patient requests with optional status, phone, and patient ID filtering.

**Query Parameters:**
| Parameter | Type | Required | Description |
|---|---|---|---|
| `status` | `string` | No | Filter by status (`pending`, `approved`, `rejected`, `cancelled`) |
| `patient_phone` | `string` | No | Filter by patient phone (supports digit matching e.g. `9876543210` or `+91 9876543210`) |
| `patient_id` | `string` | No | Filter by assigned patient ID (`PAT-XXXXXX`) |

**Response (`200 OK`):**
```json
[
  {
    "request_id": "REQ-000001",
    "patient_name": "Rohan Verma",
    "patient_phone": "9876543210",
    "dentist_id": "DEN-000001",
    "preferred_date": "2026-09-15",
    "preferred_start_time": "14:00",
    "preferred_end_time": "14:30",
    "status": "pending"
  }
]
```

---

### `POST /api/v1/patient-requests/{id}/approve`
Staff approves a pending request. Automatically registers/matches the patient, books a confirmed appointment (`source: 'WHATSAPP'`), and updates calendar schedules in real-time.

**Request Body:**
```json
{
  "review_notes": "Approved by receptionist"
}
```

**Response (`200 OK`):**
```json
{
  "patient_request": {
    "request_id": "REQ-000001",
    "status": "approved",
    "appointment_id": "APT-000042"
  },
  "appointment": {
    "appointment_id": "APT-000042",
    "date": "2026-09-15",
    "start_time": "14:00",
    "end_time": "14:30",
    "status": "scheduled",
    "source": "WHATSAPP"
  }
}
```

---

### `POST /api/v1/patient-requests/{id}/reject`
Staff rejects a pending request with a reason message.

**Request Body:**
```json
{
  "review_notes": "Doctor unavailable during surgery"
}
```

---

### `POST /api/v1/patient-requests/{id}/cancel`
Cancels an inbound request. If the request was already approved into an appointment, automatically cancels the linked appointment under write lock.

**Request Body:**
```json
{
  "review_notes": "Cancelled by patient via simulator"
}
```

---

## 3. Patients & Live Autocomplete Lookup

### `GET /api/v1/patients/lookup`
Fast debounced autocomplete endpoint used by the Walk-In Intake flow to search existing patients by phone number or name.

**Query Parameters:**
| Parameter | Type | Required | Description |
|---|---|---|---|
| `query` | `string` | Yes | Phone digits (e.g. `9876`) or patient name |

**Response (`200 OK`):**
```json
[
  {
    "patient_id": "PAT-000001",
    "full_name": "Rohan Verma",
    "phone": "9876543210",
    "age": 29,
    "gender": "Male",
    "allergies": "Penicillin",
    "medical_alerts": "High blood pressure"
  }
]
```

---

## 4. Appointments & 7-State Lifecycle

### Canonical States:
1. `scheduled` — Future booking
2. `checked-in` — Patient arrived in clinic lobby (Waiting Room queue)
3. `in-progress` — Patient in dental operatory
4. `completed` — Procedure finished, visit summary recorded
5. `paid` — Bill settled in full
6. `cancelled` — Cancelled prior to visit
7. `no-show` — Patient missed scheduled slot

---

### `POST /api/v1/appointments/{id}/reschedule`
Reschedules an appointment to a new date, 24h slot, or dentist with slot conflict detection.

**Request Body:**
```json
{
  "new_date": "2026-09-20",
  "new_start_time": "15:00",
  "new_end_time": "15:30",
  "new_dentist_id": "DEN-000001",
  "reschedule_reason": "Patient requested afternoon slot"
}
```

**Response (`200 OK`):**
Returns updated `AppointmentResponse` with refreshed date, start/end times, and dentist ID.

**Error (`409 Conflict`):**
Returns `SlotConflictError` if the dentist is already booked in that slot.

---

### `POST /api/v1/appointments/{id}/cancel`
Cancels an appointment and immediately releases the reserved slot back into availability.

**Request Body:**
```json
{
  "reason": "Patient rescheduled for next month"
}
```

---

### `PATCH /api/v1/appointments/{id}/status`
Transitions an appointment across the 7-state lifecycle with strict transition guards.

**Request Body:**
```json
{
  "new_status": "checked-in",
  "notes": "Patient arrived on time"
}
```

---

### `PATCH /api/v1/appointments/{id}/payment`
Records billing payment (`PAID`, `PARTIAL`, `UNPAID`). Automatically advances completed appointments to `paid`.

**Request Body:**
```json
{
  "payment_status": "PAID",
  "bill_number": "BILL-10492"
}
```

---

## 5. Dentists & Availability Engine

### `GET /api/v1/availability/slots`
Computes real-time available 24h time slots for a given date and dentist.

**Query Parameters:**
| Parameter | Type | Required | Description |
|---|---|---|---|
| `date` | `string` | Yes | Target date (`YYYY-MM-DD`) |
| `dentist_id` | `string` | Yes | Practitioner ID (`DEN-XXXXXX`) |
| `slot_duration_minutes` | `integer` | No | Slot duration (default: 30) |

**Response (`200 OK`):**
```json
[
  {
    "start_time": "09:00",
    "end_time": "09:30",
    "is_available": true
  },
  {
    "start_time": "09:30",
    "end_time": "10:00",
    "is_available": false,
    "unavailable_reason": "Booked"
  }
]
```
