# Project Rules

## 1. Scope Rules

1. **Dentist-clinic scope:** The product is designed specifically for a dental clinic, not a general hospital.
2. **Release definition:** The ecosystem consists of the Next.js staff operational website (with Walk-In intake and WhatsApp review drawer), a **Patient WhatsApp Bot Simulator** (`simulator/`), powered by a FastAPI modular backend and dual-storage repository (Supabase PostgreSQL primary + Excel fallback).
3. **Simulator-first patient input:** Because no dedicated business WhatsApp number is currently active, the Patient WhatsApp Bot Simulator is used to imitate patient interactions. No live WhatsApp number or account is required for the initial iteration.
4. **WhatsApp is a later phase:** WhatsApp integration will be added only after the staff workflow and booking rules are proven.
5. **Dual-Repository (Supabase PostgreSQL primary + Excel fallback):** The system operates with Supabase PostgreSQL (17 normalized tables with connection pooling) as the primary storage engine (`STORAGE_BACKEND=supabase`), with the 12-sheet Excel engine retained as pilot fallback.
6. **Excel is fallback:** Excel is a portable pilot storage mechanism, while Supabase provides transactional production persistence.
7. **Single clinic pilot:** Start with one dental clinic (Avicena Clinic) and expandable provider roster (`DEN-000001` Dr. Sarah Wilson, `DEN-000002` Dr. Michael Chen, `DEN-000003` ROHAN).
8. **Administrative only:** The system is purely administrative. It must never provide clinical advice, medical diagnoses, triage, or prescriptions.

---

## 2. Universal 24-Hour Time Standard Rule (`HH:mm`)

1. **Strict 24-Hour Formatting:** All visual components, calendar grids, card labels, drawer schedules, clinic hours, and API payloads must strictly enforce the 24-hour time standard `HH:mm` (e.g., `09:00`, `14:30`, `23:00`).
2. **No AM/PM Notation:** 12-hour formats with AM/PM designations are strictly forbidden in UI displays and backend storage schemas to prevent clinical scheduling misunderstandings.
3. **Frontend Implementation:** All date formatters in `lib/formatters.ts` must specify `{ hour12: false, hour: '2-digit', minute: '2-digit' }`.
4. **Calendar Axes:** Left-axis hour markers must render sequentially from `09:00` to `00:00`.

---

## 3. Zero-CORS Reverse Proxy Architecture Rule

1. **Next.js Server Proxying:** The Next.js frontend application (`frontend/next.config.mjs`) must define rewrites routing `/api/:path*` to `http://127.0.0.1:8000/api/:path*`.
2. **Same-Origin Client Calls:** In the browser client, `API_URL` is set to an empty string (`''`), ensuring all HTTP requests target same-origin relative URLs (`/api/...`).
3. **Prohibition of Direct Browser Cross-Origin Calls:** Front-desk client code must never directly issue requests to `http://localhost:8000` or `http://127.0.0.1:8000`. This rule eliminates CORS preflight latency, browser security blocks, and Windows IPv6 `[::1]` resolution conflicts.

---

## 4. Phone Number Normalization & Digit-Matching Rule

1. **Trailing 10-Digit Matching:** Whenever filtering patient requests or looking up patients by phone (`GET /api/v1/patient-requests?patient_phone=...`), the backend and simulator must extract trailing digits (e.g., matching the last 10 digits).
2. **Country Code Agnostic:** The system must seamlessly match `+919876543210`, `919876543210`, and `9876543210` to the same patient record without throwing duplicate or not-found errors.

---

## 5. Walk-In & Inbound WhatsApp Intake Rules

1. **Live Autocomplete Search:** Walk-in intake must provide debounced live lookup (`/api/v1/patients/lookup?q=...`) to prevent duplicate registrations and speed up front-desk triage.
2. **On-Duty Availability Calculation:** The walk-in drawer must dynamically compute dentist wait times, current chair status, and highlight the provider with the shortest wait time.
3. **Source Tagging:** All appointments must record their origin (`source: 'WALK_IN'`, `'WHATSAPP'`, `'PHONE'`, `'IN_PERSON'`).
4. **Decoupled Event Synchronization:** All state mutations originating in drawers (`WalkInSheet`, `BookingRequestPanel`) must notify the operational calendar using custom decoupled events (`lib/event-bus.ts`) rather than forcing full page reloads.

---

## 6. Excel Pilot Storage Rules

1. **FastAPI is the sole writer:** FastAPI is the only process permitted to read and write the Excel workbook. The staff browser and simulator must never access the workbook directly.
2. **No concurrent manual editing:** Staff may inspect or export the workbook, but manual edits while the backend is running are strictly forbidden.
3. **Mandatory file locking:** Every read and write operation must acquire an OS-level file lock (`clinic_data.xlsx.lock`).
4. **Lock-once-delegate pattern:** Public repository methods acquire the workbook lock once and delegate to private `_unlocked` methods. Re-entrant lock acquisitions that cause deadlocks are forbidden.
5. **Atomic writes:** Writes must be performed to a temporary file (`.tmp`), validated for schema integrity, and atomically moved into place using `os.replace()`.
6. **Controlled single-workbook storage:** Automatic backups on every write are disabled (`AUTO_BACKUP_ON_SAVE = False`). All data is persisted directly into the authoritative `clinic_data.xlsx` workbook under filelock.
7. **Stable identifiers:** All records must use deterministic, sequenced IDs (`PAT-000001`, `APT-000001`, `DOC-000001`, `VIS-000001`, `REQ-000001`).

---

## 7. Scheduling & Booking Engine Rules

1. **One booking authority:** All appointment requests—whether from the staff website, Walk-In intake, the WhatsApp Simulator, or future WhatsApp webhooks—must pass through the identical FastAPI domain services (`AvailabilityService` and `AppointmentService`).
2. **Zero duplicate booking logic:** Never write separate availability or reservation logic for the simulator or WhatsApp.
3. **Deterministic slot calculation:** Availability must be derived by subtracting dentist non-working hours, break intervals, registered leaves/blocked dates, and existing confirmed appointments in a single read.
4. **Immediate availability re-check:** When booking an appointment, re-validate slot availability under an exclusive write lock immediately before persisting the record to prevent race conditions.
5. **Atomic rescheduling:** During an appointment reschedule, preserve the original appointment until the replacement slot has been validated and committed.
6. **Audit trail:** Every creation, rescheduling, and cancellation must append a corresponding entry to the audit log.

---

## 8. Documentation Synchronization Rules

1. Maintain internal consistency across all documentation files using their full descriptive filenames.
2. Every document must reflect the baseline statement:
   > **A unified dental clinic platform: Next.js staff frontend with zero-CORS proxy, Walk-In intake, WhatsApp review drawer, 24-hour military time standard, FastAPI layered MVC backend, dual storage (Supabase PostgreSQL primary + Excel fallback), and an authentic React WhatsApp Bot Simulator (`simulator/`).**
3. Update `Product Requirements Document.md` on scope or requirement changes.
4. Update `System Architecture.md` on component, data flow, or storage changes.
5. Update `Product Design Specification.md` on UI/UX, screen, or simulator layout changes.
6. Update `Implementation Phases.md` on phase progression or exit gate criteria.
7. Update `Project Memory.md` whenever durable decisions, risks, or open questions change.
8. Update `Agent.md` whenever operating instructions change.
