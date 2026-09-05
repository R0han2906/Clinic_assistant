# Implementation Phases

## Strategy

The product follows a disciplined **website-first and simulator-first strategy**. WhatsApp integration and Supabase migration are intentionally deferred until the clinic staff workflow, booking rules, and data models are thoroughly proven in a controlled real-world pilot.

Core baseline:
> **The first release is a dentist-clinic staff website with a Patient Request Simulator, FastAPI backend, and controlled Excel pilot storage. Supabase and real WhatsApp integration come later after validation.**

---

## Phase 1: Confirm the Real Dental-Clinic Workflow

- **Objective:** Deeply understand and document the actual clinic workflow with a real design partner before writing UI code.
- **Activities:**
  - Partner with one single-location dental clinic.
  - Shadow front-desk staff during patient registration and appointment scheduling.
  - Finalize minimal patient fields and structured previous-visit summary format.
  - Document dentist scheduling patterns: 1 primary dentist, with 2 or 3 dentists on peak days.
  - Document standard appointment slot durations, lunch breaks, buffer times, and leave notice policies.
- **Exit Gate:** Clinic approves the initial registration fields, appointment duration rules, and pilot success criteria.
- **Stop or Pivot Condition:** Stop or revise if clinic scheduling patterns require unbounded dynamic duration rules before fixed ranges are tested.

---

## Phase 2: Staff Website Prototype

- **Objective:** Validate staff ergonomics, navigation, and usability through an intuitive web interface.
- **Activities:**
  - Build authenticated staff login view.
  - Build patient registration form with duplicate detection prompt.
  - Build patient search and profile view with structured previous-visit history.
  - Build dentist schedule configuration view (working hours, breaks, leave dates).
  - Build daily appointment calendar view.
  - Build appointment booking modal with real-time slot selection.
- **Exit Gate:** Receptionist can register a patient, review past visits, check availability, and book an appointment without developer assistance.
- **Stop or Pivot Condition:** Pivot layout or form design if receptionists find the workflow too slow or confusing under simulated front-desk time pressure.

---

## Phase 3: FastAPI and Excel Pilot Backend

- **Objective:** Deliver a robust, typed backend API backed by controlled, single-writer Excel pilot storage.
- **Status:** **COMPLETED & VERIFIED** (FastAPI layered architecture, 12-sheet openpyxl repository, atomic writes, OS file locking, single-workbook storage invariant without backup file sprawl, full 25-test suite passing).
- **Activities:**
  - Build FastAPI REST routes and controllers for patients, visits, dentists, schedules, leaves, appointments, treatments, checkups, and patient requests.
  - Implement 12-sheet workbook schema (`Patients`, `Visits`, `Dentists`, `Availability`, `Leaves`, `Appointments`, `Staff`, `AuditLog`, `Metadata`, `Treatments`, `MedicalCheckups`, `PatientRequests`).
  - Implement atomic write mechanism (write to `.tmp` -> validate -> `os.replace()`).
  - Implement file locking (`filelock.FileLock`) using the **lock-once-delegate pattern** to prevent re-entrant deadlocks.
  - Implement single-workbook storage invariant (`AUTO_BACKUP_ON_SAVE = False`) with explicit `booking_time` and `created_at` timestamp tracking.
  - Implement collision-free sequenced ID generators (`PAT-XXXXXX`, `APT-XXXXXX`, `REQ-XXXXXX`, etc.).
- **Exit Gate:** All automated tests pass (25/25 green), zero deadlocks, and verified atomic persistence.
- **Stop or Pivot Condition:** If file corruption occurs under load, immediately halt feature development until storage safety invariants are restored.

---

## Phase 4: Patient Registration and Previous-Visit Workflow

- **Objective:** Connect the staff website frontend to the FastAPI patient and visit endpoints.
- **Activities:**
  - Integrate frontend registration form with `POST /api/patients`.
  - Handle duplicate detection warnings (HTTP 409) with explicit staff bypass confirmation (`force_create=true`).
  - Connect patient search by name, phone, or ID to `GET /api/patients?query=...`.
  - Connect patient profile and structured visit entry to `POST /api/patients/{id}/visits` and `GET /api/patients/{id}/visits`.
  - Support profile editing via `PATCH /api/patients/{id}`.
- **Exit Gate:** Front-desk staff can register new patients, view instant duplicate warnings, edit patient details, and append structured visit summaries that persist reliably to `clinic_data.xlsx`.
- **Stop or Pivot Condition:** Revise search indexing or duplicate matching logic if staff experience false-positive duplicate blocking.

---

## Phase 5: Dentist Availability and Appointment-Range Booking

- **Objective:** Connect frontend booking and schedule views to the central availability calculation and appointment services.
- **Activities:**
  - Connect dentist schedule configuration to `PUT /api/dentists/{id}/schedule/{day_of_week}` and `POST /api/dentists/{id}/leaves`.
  - Connect slot selection to `GET /api/availability/slots?dentist_id={id}&date={date}`.
  - Verify that working hours, breaks, leaves, and booked appointments are deducted correctly.
  - Connect booking submission to `POST /api/appointments`.
  - Implement appointment rescheduling (`POST /api/appointments/{id}/reschedule`) and cancellation (`POST /api/appointments/{id}/cancel`) workflows.
