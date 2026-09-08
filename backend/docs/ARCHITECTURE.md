# Backend Architecture & Technical Design

## 1. Architectural Philosophy

The **Zendenta Clinic Backend** follows strict **Clean Architecture / Domain-Driven Design (DDD)** principles:
- **Separation of Concerns**: HTTP routing, controller serialization, domain logic, and data storage reside in decoupled layers.
- **Repository Boundary Pattern**: Business services depend only on the abstract `BaseClinicRepository` interface, enabling zero-friction switching between **Supabase PostgreSQL** and **OpenPyXL Excel Engine**.
- **Deterministic Storage Invariants**: Complete elimination of backup file sprawl, race conditions, and sequence collisions via atomic file writes, connection pooling, and OS-level locking.

---

## 2. Layered Architecture Overview

```text
[ HTTP Request: /api/v1/... or /api/... ]
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│  1. Routes Layer (app/api/v1/routes/)                    │
│     - Validates HTTP parameters via FastAPI & Pydantic   │
│     - Injects singleton services and dependencies        │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│  2. Controllers Layer (app/controllers/)                 │
│     - Orchestrates business workflows                    │
│     - Serializes response DTOs with status codes         │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│  3. Domain Services Layer (app/services/)                │
│     - Pure business logic & validation rules             │
│     - BookingService (7-state machine, conflicts)        │
│     - AvailabilityService (dynamic slot engine)          │
│     - PatientRequestService (intake, approve, reject)    │
│     - PatientService, BillingService, InventoryService   │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│  4. Repositories Layer (app/repositories/base.py)        │
│     - BaseClinicRepository (Abstract Python Interface)   │
└────────────────────────────┬─────────────────────────────┘
              ┌──────────────┴──────────────┐
              ▼                             ▼
┌───────────────────────────┐ ┌────────────────────────────┐
│ SupabaseClinicRepository  │ │ ExcelClinicRepository      │
│ - PostgreSQL (17 Tables)  │ │ - 12-sheet OpenPyXL        │
│ - Connection Pooling      │ │ - OS-level FileLock        │
│ - Relational Constraints  │ │ - Atomic writes (.tmp)     │
│ (STORAGE_BACKEND=supabase)│ │ (STORAGE_BACKEND=excel)    │
└───────────────────────────┘ └────────────────────────────┘
```

---

## 3. Dual-Storage Repository Implementation

### Primary: Supabase PostgreSQL (`STORAGE_BACKEND=supabase`)
- **17 Normalized Relational Tables**:
  1. `patients` — Demographics, contact information, emergency contacts, medical alerts
  2. `dentists` — Practitioners, specialties, color codes, active status
  3. `availability` — Weekly provider shift rules (start, end, break times)
  4. `leaves` — Practitioner time-off dates
  5. `appointments` — 7-state appointment records
  6. `visits` — Post-treatment clinical summaries, chief complaints, diagnoses
  7. `treatments` — Dental procedure catalog with standard duration and pricing
  8. `medical_checkups` — 4-step checkup records, odontogram tooth mapping
  9. `patient_requests` — WhatsApp simulator inbound intake requests
  10. `staff` — Administrative staff and dental assistant profiles
  11. `audit_log` — Immutable audit log of all clinical and billing actions
  12. `metadata` — Clinic configuration and schema versions
  13. `sales` — Itemized billing and payment receipts
  14. `vendors` — Dental equipment and consumable suppliers
  15. `purchases` — Supply purchase orders with receiving workflows
  16. `inventory` — Clinical inventory with low-stock threshold alerts
  17. `payment_methods` — Enabled payment channels (Cash, Card, Insurance, Transfer)
- **High-Throughput Connection Pooling**: Thread-safe pool via `psycopg2.pool.ThreadedConnectionPool(minconn=1, maxconn=10)`.
- **Digit-Matching Phone Search**: Strips non-digit characters (`replace('+', '')`) to query patients and requests seamlessly across `+91 9876543210` vs `9876543210`.

### Fallback: OpenPyXL Excel Engine (`STORAGE_BACKEND=excel`)
- **12-Sheet Structured Workbook** (`clinic_data.xlsx`).
- **Atomic Writes**: Writes to `.tmp` file, performs schema validation, and commits via atomic `os.replace()`.
- **Lock-Once-Delegate Pattern**: Public repository methods acquire `filelock.FileLock` once and delegate execution to private `_unlocked` methods, preventing recursive deadlock.
- **Single-Workbook Storage Invariant**: `AUTO_BACKUP_ON_SAVE = False` prevents file sprawl; all updates commit directly into the primary workbook.

---

## 4. Concurrency & Collision Prevention

1. **Slot Conflict Engine**:
   - Dynamic query evaluating practitioner working hours, break periods, active leaves, and non-cancelled appointments (`scheduled`, `checked-in`, `in-progress`).
   - Re-checks slot availability under an exclusive write lock immediately before persisting a new or rescheduled appointment.
2. **Deterministic Sequence Generators**:
   - `PAT-XXXXXX`: Patients
   - `APT-XXXXXX`: Appointments
   - `REQ-XXXXXX`: WhatsApp Inbound Requests
   - `DEN-XXXXXX` / `DOC-XXXXXX`: Dentists
   - `VIS-XXXXXX`: Clinical Visits
   - `SAL-XXXXXX`: Sales Invoices
   - `INV-XXXXXX`: Inventory Items
   - `PO-XXXXXX`: Purchase Orders

---

## 5. Next.js Reverse Proxy Integration

To guarantee seamless browser-to-backend communication without cross-origin friction:
- Next.js acts as a reverse proxy: `/api/:path*` → `http://127.0.0.1:8000/api/:path*`.
- Client browsers query relative paths (`/api/v1/...`), avoiding CORS preflight checks, Windows IPv6 `[::1]` resolution discrepancies, and cross-origin fetch failures.
- Uvicorn binds to `127.0.0.1:8000`, receiving proxied traffic server-to-server.

---

## 6. Strict 24-Hour Time Format Standard

All time-based fields across schemas and business services strictly use 24-hour format (`HH:mm`):
- Start / End Times: `09:00`, `14:30`, `17:00`
- Available Slot Arrays: `['09:00', '09:30', '10:00', '10:30', ...]`
- Calendar Boundaries: `09:00` to `00:00` (midnight)
- Prevents ambiguity across AM/PM edge cases.
