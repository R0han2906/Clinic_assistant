# Implementation Phases

## Strategy

The product follows a disciplined **website-first, zero-CORS proxy, dual-storage, and simulator-first strategy**. Walk-In triage, WhatsApp inbound review drawers, and Supabase PostgreSQL storage have been integrated and verified ahead of live WhatsApp Business API onboarding.

Core baseline:
> **The platform features a Next.js staff portal with zero-CORS reverse proxy, Walk-In intake triage, WhatsApp inbound request drawer, universal 24-hour time standard, FastAPI layered MVC backend, dual storage (Supabase PostgreSQL primary + Excel fallback), and an authentic React WhatsApp Bot Simulator (`simulator/`).**

---

## Phase 1: Confirm Dental-Clinic Workflow
- **Objective:** Deeply understand and document the actual clinic workflow with a real design partner.
- **Status:** **COMPLETED**
- **Activities:**
  - Standardized minimal patient demographic fields, emergency contacts, medical flags, and allergies.
  - Documented dentist scheduling patterns (1 primary dentist, with 2 or 3 dentists on peak days).
  - Established standard 30-minute appointment slot durations, lunch breaks, and leave policies.
- **Exit Gate:** Clinic approved initial registration fields, appointment duration rules, and pilot success criteria.

---

## Phase 2: Staff Website & Operational Front Desk
- **Objective:** Deliver an intuitive, high-performance operational web interface for receptionists and practitioners.
- **Status:** **COMPLETED & OPERATIONAL** (Next.js 14 App Router, TailwindCSS, Radix UI, Lucide icons).
- **Key Deliverables:**
  1. **Next.js Reverse Proxy (`next.config.mjs`):** Proxies all `/api/:path*` requests to `http://127.0.0.1:8000/api/:path*`, eliminating browser CORS preflight overhead and IPv6 localhost resolution mismatches.
  2. **Walk-In Intake Drawer (`features/walk-in`):**
     - Fast debounced patient lookup (`/api/v1/patients/lookup?q=...`) searching phone, name, or `PAT-XXXXXX`.
     - Live On-Duty Dentist Availability Grid (`DentistAvailabilityGrid.tsx`) showing active treatments, next openings, and shortest-wait badges.
     - 1-Click walk-in creation tagged with `source: 'WALK_IN'`.
  3. **WhatsApp Inbound Request Review Panel (`features/whatsapp-agent`):**
     - Top navigation unread badge (`BookingRequestBadge.tsx`) with pulse animation and 15s background polling.
     - Slide-over drawer (`BookingRequestPanel.tsx`) with 1-click Approve (creates confirmed calendar appointment with `source: 'WHATSAPP'`) and 1-click Reject.
  4. **Strict 24-Hour Time Standard (`HH:mm`):** Calendar grid left axis `09:00` to `00:00`, appointment cards `09:00 › 10:00`, operating timings `09:00 - 00:00`.
  5. **Client-Side Live Event Bus (`lib/event-bus.ts`):** Decoupled event pub/sub updating calendar and request lists instantaneously without page reloads.

---

## Phase 3: FastAPI Backend & Dual Storage Architecture
- **Objective:** Deliver a robust, typed backend API backed by Supabase PostgreSQL (primary) and an OpenPyXL Excel repository (fallback).
- **Status:** **COMPLETED & VERIFIED**
- **Key Deliverables:**
  - Modular MVC architecture: routes (`app/api/v1/routes/`) → controllers (`app/controllers/`) → domain services (`app/services/`) → repositories (`app/repositories/`).
  - **Supabase PostgreSQL Repository:** 17 normalized relational tables, connection pooling (`ThreadedConnectionPool`), foreign keys, and cascading rules.
  - **OpenPyXL Excel Repository:** 12-sheet workbook (`clinic_data.xlsx`) with process-safe `lock-once-delegate` cross-platform file locking.
  - Sequenced ID generators (`PAT-XXXXXX`, `APT-XXXXXX`, `REQ-XXXXXX`, `SAL-XXXXXX`, `INV-XXXXXX`, `PO-XXXXXX`).
  - Autocomplete search route: `GET /api/v1/patients/lookup?q=...`.
  - Reschedule route: `POST /api/v1/appointments/{id}/reschedule`.
  - Filterable patient requests: `GET /api/v1/patient-requests?patient_phone=...` with trailing 10-digit matching.

