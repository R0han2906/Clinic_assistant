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
|  [ Dedicated Routes Layer (app/api/v1/routes/) ]                       |
|  - /api/v1/patients       (Registration, Duplicate Check, Search)     |
|  - /api/v1/patients/...   (Structured Visit History)                  |
|  - /api/v1/dentists       (Dentist Profile, Schedule, Leaves)         |
|  - /api/v1/availability   (Available Slots Engine)                    |
|  - /api/v1/appointments   (Booking, Reschedule, Payment, Reminder)    |
|  - /api/v1/treatments     (Procedure Catalog)                         |
|  - /api/v1/checkups       (Odontogram & 4-Step Clinical Checkup)      |
|  - /api/v1/patient-requests(Simulator Intake & Staff Review Queue)    |
|                                                                        |
|  [ Controllers Layer (app/controllers/) ]                              |
|  - Thin orchestration translating HTTP params into domain calls        |
|                                                                        |
|  [ Domain Services Layer (app/services/) ]                             |
|  - Patient Service (Duplicate detection, field validation)             |
|  - Availability Service (Working hours - Leaves - Breaks - Booked)     |
|  - Booking Service (Atomic slot locking, payments, confirmation)       |
|  - Patient Request Service (Simulator matching, review, approval)      |
|                                                                        |
|  [ Repositories Layer (app/repositories/) ]                            |
|  - Base Repository Interfaces (base.py)                                |
|  - OS-Level FileLock (clinic_data.xlsx.lock)                           |
|  - Lock-Once-Delegate Pattern (Eliminating re-entrant deadlocks)       |
|  - Atomic Write: Temp File (.tmp) -> Validate -> os.replace()          |
|  - Pre-Write Automated Rolling Backups (data/backups/)                 |
+-----------------------------------+------------------------------------+
                                    |
                                    v openpyxl
                         +----------------------+
                         |   clinic_data.xlsx   |
                         |   (12 Structured     |
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

## 3. Core Components & Layered Separation

The backend adheres to a strict physical separation of concerns across dedicated folders:

1. **`app/api/v1/routes/` (Routes Folder):** Pure route declarations, HTTP verbs, paths, status codes, and OpenAPI documentation tags. Delegates directly to controllers.
2. **`app/controllers/` (Controllers Folder):** Unpacks HTTP query/body parameters, coordinates application services, and serializes response payloads.
3. **`app/services/` (Services Folder):** Houses pure domain rules and business logic (slot calculation, duplicate detection, atomic booking confirmation, patient request conversion).
4. **`app/models/` (Models Folder):** Contains pure Pydantic schemas, value objects, request/response models, and status enums. Zero HTTP or storage code.
5. **`app/repositories/` (Repositories Folder):** Contains abstract persistence interfaces (`base.py`), Excel sheet schemas (`excel_schema.py`), and thread/process-safe OpenPyXL storage (`excel_repository.py`).
6. **`app/shared/` & `app/core/` (Shared Folder):** Cross-cutting concerns including `X-Request-ID` tracing middleware, machine-readable error codes, and configuration.
7. **`app/infrastructure/` (Infrastructure Folder):** Clean boundary adapters and interfaces for future WhatsApp (Phase 9) and Supabase (Phase 8).
8. **`scripts/` (Scripts Folder):** Standalone CLI tools to seed, validate, snapshot, and reset workbook storage.

## 4. Workbook Schema (12 Sheets)

One workbook per clinic (`clinic_data.xlsx`), organized into 12 normalized sheets:

| Sheet | Purpose | Primary Identifier Format | Key Fields |
|---|---|---|---|
| `Patients` | Patient records | `PAT-000001` | `patient_id`, `name`, `age`, `dob`, `phone`, `email`, `gender`, `address`, `allergies`, `medical_conditions`, `created_at` |
| `Visits` | Structured past visit summaries | `VIS-000001` | `visit_id`, `patient_id`, `dentist_id`, `visit_date`, `visit_type`, `summary` |
| `Dentists` | Dentist profiles | `DOC-000001` | `dentist_id`, `name`, `specialty`, `is_active` |
| `Availability` | Weekly schedule rules | Row index | `dentist_id`, `day_of_week`, `start_time`, `end_time`, `break_start`, `break_end`, `slot_duration` |
| `Leaves` | Blocked dates / leaves | Row index | `dentist_id`, `date`, `reason` |
| `Appointments` | Scheduled appointments | `APT-000001` | `appointment_id`, `patient_id`, `dentist_id`, `date`, `start_time`, `end_time`, `status`, `treatment_name`, `source`, `payment_status`, `bill_number`, `clinical_notes` |
| `Treatments` | Clinical procedure catalog | `TRT-000001` | `treatment_id`, `name`, `category`, `default_duration_minutes`, `estimated_cost`, `description` |
| `MedicalCheckups` | 4-step odontogram & examination | `CHK-000001` | `checkup_id`, `appointment_id`, `patient_id`, `dentist_id`, `vitals`, `teeth_findings_json`, `oral_conditions_json`, `plan_agreement_notes` |
| `PatientRequests` | Simulator & WhatsApp intake | `REQ-000001` | `request_id`, `patient_name`, `patient_phone`, `patient_age`, `dentist_id`, `preferred_date`, `preferred_start_time`, `preferred_end_time`, `status`, `review_notes`, `appointment_id` |
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
