# Project Memory

## Purpose

This document serves as the long-term memory for the DentalFlow project, recording approved architectural decisions, durable constraints, current progress against the 9-phase roadmap, key risks, and open questions.

---

## Current Product Identity

- **Working Name:** DentalFlow
- **Domain:** Single-location dental clinic operations (1 primary dentist, expandable to 2–3 dentists).
- **Core Release Baseline:**
  > **The first release is a dentist-clinic staff website with a Patient Request Simulator, FastAPI backend, and controlled Excel pilot storage. Supabase and real WhatsApp integration come later after validation.**
- **Initial User Interface:** Dedicated web application for clinic front-desk staff (receptionists).
- **Initial Patient-Side Channel:** **Patient Request Simulator** (web-based test harness imitating patient appointment requests).
- **Initial Storage Layer:** One structured Excel workbook per clinic (`clinic_data.xlsx`), managed strictly by the FastAPI backend under file locks.
- **Future Growth:** Managed Supabase (PostgreSQL) and official WhatsApp Business Platform integration.

---

## Approved Durable Decisions

1. **Dentist-Clinic Focus:** The application is built specifically for dental clinic workflows (patient registration, structured visit summaries, dentist schedules, slot-based booking). General hospital features are out of scope.
2. **Website & Simulator First:** Staff ergonomics and scheduling correctness must be validated before introducing production WhatsApp infrastructure.
3. **Absence of Dedicated WhatsApp Number:** Because no live WhatsApp business number or verified WABA currently exists, the project uses a Patient Request Simulator to prove patient-to-clinic flows.
4. **Single Booking Engine:** Staff website bookings, simulator requests, and future WhatsApp messages all execute through the exact same FastAPI domain services (`AvailabilityService` and `AppointmentService`).
5. **Temporary Excel Storage:** Excel pilot storage enables rapid zero-dependency prototyping, immediate manual inspection, and simple export. It is not the final database.
6. **FastAPI Sole Writer:** Neither staff browsers nor simulator clients ever access the Excel workbook directly. FastAPI is the single point of persistence.
7. **Safe Storage Invariants:** Strict adherence to atomic replacement via temporary files, automated pre-write backups, and OS-level file locking (`filelock`) using the lock-once-delegate pattern.
8. **Sequenced Stable IDs:** Every entity uses immutable, formatted keys (`PAT-XXXXXX`, `APT-XXXXXX`, `DOC-XXXXXX`, `VIS-XXXXXX`) to ensure frictionless migration to SQL databases.
9. **Deferred Supabase:** Supabase introduction is deferred until multi-user concurrency, multi-clinic scaling, or live WhatsApp traffic justifies it.
10. **Administrative Scope Only:** The system does not diagnose, prescribe, triage emergencies, or function as a full electronic medical record (EMR).

---

## Current Implementation Status (9-Phase Roadmap)

| Phase | Description | Status | Notes |
|---|---|---|---|
| **Phase 1** | Confirm Real Dental-Clinic Workflow | In Progress | Working with partner clinic patterns (1 dentist default, up to 3). |
| **Phase 2** | Staff Website Prototype | **COMPLETED** | Next.js 16 App Router UI with 9 pages, Tailwind v4, Zustand stores. |
| **Phase 3** | FastAPI & Excel Pilot Backend | **COMPLETED** | Layered architecture, 12 sheets, atomic writes, filelock, single workbook, all 25 tests green. |
| **Phase 4** | Patient Registration & Visit Workflow | **COMPLETED** | APIs `/api/v1/patients` (with PATCH & DELETE) and `/api/v1/patients/{id}/visits` fully functional. |
| **Phase 5** | Dentist Availability & Booking | **COMPLETED** | Slot calculation with working hours, breaks, leaves, and cancellations complete. |
| **Phase 6** | Build Patient Request Simulator | **COMPLETED** | Built `patient-whatsapp-simulator/` in React + TS + Vite with booking, update, & cancellation. |
| **Phase 7** | Controlled Clinic Pilot | In Progress | Full-stack live testing with Supabase and Staff UI. |
| **Phase 8** | Supabase Migration & Full-Stack Wiring | **COMPLETED** | Migrated from Excel to Supabase PostgreSQL (17 tables). Connected all 9 Next.js pages to live API. Added Sales, Purchases, Inventory, Staff, Treatments CRUD & CSV exports. |
| **Phase 9** | Real WhatsApp Integration | Next Priority | Official WhatsApp Cloud API integration once business phone is active. |