---

## Phase 4: Patient Registration and Clinical Checkup Workflow
- **Objective:** Connect staff frontend to patient demographics, checkups, and visual dental charting.
- **Status:** **COMPLETED**
- **Key Deliverables:**
  - Duplicate detection on registration with explicit staff bypass confirmation (`force_create=true`).
  - Interactive 32-tooth adult Odontogram with FDI notation and condition tagging.
  - 4-step clinical checkup workflow (Chief Complaint, Intraoral Exam, Diagnosis, Treatment Plan).
  - Demographic updates via `PATCH /api/v1/patients/{id}`.

---

## Phase 5: Dentist Availability and Appointment-Range Booking
- **Objective:** Central availability calculation engine preventing scheduling conflicts.
- **Status:** **COMPLETED**
- **Key Deliverables:**
  - Working hours, lunch breaks, and approved leave deduction.
  - Non-conflicting 30-minute slot generation (`GET /api/v1/availability/slots`).
  - Atomic booking validation guaranteeing 0% double-booking rate.
  - Rescheduling and cancellation endpoints with audit log tracking.

---

## Phase 6: Patient WhatsApp Bot Simulator (`simulator/`)
- **Objective:** Build an external patient request simulator to imitate the WhatsApp patient experience.
- **Status:** **COMPLETED & ENHANCED** (React + TypeScript + Vite running on Port 5173).
- **Key Deliverables:**
  - Authentic WhatsApp mobile conversation frame (green accents `#075E54` / `#25D366`, chat bubbles, typing indicators).
  - Phone verification and returning patient recognition.
  - Dynamic request intake submitting to `POST /api/v1/patient-requests` generating `REQ-XXXXXX` IDs.
  - **Direct Cancellation from Confirmation Card:** Immediate 1-click cancel button calling `PATCH /api/v1/patient-requests/{id}` with status `cancelled`.
  - **Multi-Booking Rescheduling Picker:** Fetches all upcoming appointments for the verified phone and lets the patient choose which specific booking to reschedule.
  - **Strict 24-Hour Time Chips (`HH:mm`):** All slot options rendered in military notation.

---

## Phase 7: Controlled Clinic Pilot
- **Objective:** Deploy staff website, backend, and simulator in a single real-world dental clinic for evaluation.
- **Status:** **IN PROGRESS / PILOT READY**
- **Activities:**
  - Dual-storage active; front-desk operational staff training.
  - Monitoring booking speeds, walk-in triage efficiency, and review drawer response times.
  - Verification of zero data corruption under concurrent front-desk and simulator operations.

---

## Phase 8: Supabase Migration
- **Objective:** Transition primary storage from Excel to Supabase PostgreSQL.
- **Status:** **COMPLETED AHEAD OF SCHEDULE**
- **Outcome:** Supabase PostgreSQL with 17 normalized tables is live and running as the default primary repository. Excel remains available as an offline fallback.

---

## Phase 9: Real WhatsApp Business Integration
- **Objective:** Connect official WhatsApp Business Platform (Cloud API) to replace the simulator adapter.
- **Activities:**
  - Provision Meta WhatsApp Business Account (WABA) and phone number.
  - Implement webhook listener (`POST /api/v1/webhooks/whatsapp`) mapping WhatsApp incoming payloads directly to existing `PatientRequestService`.
  - Wire front-desk escalation paths for non-automated queries.
- **Exit Gate:** Live WhatsApp message from a patient creates an intake request that appears in the staff review drawer with zero code changes required in the core services.
