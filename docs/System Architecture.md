# System Architecture

## 1. Architecture Decision

The first implementation is a **dentist-clinic staff website with a Patient Request Simulator, backed by a FastAPI backend and a structured Excel pilot workbook**.

Core release principle:
> **The first release is a dentist-clinic staff website with a Patient Request Simulator, FastAPI backend, and controlled Excel pilot storage. Supabase and real WhatsApp integration come later after validation.**

There is currently no dedicated WhatsApp business phone number available. To validate the patient-to-clinic workflow before acquiring business infrastructure, the architecture introduces a **Patient Request Simulator**. The simulator acts as an external input adapter submitting requests to the exact same FastAPI endpoints that a future WhatsApp webhook handler will call.

Supabase is intentionally deferred. It will be introduced when multi-user concurrency, multi-clinic scaling, or production WhatsApp traffic justifies a managed PostgreSQL database.

## 2. System Architecture Diagram

```text
+-------------------------+            +---------------------------------+
|   Clinic Staff Browser  |            |    Patient Request Simulator    |
|   (Staff Website UI)    |            |   (External Input Adapter)      |
+------------+------------+            +----------------+----------------+
             |                                          |
             | HTTP / REST                              | HTTP / REST
             v                                          v
+------------------------------------------------------------------------+
|                          FastAPI Backend                               |
|                                                                        |
|  [ Controllers / Routers ]                                             |
|  - /api/patients       (Registration, Search, Profile)                 |
|  - /api/visits         (Structured Visit History)                      |
|  - /api/dentists       (Dentist Profile, Schedule, Leaves)             |
|  - /api/appointments   (Booking, Rescheduling, Cancellation)           |
|  - /api/availability   (Slot Calculation Engine)                       |
|  - /api/patient-request(Simulator Endpoint -> WhatsApp Webhook Target) |
|                                                                        |
|  [ Domain Services (Single Source of Business Truth) ]                 |
|  - Patient Service (Duplicate detection, field validation)             |
|  - Availability Service (Working hours - Leaves - Breaks - Booked)     |
|  - Appointment Service (Atomic slot locking & confirmation)            |
|                                                                        |
|  [ Excel Repository Boundary ]                                         |
|  - OS-Level FileLock (clinic_data.xlsx.lock)                           |
|  - Lock-Once-Delegate Pattern (Eliminating re-entrant deadlocks)       |
|  - Atomic Write: Temp File -> Validate -> os.replace()                 |
|  - Pre-Write Automated Rolling Backups                                 |
+-----------------------------------+------------------------------------+
                                    |
                                    v openpyxl
                         +----------------------+
                         |   clinic_data.xlsx   |
                         |   (9 Structured      |
                         |       Sheets)        |
                         +----------------------+

Future WhatsApp Evolution:
+-------------------+      +-------------------+      +-------------------------+
| Patient WhatsApp  | ---> | WhatsApp Provider | ---> | FastAPI Webhook Adapter |
+-------------------+      +-------------------+      +------------+------------+
                                                                   |
                                                                   v
                                                      [ Same Domain Services ]
                                                                   |
                                                                   v
                                                      [ Supabase / PostgreSQL ]
```

## 3. Core Components

### 3.1 Staff Website
- Authenticated interface for clinic receptionists and dentists.
- Key screens: Daily Schedule Dashboard, Patient Registration & Search, Patient Profiles with Previous Visits, Dentist Availability & Leave Management, Appointment Booking & Rescheduling.
- **Strict Boundary:** The browser communicates exclusively via FastAPI REST endpoints. Direct browser access to the Excel workbook is strictly prohibited.

### 3.2 Patient Request Simulator
- An external testing interface simulating the patient's perspective in the absence of a live WhatsApp number.
- Collects: Patient Name, Phone, Requested Dentist, Preferred Date/Time, and Appointment Reason.
- Submits structured JSON payloads to `/api/patient-request` (or shared appointment endpoints).
- Demonstrates how external patient input flows through availability checking and booking, appearing on the staff website in real time.
- Serves as a direct drop-in placeholder that will be replaced by the WhatsApp webhook adapter in Phase 9.

### 3.3 FastAPI Backend & Domain Services
- **Single Authority for Business Rules:** Availability calculation and appointment booking logic reside strictly in the domain services layer (`app/services/availability_service.py` and `app/services/appointment_service.py`).
- Ensures identical scheduling, validation, and conflict-prevention rules regardless of whether a request originates from the Staff Website, Patient Request Simulator, or future WhatsApp webhook.
- Strict Pydantic models validate all inputs and outputs.

### 3.4 Workbook Repository (Excel Pilot Storage)
- Encapsulates all interactions with `clinic_data.xlsx`.
- Employs the **Lock-Once-Delegate pattern**: public repository methods acquire a `filelock.FileLock` once, perform all required reads/writes in-memory, and delegate to private `_unlocked` helper functions to avoid re-entrant deadlocks.
- Provides atomic persistence: writes to a temporary file (`.tmp`), validates sheet headers and records, creates a timestamped backup (`backups/`), and atomically replaces the live file using `os.replace()`.

