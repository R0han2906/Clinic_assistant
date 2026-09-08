# Product Requirements Document

## Product

**Working name:** DentalFlow

**Product type:** Full-stack dental clinic management platform featuring a staff operational portal, an interactive Patient WhatsApp Bot Simulator, dual storage (Supabase PostgreSQL + OpenPyXL Excel fallback), and an end-to-end inbound request approval workflow.

**Document status:** Updated Production Baseline (incorporating Walk-In Intake, WhatsApp Inbound Review, Zero-CORS Next.js Proxy, Multi-Booking Rescheduling, and Universal 24-Hour Time Standard).

---

## 1. Important Scope & Architectural Decision

The system is a dedicated **dental clinic management platform** designed to solve the critical day-to-day administrative challenges of dental practices:
1. **Next.js Staff Frontend (Port 3000):** Operational hub for front-desk receptionists and practitioners. Includes the Daily Calendar Board, interactive Odontogram, Walk-In Intake Drawer, and the WhatsApp Inbound Request Review Panel.
2. **Next.js Zero-CORS Reverse Proxy:** Built into `next.config.mjs`, transparently routing browser `/api/:path*` calls to `http://127.0.0.1:8000/api/:path*` without CORS preflight latency.
3. **FastAPI Layered Backend (Port 8000):** Modular MVC architecture with dedicated routes, controllers, domain services, and repository layers.
4. **Dual Storage Engine:** Supabase PostgreSQL (17 relational tables, connection pooling) as primary production storage, with an OpenPyXL Excel repository (`clinic_data.xlsx` with thread-safe `lock-once-delegate` file locking) for offline/pilot deployments.
5. **Patient WhatsApp Bot Simulator (`simulator/` on Port 5173):** Realistic mobile chat interface simulating patient interactions (new bookings, multi-appointment rescheduling, direct cancellations).
6. **Universal 24-Hour Time Standard (`HH:mm`):** All times across calendar columns, appointment cards, visit logs, bot slot chips, and API schemas strictly follow 24-hour military notation (`hour12: false`).

---

## 2. Product Summary & Data Flow

DentalFlow provides dental clinic staff with a comprehensive, modern web platform. Staff can manage patients, schedule appointments, record dental checkups with visual teeth numbering, manage sales/invoices, adjust inventory, and review incoming requests.

### Integrated Request Approval Flow
```text
Patient WhatsApp Simulator (Port 5173)
        -> POST /api/v1/patient-requests (status: 'pending', id: 'REQ-XXXXXX')
        -> Next.js Staff Frontend (Port 3000 - Inbound Request Panel)
        -> Front-Desk Staff 1-Click Approval
        -> POST /api/v1/patient-requests/{id}/approve
        -> Automatic Confirmed Appointment Creation (source: 'WHATSAPP')
        -> Live Event Bus updates CalendarBoard without page reload
```

### Walk-In Patient Intake Flow
```text
Unscheduled Walk-In Patient arrives at Front Desk
        -> Receptionist opens Walk-In Drawer
        -> Live Autocomplete Search (/api/v1/patients/lookup?q=...)
        -> Existing patient auto-fills demographics OR new patient registered
        -> Live On-Duty Dentist Availability Grid calculates real-time conflicts
        -> System highlights shortest-wait dentist
        -> Staff books immediate appointment (source: 'WALK_IN')
        -> Instant calendar placement
```

---

## 3. Product Vision

> Deliver a unified, beautiful, zero-friction operating system for dental practices—seamlessly bridging front-desk calendar operations, walk-in patient triage, clinical odontograms, and patient-side WhatsApp booking interactions.

---

## 4. Target Users

| User | Main Need |
|---|---|
| Receptionist / Front Desk | Triage walk-ins, review incoming WhatsApp booking requests, manage calendar appointments, register patients, process billing |
| Dentist / Practitioner | Review daily schedule, access visual odontogram chart, inspect previous visit summaries and medical histories |
| Clinic Owner / Manager | Monitor daily operational revenue, appointments, dentist utilization, and inventory levels |
| Patient (via WhatsApp Simulator) | Discover available clinic slots, request appointments, review upcoming bookings, reschedule or cancel anytime |