- **Exit Gate:** Zero double bookings under concurrent booking attempts; schedule updates instantly on the daily calendar.
- **Stop or Pivot Condition:** If slot generation logic creates conflicting ranges, halt and fix core service algorithms before continuing.

---

## Phase 6: Build Patient Request Simulator

- **Objective:** Build an external patient request simulator to imitate the future WhatsApp patient experience in the absence of a live WhatsApp business number.
- **Status:** **COMPLETED & OPERATIONAL** (Built `patient-whatsapp-simulator/` in React + TypeScript + Vite).
- **Activities:**
  - Build a standalone simulator web interface featuring authentic WhatsApp message bubbles and interactive cards.
  - Implemented phone verification and returning patient recognition vs new patient onboarding.
  - Implemented real-time slot selection with dentist and treatment pickers calling `/api/availability/slots` and `/api/treatments`.
  - Connected intake submission to `POST /api/v1/patient-requests` generating `REQ-XXXXXX` IDs.
  - Implemented **Patient Profile Updates (`UpdatePatientCard.tsx`)** connected to `PATCH /api/patients/{id}`.
  - Implemented **Interactive Cancellation Card (`CancelAppointmentCard.tsx`)** with reason selection and dual reference routing (`REQ-` vs `APT-`).
- **Exit Gate:** Simulator successfully submits requests, updates patient details, and handles cancellations through the exact same backend services that WhatsApp will later call.
- **Stop or Pivot Condition:** If simulator requires custom business rules different from staff booking, halt immediately and reconcile domain services to maintain a single booking engine.


---

## Phase 7: Controlled Clinic Pilot

- **Objective:** Deploy the staff website and simulator in a single real-world dental clinic for a 2–4 week evaluation.
- **Activities:**
  - Deploy backend and frontend on clinic hardware or controlled persistent server.
  - Conduct staff training session.
  - Maintain existing clinic paper/manual booking as a parallel safety fallback.
  - Monitor rolling backups, file-lock performance, and data integrity daily.
  - Measure staff registration speed, booking accuracy, and error frequency.
- **Exit Gate:** Staff use DentalFlow exclusively for 2 continuous weeks with positive adoption and zero corrupted records.
- **Stop or Pivot Condition:** If staff repeatedly abandon the software for their old manual process, pause pilot and redesign problematic workflows.

---

## Phase 8: Decide on Supabase Migration

- **Objective:** Transition storage from the temporary Excel pilot workbook to Supabase (PostgreSQL) when scaling or reliability criteria are met.
- **Trigger Conditions (Any of the following):**
  - Clinic adds concurrent front-desk terminals requiring simultaneous write access.
  - Product expands to a second clinic location.
  - Workbook file size or lock contention introduces observable latency.
  - Preparing for live WhatsApp customer traffic.
- **Activities:**
  - Freeze Excel workbook schema.
  - Execute automated migration script transferring normalized sheets to PostgreSQL tables.
  - Verify 100% row parity, foreign keys, and sequenced ID continuity.
  - Implement `PostgresRepository` adhering to the existing repository interface.
  - Swap repository implementation via FastAPI dependency injection.
- **Exit Gate:** Full test suite passes against Supabase; staff website operates identically with zero data loss.
- **Stop or Pivot Condition:** If migration script shows record discrepancies, roll back immediately to the archived Excel snapshot.

---

## Phase 9: Add Real WhatsApp Integration

- **Objective:** Replace the Patient Request Simulator with official WhatsApp Business Platform integration.
- **Activities:**
  - Provision verified WhatsApp Business Account (WABA) and dedicated phone number.
  - Implement secure webhook endpoint (`POST /api/webhooks/whatsapp`) with signature verification.
  - Build conversation state handler to collect patient details, requested dentist, and preferred slot.
  - Wire webhook handler to the existing `AvailabilityService` and `AppointmentService`.
  - Implement human escalation path to notify front-desk staff when patient intent is ambiguous.
- **Exit Gate:** Live WhatsApp message from a patient creates an appointment on the staff schedule, and patient receives an automated confirmation template.
- **Stop or Pivot Condition:** If WhatsApp messaging costs or API policy changes affect viability, retain the web-based booking simulator/portal as a customer alternative.

---

## Go/No-Go Decision Matrix

| Gate | Continue When | Stop or Revise When |
|---|---|---|
| **Workflow (Phase 1)** | Clinic approves fields and scheduling rules | Requirements remain ambiguous or change constantly |
| **Website Prototype (Phase 2)** | Staff complete core flows independently | Staff struggle with basic navigation |
| **Backend & Excel (Phase 3)** | Atomic writes, file locking, and tests pass | Workbook experiences locking deadlocks or data loss |
| **Simulator (Phase 6)** | Simulator appointments flow into staff calendar | Simulator requires divergent booking logic |
| **Clinic Pilot (Phase 7)** | Positive adoption after 2+ weeks | Staff revert to manual paper/Excel spreadsheets |
| **Supabase Migration (Phase 8)** | 100% data parity verified across all entities | Any ID collision or missing historical visit |
| **WhatsApp (Phase 9)** | Staff workflow is proven and number is active | Premature attempt before staff workflow is stable |
