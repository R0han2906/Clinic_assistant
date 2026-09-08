# System Architecture

## 1. Architecture Decision

The system is a production-ready **dental clinic management platform** with:
1. **Next.js Frontend** (Staff Portal, Walk-In Intake, WhatsApp Inbound Review Drawer, Odontogram UI) running on Port 3000.
2. **Next.js Reverse Proxy** (`frontend/next.config.mjs`) that transparently proxies `/api/:path*` to `http://127.0.0.1:8000/api/:path*`, establishing a zero-CORS browser communication model.
3. **FastAPI Modular Layered Backend** (MVC: routes → controllers → services → repositories) running on Port 8000.
4. **Dual-Storage Repository Layer**:
   - **Supabase PostgreSQL Database** (Primary: 17 tables, connection pooling, relational constraints, foreign keys).
   - **Excel OpenPyXL Repository** (Fallback / Offline Pilot: multi-tab workbook with process-safe `lock-once-delegate` cross-platform file locking).
5. **Patient WhatsApp Bot Simulator** (`simulator/` directory) running on Port 5173 for patient-initiated bookings, dynamic cancellations, and multi-appointment rescheduling.
6. **Unified 24-Hour Time Standard (`HH:mm`)**: Standardized across frontend calendar grids, appointment cards, visit summaries, intake drawers, backend validation schemas, and WhatsApp simulator message chips.

---

## 2. System Architecture Diagram

```text
+------------------------------------+             +---------------------------------+
|      Next.js Staff Frontend        |             |   Patient WhatsApp Simulator    |
|      (Port 3000 - App Router)      |             |   (Port 5173 - React + Vite)    |
|                                    |             |                                 |
| - features/walk-in (Autocomplete   |             | - Conversation chat engine      |
|   & On-Duty Dentist Grid)          |             | - REQ-XXXXXX dynamic tickets    |
| - features/whatsapp-agent (Review  |             | - Confirmation card cancel      |
|   Drawer & Top-Nav Badge)          |             | - Multi-booking reschedule list |
| - CalendarBoard (09:00 - 00:00 24h)|             | - 24-hour time chips (HH:mm)    |
+-----------------+------------------+             +----------------+----------------+
                  |                                                 |
                  | Same-Origin HTTP (/api/...)                     | HTTP / REST (Direct CORS)
                  v                                                 v
+------------------------------------+             +---------------------------------+
|       Next.js Reverse Proxy        |             |                                 |
|     (frontend/next.config.mjs)     |             |                                 |
|  Rewrites /api/:path* to Port 8000 |             |                                 |
+-----------------+------------------+             |                                 |
                  |                                |                                 |
                  +---------------+   +------------+                                 |
                                  |   |                                              |
                                  v   v                                              v
+------------------------------------------------------------------------------------+
|                             FastAPI Backend (Port 8000)                            |
|                                                                                    |
|  [ Dedicated Routes Layer (app/api/v1/routes/) ]                                   |
|  - /api/v1/patients       (Registration, Duplicate Check, Autocomplete Search)    |
|  - /api/v1/dentists       (Dentist Profile, Schedules, Leaves)                     |
|  - /api/v1/availability   (Slot Engine: Working Hours - Breaks - Bookings)         |
|  - /api/v1/appointments   (Book, Reschedule, Cancel, Complete, Payment)            |
|  - /api/v1/treatments     (Full CRUD for Procedures & Rates)                       |
|  - /api/v1/checkups       (Odontogram & 4-Step Clinical Checkup)                   |
|  - /api/v1/sales          (Billing, Invoices, Payment Methods, KPI Summary)        |
|  - /api/v1/purchases      (Supply Purchase Orders, Vendors, Receiving)             |
|  - /api/v1/inventory      (Stocks, Low-Stock Alerts, Quantity Adjustments)         |
|  - /api/v1/staff          (Clinic Staff, Assistants, Role Administration)          |
|  - /api/v1/export         (On-Demand CSV Reports: Patients, Sales, Stocks, etc.)   |
|  - /api/v1/patient-requests(Simulator Intake, Review Queue, Phone/ID Filtering)    |
|                                                                                    |
|  [ Controllers Layer (app/controllers/) ]                                          |
|  - Thin orchestration translating HTTP params & query filters into domain calls    |
|                                                                                    |
|  [ Domain Services Layer (app/services/) ]                                         |
|  - Patient, Booking, Availability, Sales, Purchase, Inventory, Staff Services      |
|                                                                                    |
|  [ Repositories Layer (app/repositories/) ]                                        |
|  - BaseClinicRepository (Abstract Interface)                                       |
|  - SupabaseClinicRepository (Primary: ThreadedConnectionPool + PostgreSQL)          |
|  - ExcelClinicRepository (Fallback: OpenPyXL with lock-once-delegate concurrency)   |
+-----------------------------------------+------------------------------------------+
                                          |
                                          | psycopg2-binary / TLS
                                          v
+------------------------------------------------------------------------------------+
|                           Supabase PostgreSQL (17 Tables)                          |
|                                                                                    |
|  1. patients           2. dentists       3. visits          4. availability        |
|  5. leaves             6. appointments   7. treatments      8. medical_checkups    |
|  9. patient_requests  10. staff         11. audit_log      12. metadata            |
| 13. sales             14. vendors       15. purchases      16. inventory           |
| 17. payment_methods                                                                |
+------------------------------------------------------------------------------------+
```