---

## 5. Core Product Principles

1. **Website & Calendar Centricity:** The clinic staff calendar remains the single source of operational truth.
2. **Zero-Friction Inbound Review:** Incoming WhatsApp requests land in an interactive review drawer where staff approve or reject with 1 click.
3. **Unified Booking Engine:** Walk-ins, phone reservations, and WhatsApp requests all use the exact same availability validation engine.
4. **24-Hour Time Precision:** Strict `HH:mm` notation eliminates AM/PM scheduling ambiguities.
5. **Zero-CORS Reliability:** Server-side proxy rewrites ensure client-side requests never fail due to CORS or local loopback resolution issues.
6. **Human-in-the-Loop:** Clinical and scheduling decisions remain under staff control.

---

## 6. Detailed Feature Requirements

### A. Walk-In Intake & On-Duty Roster (`features/walk-in`)
- **Live Autocomplete Search:** Debounced query against `/api/v1/patients/lookup?q=...` searching by name, phone, or patient ID (`PAT-XXXXXX`).
- **On-Duty Dentist Availability Grid (`DentistAvailabilityGrid.tsx`):**
  - Fetches all dentists on duty for the current date.
  - Dynamically computes ongoing appointments, next free slot, and estimated wait minutes.
  - Highlights the dentist with the **shortest wait time** via visual badge.
- **Walk-In Tagging:** Appointments created via this drawer are tagged with `source: 'WALK_IN'`.

### B. WhatsApp Inbound Request Review (`features/whatsapp-agent`)
- **Top Navigation Counter Badge (`BookingRequestBadge.tsx`):** Displays pending request count with live pulse animation and 15s background polling.
- **Review Drawer (`BookingRequestPanel.tsx` & `BookingRequestCard.tsx`):**
  - Displays patient contact details, preferred dentist, requested date, 24h slot (`HH:mm`), and reason.
  - **1-Click Approval:** Converts request to a confirmed calendar appointment tagged with `source: 'WHATSAPP'`.
  - **1-Click Rejection:** Marks request as rejected with rejection reason.
  - Automatically notifies the calendar via `eventBus.publish('APPOINTMENT_CREATED')`.

### C. Patient WhatsApp Simulator (`simulator/`)
- **Interactive Mobile Chat:** Clean, responsive WhatsApp UI running on Port 5173.
- **Dynamic Request Generation:** Assigns persistent `REQ-XXXXXX` IDs to each intake request.
- **Direct Cancellation:** Confirmation cards include an immediate "Cancel Request" action that updates request status to `cancelled` via `PATCH /api/v1/patient-requests/{id}`.
- **Multi-Booking Rescheduling:** Patients can view all their upcoming appointments and choose which specific booking to reschedule.
- **24-Hour Slot Chips:** All available time slots rendered in `HH:mm` format.

### D. Calendar Board & Scheduling
- **Daily View Columns:** 09:00 to 00:00 schedule grid with 24-hour left-axis time markings.
- **Card Formatting:** Appointment cards display 24h intervals (`09:00 › 10:00`, `14:30 › 15:30`).
- **Conflict Prevention:** Zero double bookings enforced at the database transaction layer.

### E. Backend Robustness & Phone Matching
- **Digit-Matching Query Filters:** `GET /api/v1/patient-requests?patient_phone=...` strips non-digit characters and matches the trailing 10 digits, harmonizing international `+91` and local phone numbers.
- **Autocomplete Endpoint:** `GET /api/v1/patients/lookup?q=...` returns top 8 matching patients instantly.
- **Reschedule Endpoint:** `POST /api/v1/appointments/{id}/reschedule` validates dentist availability and updates slot atomically.

---

## 7. Success Metrics

| Metric | Target |
|---|---|
| Double Booking Rate | Exactly 0% |
| Inbound Approval Latency | < 1 second for 1-click staff approval to calendar sync |
| Phone Lookup Precision | 100% match rate across `+91` and 10-digit formats |
| 24-Hour Time Consistency | 100% compliance across all frontend cards and backend payloads |
| API Communication Health | 0 CORS errors via Next.js reverse proxy |
