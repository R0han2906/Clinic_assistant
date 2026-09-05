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
| **Phase 2** | Staff Website Prototype | Next Priority | UI layout designed in [Product Design Specification.md](file:///c:/Users/Dhruv%20Dube/Desktop/hackathons/Projects/Clinic_assistant/docs/Product%20Design%20Specification.md). |
| **Phase 3** | FastAPI & Excel Pilot Backend | **COMPLETED** | MVC architecture, 9 sheets, atomic writes, filelock, all 10 tests green. |
| **Phase 4** | Patient Registration & Visit Workflow | Backend Ready | APIs `/api/patients` and `/api/visits` fully functional. |
| **Phase 5** | Dentist Availability & Booking | Backend Ready | Slot calculation with working hours, breaks, and leaves complete. |
| **Phase 6** | Build Patient Request Simulator | Planned | Test harness to imitate WhatsApp requests against FastAPI services. |
| **Phase 7** | Controlled Clinic Pilot | Planned | 2–4 week pilot with partner clinic. |
| **Phase 8** | Decide on Supabase Migration | Deferred | Triggered when concurrency or multiple clinics demand it. |
| **Phase 9** | Real WhatsApp Integration | Deferred | Triggered once website workflow is stable and number is active. |

---

## Key Architectural Risks & Safeguards

1. **Excel Concurrency & Corruption:**
   - *Risk:* Multiple simultaneous requests or crashed writes corrupting `clinic_data.xlsx`.
   - *Safeguards:* OS-level `filelock.FileLock`, atomic temp-file rename (`os.replace`), and rolling pre-write snapshots in `backups/`.
2. **Re-entrant FileLock Deadlocks:**
   - *Risk:* Nested method calls attempting to acquire the same non-reentrant lock.
   - *Safeguard:* Lock-once-delegate architecture where public methods acquire the lock once and pass in-memory state to private `_unlocked` helpers.
3. **Cloud Ephemeral Storage Loss:**
   - *Risk:* Container restarts erasing the Excel workbook in hosted environments.
   - *Safeguard:* Mandatory persistent volume mounting; local clinic hardware deployment during early pilot.
4. **Duplicate Patient Records:**
   - *Risk:* Receptionists inadvertently creating duplicate profiles for returning patients.
   - *Safeguard:* Duplicate checking by name and phone with explicit `force_create` bypass modal.
5. **Divergent Booking Logic:**
   - *Risk:* Writing custom booking code for the simulator or WhatsApp that bypasses availability rules.
   - *Safeguard:* Strict single booking engine in FastAPI domain services.

---

## Unresolved Questions

1. **First Design Partner:** Which specific dental clinic will host the initial Phase 7 pilot?
2. **Registration Fields Customization:** Does the pilot clinic require any additional administrative fields (e.g., insurance provider ID or referral source)?
3. **Appointment Duration Standards:** Will the clinic use fixed 30-minute intervals exclusively, or variable procedure durations (e.g., 60 mins for root canals)?
4. **Hosting Topology:** Will Phase 7 run on a dedicated local machine in the clinic reception, or on a secure hosted server with persistent volume storage?
5. **Supabase Migration Threshold:** Exactly what volume threshold (e.g., >500 appointments or >2 concurrent receptionists) triggers the Phase 8 migration?
6. **WhatsApp Provider Selection:** Will the clinic use the Meta Cloud API directly or an approved Business Solution Provider (e.g., Twilio, Gupshup) in Phase 9?

---

## Change History

| Date | Change Event | Detail |
|---|---|---|
| Initial | WhatsApp-first clinic bot | Concept considered WhatsApp as initial interface. |
| Revision 1 | Transition to Website First | Pivoted to clinic staff website with Excel storage; deferred WhatsApp & Supabase. |
| Revision 2 | Backend & Lock Architecture | Built complete FastAPI MVC backend; fixed filelock re-entrancy with `_unlocked` helpers; 10/10 tests green. |
| Revision 3 | Simulator-First Integration | Added Patient Request Simulator to compensate for absence of dedicated WhatsApp number; aligned roadmap to 9 distinct phases. |