---

## 3. Data Flow, Zero-CORS & Phone Matching

- **Zero-CORS Reverse Proxy Architecture:** The Next.js development and production servers (`next.config.mjs`) rewrite all client requests from `/api/:path*` to `http://127.0.0.1:8000/api/:path*`. Browser clients instantiate `api-client.ts` with `API_URL = ''`, sending same-origin requests. This completely eliminates CORS preflight delays, avoids browser network blockage, and bypasses Windows IPv6 `[::1]` resolution quirks.
- **Robust Phone Digit-Matching:** When the WhatsApp simulator or staff filters requests via `GET /api/v1/patient-requests?patient_phone=...`, the backend extracts the trailing digits (normalizing variations like `+919876543210`, `919876543210`, and `9876543210`). This guarantees exact request matching regardless of country code prefixing.
- **Sequential Human IDs:** Human-readable sequential primary keys (`PAT-000001`, `APT-000001`, `REQ-000001`, `SAL-000001`, `INV-000001`, `PO-000001`, `STF-000001`) preserve clinic record consistency.
- **Direct Storage & Dual Repositories:** All transactions are committed directly to Supabase PostgreSQL with relational integrity, foreign keys, and indexes. When deployed in Excel-only environments, thread-safe file locks prevent corruption.
- **Strict 24-Hour Time Standard:** All timestamp calculations, time pickers, and visual cards operate on 24-hour time strings (`HH:mm`), eliminating AM/PM conversion errors and maintaining military-time precision across surgery rosters.

---

## 4. Operational Modes & Real-Time Synchronization

- **Direct-Access Front-Desk Mode:** Authentication is currently bypassed for receptionist and practitioner workflows, allowing front-desk staff immediate access to scheduling, check-in queue management, and checkout billing without authentication barriers.
- **Walk-In Intake Integration (`features/walk-in`):** Receptionists can rapidly triage unscheduled walk-ins using real-time autocomplete search (`/api/v1/patients/lookup?q=...`), view all on-duty dentists with live conflict calculation and shortest-wait badges (`DentistAvailabilityGrid.tsx`), and book immediate appointments tagged with `source: 'WALK_IN'`.
- **Inbound WhatsApp Queue (`features/whatsapp-agent`):** Inbound booking requests submitted by the WhatsApp simulator are polled by `BookingRequestBadge.tsx` and presented in `BookingRequestPanel.tsx`. Front-desk staff can approve requests in 1 click, automatically converting them into confirmed calendar appointments (`source: 'WHATSAPP'`).
- **Client-Side Event Bus (`lib/event-bus.ts`):** Custom decoupled events (`'appointment-created'`, `'appointment-updated'`, `'request-approved'`) synchronize modal drawers, calendar boards, and navigation badges in real-time without full page reloads.
- **Schema Resiliency:** The FastAPI backend domain layer serializes nullable foreign key associations (`patient_id`, `dentist_id`) via Pydantic pre-validators, maintaining continuous service even under cascade events (`ON DELETE SET NULL`).
