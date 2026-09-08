# Project Memory

## Purpose

This document serves as the long-term memory for the DentalFlow project, recording approved architectural decisions, durable constraints, current progress against the 9-phase roadmap, key risks, and open questions.

---

## Current Product Identity

- **Working Name:** DentalFlow
- **Domain:** Single-location dental clinic operations (1 primary dentist, expandable to 2–3 dentists).
- **Core Release Baseline:**
  > **A unified dental clinic platform: Next.js staff frontend with zero-CORS proxy, Walk-In intake, WhatsApp review drawer, 24-hour military time standard, FastAPI layered MVC backend, dual storage (Supabase PostgreSQL primary + Excel fallback), and an authentic React WhatsApp Bot Simulator (`simulator/`).**
- **Staff User Interface:** Next.js 14 App Router operational portal with interactive calendar, Walk-In drawer, WhatsApp review panel, and visual odontogram.
- **Patient-Side Channel:** **Patient WhatsApp Bot Simulator** (`simulator/` on Port 5173) featuring interactive conversation bubbles, direct cancellations, and multi-appointment rescheduling.
- **Storage Layer:** Supabase PostgreSQL (17 relational tables, primary) with OpenPyXL Excel repository (`clinic_data.xlsx`, fallback under process-safe file locks).
- **Future Growth:** Meta WhatsApp Business Cloud API integration.

---

## Approved Durable Decisions

1. **Dentist-Clinic Focus:** The application is built specifically for dental clinic workflows (patient registration, structured visit summaries, dentist schedules, slot-based booking). General hospital features are out of scope.
2. **Website & Simulator First:** Staff ergonomics and scheduling correctness are validated thoroughly before provisioning official WhatsApp numbers.
3. **Absence of Dedicated WhatsApp Number:** A dedicated Patient WhatsApp Simulator (`simulator/`) provides realistic mobile patient interactions without phone carrier dependencies.
4. **Single Booking Engine:** Staff website bookings, walk-ins, simulator requests, and future WhatsApp messages all execute through the exact same FastAPI domain services (`AvailabilityService` and `AppointmentService`).
5. **Zero-CORS Reverse Proxy:** Next.js server proxy rewrites (`next.config.mjs`) eliminate CORS preflight overhead and IPv6 localhost resolution mismatches.
6. **Strict 24-Hour Time Standard (`HH:mm`):** All timestamps, calendar axes, cards, and message chips enforce military time (`hour12: false`) to eliminate AM/PM ambiguity.
7. **Robust Phone Digit-Matching:** Request queries normalize phone numbers by trailing 10 digits to seamlessly match `+91` international formats with local 10-digit formats.
8. **Dual Storage Architecture:** Primary data resides in Supabase PostgreSQL; Excel storage with `lock-once-delegate` file locking remains available for offline pilots.
9. **Sequenced Stable IDs:** Every entity uses immutable, formatted keys (`PAT-XXXXXX`, `APT-XXXXXX`, `REQ-XXXXXX`, `SAL-XXXXXX`, `INV-XXXXXX`, `PO-XXXXXX`).
10. **Administrative Scope Only:** The system does not diagnose, prescribe, triage emergencies, or function as an unbounded electronic medical record (EMR).

---

## Current Implementation Status (9-Phase Roadmap)

