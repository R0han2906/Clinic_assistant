# Project Rules

## 1. Scope Rules

1. **Dentist-clinic scope:** The product is designed specifically for a dental clinic, not a general hospital.
2. **Release definition:** The initial release consists of the dental clinic staff website and a **Patient Request Simulator**, powered by a FastAPI backend and temporary Excel pilot storage.
3. **Simulator-first patient input:** Because no dedicated business WhatsApp number is currently available, the Patient Request Simulator is used to imitate patient interactions. No live WhatsApp number or account is required for the initial iteration.
4. **WhatsApp is a later phase:** WhatsApp integration will be added only after the staff workflow and booking rules are proven.
5. **Supabase is deferred:** Supabase (or PostgreSQL) will be introduced only after pilot validation when concurrency, scaling, or production WhatsApp traffic justifies it.
6. **Excel is temporary:** Excel is a temporary pilot storage mechanism, never the final production database.
7. **Single clinic pilot:** Start with one dental clinic and one controlled workbook (`clinic_data.xlsx`).
8. **Administrative only:** The system is purely administrative. It must never provide clinical advice, medical diagnoses, triage, or prescriptions.

## 2. Excel Pilot Rules

1. **FastAPI is the sole writer:** FastAPI is the only process permitted to read and write the Excel workbook. The staff browser and simulator must never access the workbook directly.
2. **No concurrent manual editing:** Staff may inspect or export the workbook, but manual edits while the backend is running are strictly forbidden.
3. **Mandatory file locking:** Every read and write operation must acquire an OS-level file lock (`clinic_data.xlsx.lock`).
4. **Lock-once-delegate pattern:** Public repository methods acquire the workbook lock once and delegate to private `_unlocked` methods. Re-entrant lock acquisitions that cause deadlocks are forbidden.
5. **Atomic writes:** Writes must be performed to a temporary file (`.tmp`), validated for schema integrity, and atomically moved into place using `os.replace()`.
6. **Automated pre-write backups:** Before applying modifications, create a timestamped backup copy in the `backups/` directory.
7. **Stable identifiers:** All records must use deterministic, sequenced IDs (`PAT-000001`, `APT-000001`, `DOC-000001`, `VIS-000001`). Patient names or row numbers must never be used as primary keys.
8. **Persistent storage requirement:** In hosted or containerized environments, the workbook directory must be mounted to persistent storage, never ephemeral filesystems.
9. **No secrets in Excel:** API keys, passwords, and sensitive system secrets must never be stored in the workbook.

## 3. Data Scope Rules

1. **Minimal data collection:** Collect only fields strictly necessary for registration and appointment booking: full name, age or date of birth, phone number, optional email, and clinic consent.
2. **Structured visit summaries:** Previous visits must be recorded as concise, structured summaries (date, dentist, visit type, short administrative note). Never attempt to implement an unbounded medical record system.
3. **Duplicate patient detection:** When registering a patient with an existing phone number or name, trigger a review step rather than silently creating duplicate records.
4. **No real patient data in development:** Use only synthetic or anonymized test data during development and automated testing.

## 4. Scheduling & Single Booking Engine Rules

1. **One booking authority:** All appointment requests—whether from the staff website, the Patient Request Simulator, or future WhatsApp webhooks—must pass through the identical FastAPI domain services (`AvailabilityService` and `AppointmentService`).
2. **Zero duplicate booking logic:** Never write separate availability or reservation logic for the simulator or WhatsApp.
3. **Deterministic slot calculation:** Availability must be derived by subtracting dentist non-working hours, break intervals, registered leaves/blocked dates, and existing confirmed appointments in a single workbook read.
4. **Immediate availability re-check:** When booking an appointment, re-validate slot availability under an exclusive write lock immediately before persisting the record to prevent race conditions.
5. **Atomic rescheduling:** During an appointment reschedule, preserve the original appointment until the replacement slot has been validated and committed.
6. **Audit trail:** Every creation, rescheduling, and cancellation must append a corresponding entry to the `AuditLog` sheet.

## 5. Website & Simulator Rules

1. **Authenticated staff access:** The staff website requires authentication before viewing or modifying clinic data.
2. **Clear appointment states:** Display explicit appointment statuses (`confirmed`, `pending`, `cancelled`, `rescheduled`, `completed`, `no_show`).
3. **Actionable error messages:** If an operation fails (e.g., workbook lock timeout or write error), present an understandable error message to staff and preserve entered form data for retry.
4. **Simulator separation:** The Patient Request Simulator must operate as a distinct test interface that sends standard HTTP requests to FastAPI, mirroring the future WhatsApp adapter payload.

## 6. WhatsApp Rules for Future Phase (Phase 9)

1. Use only the official WhatsApp Business Platform or an approved business solution provider (BSP).
2. Never automate personal WhatsApp accounts.
3. The WhatsApp webhook adapter must convert incoming messages into standard internal commands and call existing domain services.
4. WhatsApp webhooks must be processed idempotently to prevent duplicate bookings from network retries.

## 7. Engineering & Architecture Rules

1. Follow MVC architecture with strict separation: Routers/Controllers → Domain Services → Repositories → Data Models.
2. Maintain clean repository boundaries so switching from Excel to Supabase requires no changes to business logic.
3. Use Pydantic schemas for strict request validation and response serialization.
4. Comprehensive automated testing: unit tests and integration tests must cover duplicate detection, slot calculation, conflict prevention, atomic writes, and error paths.

## 8. Documentation Synchronization Rules

1. Maintain internal consistency across all documentation files using their full descriptive filenames.
2. Every document must reflect the baseline statement:
   > **The first release is a dentist-clinic staff website with a Patient Request Simulator, FastAPI backend, and controlled Excel pilot storage. Supabase and real WhatsApp integration come later after validation.**
3. Update `Product Requirements Document.md` on scope or requirement changes.
4. Update `System Architecture.md` on component, data flow, or storage changes.
5. Update `Product Design Specification.md` on UI/UX, screen, or simulator layout changes.
6. Update `Implementation Phases.md` on phase progression or exit gate criteria.
7. Update `Project Memory.md` whenever durable decisions, risks, or open questions change.
8. Update `Agent.md` whenever operating instructions change.