### 3.5 Future WhatsApp Webhook Adapter (Phase 9)
- Will receive incoming messages from the official WhatsApp Business Platform.
- Normalizes incoming chat interactions into structured internal commands.
- Calls the identical FastAPI domain services used by the simulator. Never accesses storage directly.

### 3.6 Future Supabase Repository (Phase 8)
- Replaces `ExcelRepository` with `PostgresRepository` behind the repository interface.
- Zero changes to controllers or domain services when transitioning from Excel to Supabase.

## 4. Workbook Schema (9 Sheets)

One workbook per clinic (`clinic_data.xlsx`), organized into 9 normalized sheets:

| Sheet | Purpose | Primary Identifier Format | Key Fields |
|---|---|---|---|
| `Patients` | Patient records | `PAT-000001` | `patient_id`, `name`, `age`, `dob`, `phone`, `email`, `created_at` |
| `Visits` | Structured past visit summaries | `VIS-000001` | `visit_id`, `patient_id`, `dentist_id`, `visit_date`, `visit_type`, `summary` |
| `Dentists` | Dentist profiles | `DOC-000001` | `dentist_id`, `name`, `specialty`, `is_active` |
| `Availability` | Weekly schedule rules | Row index | `dentist_id`, `day_of_week`, `start_time`, `end_time`, `break_start`, `break_end`, `slot_duration` |
| `Leaves` | Blocked dates / leaves | Row index | `dentist_id`, `date`, `reason` |
| `Appointments` | Scheduled appointments | `APT-000001` | `appointment_id`, `patient_id`, `dentist_id`, `date`, `start_time`, `end_time`, `status` |
| `Staff` | Internal staff accounts | `STF-000001` | `staff_id`, `username`, `role`, `is_active` |
| `AuditLog` | Auditable state changes | `AUD-000001` | `audit_id`, `entity_type`, `entity_id`, `action`, `performed_by`, `timestamp` |
| `Metadata` | Schema version & clinic info | Single row | `schema_version`, `clinic_name`, `timezone`, `last_updated` |

## 5. End-to-End Data Flows

### 5.1 Staff Registration & Booking Flow
1. Receptionist enters patient details on the Staff Website.
2. FastAPI validates fields, checks for duplicate name/phone, and returns a warning if a match is found (or creates a new `PAT-XXXXXX` ID).
3. Receptionist selects the patient, target dentist, and date.
4. `AvailabilityService` calculates available slots in a single workbook read (evaluating working hours, breaks, leaves, and booked appointments).
5. Receptionist chooses a slot and clicks "Confirm Booking".
6. `AppointmentService` re-validates slot availability under an exclusive write lock, assigns `APT-XXXXXX`, saves atomically to `clinic_data.xlsx`, and writes to `AuditLog`.
7. Updated schedule renders immediately on the website.

### 5.2 Patient Request Simulator Flow
1. Tester inputs patient details, requested dentist, preferred date, and slot on the Simulator UI.
2. Simulator posts JSON payload to `/api/patient-request`.
3. FastAPI invokes the shared `PatientService` and `AppointmentService`.
4. The appointment is atomically saved to `Appointments` and `AuditLog` in `clinic_data.xlsx`.
5. Simulator displays confirmation with appointment details and `APT-XXXXXX` ID.
6. The booked slot instantly appears as occupied on the Staff Website daily schedule.

### 5.3 Future WhatsApp Webhook Flow
1. Patient sends a message on WhatsApp.
2. WhatsApp Business Platform sends webhook POST to FastAPI.
3. Webhook adapter parses message intent into appointment parameters.
4. Adapter calls the identical `AppointmentService`.
5. Confirmation template is returned to the patient via WhatsApp API.

## 6. Storage Safeguards & Pilot Concurrency

Excel is suitable only as a controlled pilot store. The following engineering safeguards are implemented:
1. **Single Writer:** FastAPI is the sole process with write access to `clinic_data.xlsx`. Direct edits by staff are strictly prohibited while the server runs.
2. **OS-Level File Locking:** `filelock.FileLock` ensures that parallel requests wait their turn and do not overwrite each other.
3. **Atomic Replacement:** Changes are written to a temporary file (`clinic_data.xlsx.tmp`) and atomically renamed via `os.replace()`, preventing corrupt partial writes.
4. **Pre-Write Backups:** Before saving modifications, a timestamped snapshot is saved to `backups/`.
5. **Lock-Once Architecture:** Complex workflows (such as booking, which checks availability and saves an appointment) execute within a single lock acquisition to prevent deadlocks.
6. **Persistent Storage Requirement:** In hosted environments, the workbook directory must reside on a persistent volume, never on ephemeral container filesystems.

## 7. Migration Readiness (Excel to Supabase)

The schema is explicitly designed for seamless migration to relational databases:
- Every entity utilizes an immutable, sequenced primary key (`PAT-XXXXXX`, `APT-XXXXXX`, etc.).
- Column names, casing, and data types match SQL standards.
- Relationships use explicit foreign keys (`patient_id`, `dentist_id`).
- Migration simply requires executing a data-transfer script from Excel into Supabase tables and swapping the repository implementation in FastAPI's dependency injection container.