| Phase | Description | Status | Notes |
|---|---|---|---|
| **Phase 1** | Confirm Real Dental-Clinic Workflow | **COMPLETED** | Established core registration fields, 30m slots, and dentist schedules. |
| **Phase 2** | Staff Website Prototype & Receptionist Upgrades | **COMPLETED** | Walk-In intake drawer, WhatsApp review panel, 24h calendar, zero-CORS proxy. |
| **Phase 3** | FastAPI Backend & Dual Storage | **COMPLETED** | Layered MVC, 17 Supabase tables, OpenPyXL Excel fallback, 37/37 tests green. |
| **Phase 4** | Patient Registration & Clinical Checkup | **COMPLETED** | Duplicate detection, 32-tooth odontogram, 4-step checkup, profile edits. |
| **Phase 5** | Dentist Availability & Booking Engine | **COMPLETED** | Slot calculation with working hours, breaks, leaves, and cancellations complete. |
| **Phase 6** | Patient WhatsApp Bot Simulator (`simulator/`) | **COMPLETED** | Conversational UI, REQ-XXXXXX tickets, direct cancel, multi-booking reschedule. |
| **Phase 7** | Controlled Clinic Pilot | In Progress | Full-stack live testing with Supabase and Staff UI. |
| **Phase 8** | Supabase Migration & Full-Stack Wiring | **COMPLETED** | 17 tables, connection pooling, live API wiring across all pages. |
| **Phase 9** | Real WhatsApp Business API Integration | Next Priority | Official WhatsApp Cloud API integration once business phone is active. |

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
| Revision 8 | Zendenta v3 Receptionist-First Architecture & Upgrade | Upgraded dashboard to Zendenta v3 receptionist specifications. Enforced Next.js 16 Server vs. Client Component discipline. Replaced medical checkup editing with read-only Visit Summary panel (`VisitSummaryPanel`), receptionist admin notes, and Take Payment dialog (`TakePaymentDialog`). Implemented 7-state appointment lifecycle engine (`lib/appointment-lifecycle.ts`). Integrated 4-step walk-in intake drawer (`WalkInSheet`) and lobby wait duration badges. |
| Revision 9 | Zendenta v3 Full-Stack Backend Integration | End-to-end integration of Zendenta v3 receptionist features with backend: 7-state canonical appointment lifecycle, `PATCH /status` transition guards, visit summaries, provider ID normalization (`d1` <=> `DOC-000001`), payment sync, and comprehensive Pytest integration suite. |
| Revision 10 | Backend Test Suite Hardening & Enum Remediation | Resolved root causes of failing tests: fixed enum extraction in `normalize_status_string`, separated string normalization, expanded busy ranges for active appointments, and ensured 100% green pass across all 37 tests. |
| Revision 11 | Complete Frontend Zero-Mock Purge & Drag-and-Drop Rescheduling | Purged all hardcoded mock data across all routes. Implemented native HTML5 Drag-and-Drop rescheduling on `CalendarBoard.tsx` with duration detection, visual dropzones, and optimistic rollback. Bound dynamic current date and live sales revenue KPIs. |
| Revision 12 | Repository Data Isolation & Test Invariant Restoration | Decoupled fresh workbook schema initialization from demo transactional data in `ExcelClinicRepository`, preserving clean empty operational sheets during test fixture instantiation. Added explicit `repo.seed_demo_data()` method. |
| Revision 13 | Reservations Doctor Sync & Bulletproof Time Parsing | Dynamic doctor columns rendered from `api.dentists.list()`. Added `parseTimeToHour` helper handling 12h, 24h, and ranges. Added multi-field appointment matching and date picker navigation. |
| Revision 14 | React Key Collision Elimination & State Deduplication | Eliminated duplicate key warnings by adding `Set<string>` deduplication. Converted all map iterations across Calendar, Dashboard, and Profile to collision-free composite keys. Configured comprehensive `.gitignore`. |
| Revision 15 | Reservation Calendar Nullable FK Hardening & Timezone Sync | Made `patient_id` and `dentist_id` nullable in `AppointmentResponse` with ISO pre-validators for cascade resilience. Introduced timezone-safe `getLocalDateString()`. Upgraded composite range parsing and doctor matching. |
| Revision 16 | Walk-In Intake Triage & Live Autocomplete Roster | Implemented `features/walk-in` with `PatientAutocomplete.tsx` (debounced search via `GET /api/v1/patients/lookup?q=...`) and `DentistAvailabilityGrid.tsx` (real-time ongoing appointment tracking, next opening calculations, and shortest-wait badge recommendations). Walk-in appointments tagged with `source: 'WALK_IN'`. |
| Revision 17 | WhatsApp Inbound Request Review Panel & Live Event Bus | Implemented `features/whatsapp-agent` with `BookingRequestBadge.tsx` (live pulse and 15s polling) and `BookingRequestPanel.tsx`. Front-desk staff can approve incoming simulator requests in 1 click, automatically generating confirmed calendar appointments tagged with `source: 'WHATSAPP'`. Decoupled event bus triggers instant calendar refreshes without full reload. |
| Revision 18 | Backend Filters, Phone Digit-Matching & Simulator Enhancement | Added `patient_phone` and `patient_id` query filters to `GET /api/v1/patient-requests` with trailing 10-digit matching, harmonizing `+91` international prefixes with local numbers. Added direct 1-click cancellation button on the simulator Confirmation Card and multi-booking schedule selector for rescheduling upcoming appointments via `POST /api/v1/appointments/{id}/reschedule`. |
| Revision 19 | Next.js Reverse Proxy & Zero-CORS Architecture | Configured Next.js rewrites in `frontend/next.config.mjs` routing `/api/:path*` to `http://127.0.0.1:8000/api/:path*`. Browser sets `API_URL = ''`, eliminating CORS preflight errors, browser security blocks, and Windows IPv6 `[::1]` resolution mismatches. |
| Revision 20 | Strict 24-Hour Military Time Standard (`HH:mm`) | Enforced strict 24-hour formatting across the entire stack: calendar left-axis markers (`09:00` to `00:00`), appointment cards (`09:00 › 10:00`), clinic header operating timings (`09:00 - 00:00`), visit summaries, and simulator time chips (`hour12: false`). |