---

## Change History

| Date | Change Event | Detail |
|---|---|---|
| Initial | WhatsApp-first clinic bot | Concept considered WhatsApp as initial interface. |
| Revision 1 | Transition to Website First | Pivoted to clinic staff website with Excel storage; deferred WhatsApp & Supabase. |
| Revision 2 | Backend & Lock Architecture | Built complete FastAPI MVC backend; fixed filelock re-entrancy with `_unlocked` helpers; 10/10 tests green. |
| Revision 3 | Simulator-First Integration | Added Patient Request Simulator to compensate for absence of dedicated WhatsApp number; aligned roadmap to 9 distinct phases. |
| Revision 4 | UI Photos Backend Alignment | Expanded backend for clinical checkup wizard (vitals, 32-tooth odontogram, canker sores, informed consent), procedure catalog (`Treatments`), and appointment billing/payment tracking; expanded workbook to 11 sheets. |
| Revision 5 | Proper Layered Architecture | Reorganized backend into strict dedicated layers (app/api/v1/routes, app/controllers, app/services, app/models, app/repositories, app/shared, app/infrastructure, scripts); added Patient Request Simulator module with REQ-XXXXXX IDs and 12th workbook sheet; added Request-ID tracing middleware. |
| Revision 6 | Single Workbook & Simulator Polish | Enforced single-workbook storage (AUTO_BACKUP_ON_SAVE = False) avoiding file sprawl; stamped booking_time on all records; added PATCH /api/patients/{id}; added cancellation flows for APT- and REQ-; completed React WhatsApp Simulator with live status badges; 25/25 tests passing. |
| Revision 7 | Supabase Migration & Full Frontend Wiring | Migrated database to Supabase PostgreSQL (17 tables). Implemented `SupabaseClinicRepository` with psycopg2 connection pooling. Added Sales, Purchases, Inventory, Staff, and Treatment CRUD APIs and on-demand CSV exports. Connected all 9 Next.js frontend pages to the live FastAPI backend with zero mock data. Added Zustand data stores. Verified type safety with zero TypeScript or Python compile errors. |
| Revision 8 | Zendenta v3 Receptionist-First Architecture & Upgrade | Upgraded dashboard to Zendenta v3 receptionist specifications. Enforced Next.js 16 Server vs. Client Component discipline (`app/reservations` and `app/patients` as Server Components). Eliminated duplicate calendar key `cal-d1-a4` via Set deduplication. Replaced medical checkup editing with read-only Visit Summary panel (`VisitSummaryPanel`), receptionist admin notes, and Take Payment dialog (`TakePaymentDialog`). Implemented 7-state appointment lifecycle engine (`lib/appointment-lifecycle.ts`). Integrated 4-step walk-in intake drawer (`WalkInSheet`) and lobby wait duration badges (amber at 10m, red at 20m). |
| Revision 9 | Zendenta v3 Full-Stack Backend Integration | End-to-end integration of Zendenta v3 receptionist features with backend: 1. Strict 7-state canonical appointment lifecycle (`scheduled`, `checked-in`, `in-progress`, `completed`, `paid`, `cancelled`, `no-show`) implemented across Pydantic models, BookingService state machine, and repositories. 2. Added `PATCH /api/v1/appointments/{id}/status` with transition guards (rejects illegal jumps with 400 InvalidTransitionError). 3. Added `GET` and `POST /api/v1/appointments/{id}/visit-summary` for structured clinical reports (diagnosis, prescriptions, treatments, follow-up, itemized billing). 4. Provider ID normalization mapping `d1`, `d2`, `d3` <=> `DOC-000001`, `DOC-000002`, `DOC-000003` in both Supabase PostgreSQL and OpenPyXL Excel repositories. 5. Payment sync: `PATCH /payment` automatically advances completed appointments to `paid` and records ledger transactions. 6. Walk-in intake: creates patient and appointment with `source: 'WALK_IN'` and `status: 'checked-in'`. 7. Updated Supabase seeds, Excel initial schemas, frontend `api-client.ts`, `CalendarBoard.tsx`, `WalkInSheet.tsx`, `VisitSummaryPanel.tsx`, and comprehensive Pytest integration suite (`tests/test_zendenta_v3_integration.py`). |
| Revision 10 | Backend Test Suite Hardening & Enum Remediation | Resolved root causes of the 4 failing tests across the backend test suite: 1. Fixed enum value extraction in `normalize_status_string` (`hasattr(val, "value")`), preventing `AppointmentResponse` from raising `ValueError` and silently falling back to `"scheduled"` for every appointment status (`cancelled`, `finished`, `confirmed`). 2. Separated string normalization from `to_canonical_status` so stored statuses are preserved without breaking legacy tests. 3. Expanded `AvailabilityService.calculate_available_slots` busy ranges to include all non-cancelled, active appointments (`SCHEDULED`, `CHECKED_IN`, `IN_PROGRESS`). 4. Reconciled creation defaults in `AppointmentCreate` and `ExcelClinicRepository.create_appointment` to `"confirmed"`. 5. Result: 100% green pass across all 37 backend tests. |
| Revision 11 | Complete Frontend Zero-Mock Purge & Calendar Drag-and-Drop Rescheduling | 1. Resolved appointment `a14` 404 error by eliminating mock-data fallbacks in `reservations/page.tsx` and `CalendarBoard.tsx`. 2. Purged all hardcoded mock data across all routes (`dashboard`, `patients`, `patients/[id]`, `staff`, `sales`, `stocks`, `purchases`, `accounts`, `payment-methods`, `treatments`, `WalkInSheet`, `RescheduleDialog`). All pages initialize to `[]` and strictly render live backend data. 3. Implemented native HTML5 Drag-and-Drop rescheduling on `CalendarBoard.tsx`: cards are draggable with duration detection, and hourly dentist slots serve as drop targets with visual dropzone feedback (`bg-primary/20 border-dashed`). Rescheduling executes an optimistic UI transition and persists immediately via `POST /api/v1/appointments/{id}/reschedule`, rolling back cleanly if a conflict occurs. 4. Bound dynamic current date and live sales revenue KPIs. |
| Revision 12 | Repository Data Isolation & Test Invariant Restoration | Resolved sequence collision bug in `test_appointment_booking_and_conflict_prevention` (`assert 'APT-000006' == 'APT-000001'`). Decoupled fresh workbook schema initialization from demo transactional data in `ExcelClinicRepository`: removed automatic insertion of `DEFAULT_PATIENTS` and `DEFAULT_APPOINTMENTS` from `_create_fresh_workbook()`, preserving clean empty operational sheets (`SHEET_PATIENTS`, `SHEET_APPOINTMENTS`) during test fixture instantiation. Added explicit `repo.seed_demo_data()` method invoked by `backend/scripts/reset_demo_data.py` to maintain rich demo datasets for standalone Excel development without contaminating unit/integration tests. |
| Revision 13 | Reservations Doctor Sync & Bulletproof Time Parsing | 1. Replaced hardcoded fallback columns with dynamic database doctor columns: `CalendarBoard` renders all active practitioners returned by `api.dentists.list()`. 2. Added `parseTimeToHour` helper handling 12h (`09:00 AM`), 24h (`14:30`), seconds (`09:00:00`), and range strings, eliminating `NaN` pixel positioning errors. 3. Added multi-field appointment matching (`dentist_id`, `dentistId`, `dentist_name`, `dentist`) with a catch-all column fallback ensuring zero hidden appointments. 4. Added inline date picker input (`<input type="date">`) for fast navigation across dates. |
| Revision 14 | React Key Collision Elimination & State Deduplication | 1. Eliminated React duplicate key warnings (`log-APT-000007`) by adding `Set<string>` deduplication in `loadData()` and `loadDashboardData()`. 2. Converted all map iterations across Calendar, Dashboard (Waiting List, Requests, Schedule), Patient Profile (Appointments, Visits), Staff, and Treatments to collision-free indexed composite keys. 3. Configured comprehensive `.gitignore` files for root and all sub-projects with security exclusions and clean repository state. |
