# Clinix / DentalFlow — Documentation & System Blueprint

**Clinix (Avicena Clinic)** is an enterprise dental clinic administrative platform and appointment management system. It combines a **Next.js 16 App Router receptionist dashboard**, a **FastAPI layered backend** powered by a dual-repository boundary (**Supabase PostgreSQL 17 tables** + OpenPyXL Excel fallback engine), an interactive **React + TypeScript Patient WhatsApp Simulator**, and modular **Future Implementation Plans**.

---

## 📁 Repository Ecosystem

- [`docs/`](./) — Core specifications, architectural design, and operating rules:
  - [`API Reference.md`](./API%20Reference.md) — Complete REST API reference for frontend and simulator clients.
  - [`System Architecture.md`](./System%20Architecture.md) — Technical architecture, dual-repository model, and concurrency.
  - [`Product Requirements Document.md`](./Product%20Requirements%20Document.md) — Product requirements and MVP scope.
  - [`Product Design Specification.md`](./Product%20Design%20Specification.md) — Receptionist UX & simulator interaction design.
  - [`Implementation Phases.md`](./Implementation%20Phases.md) — 9-phase roadmap, milestones, and verification gates.
  - [`Project Rules.md`](./Project%20Rules.md) — Non-negotiable engineering, concurrency, and safety rules.
  - [`Project Memory.md`](./Project%20Memory.md) — Durable context, decision log, and change history.
  - [`Agent.md`](./Agent.md) — Agent operating manual & principles.

- [`frontend/`](../frontend/) — Clinix / Zendenta v3 Receptionist Clinic Dashboard:
  - Multi-dentist daily calendar (`/reservations`) with timezone-safe rendering and live event refreshes.
  - 4-step Walk-In intake drawer (`WalkInSheet.tsx`) and waiting lobby queue with color-coded wait timer badges.
  - 7-state appointment lifecycle engine (`scheduled`, `checked-in`, `in-progress`, `completed`, `paid`, `cancelled`, `no-show`).
  - Read-only Visit Summary panel (`VisitSummaryPanel.tsx`) and Take Payment modal (`TakePaymentDialog.tsx`).
  - Direct-access operational mode (receptionist authentication deferred for zero-friction front-desk throughput).

- [`backend/`](../backend/) — FastAPI Layered Domain Backend:
  - `app/api/v1/routes/` — Versioned route handlers (patients, appointments, availability, treatments, sales, inventory, etc.).
  - `app/controllers/` — Request orchestration and response formatting.
  - `app/services/` — Core business rules (BookingService, AvailabilityService, PatientService, BillingService).
  - `app/repositories/` — Abstract BaseClinicRepository with Supabase PostgreSQL (17 normalized tables) and OpenPyXL Excel engines.
  - `app/models/` — Pydantic v2 domain schemas with hardened nullable foreign keys (`patient_id`, `dentist_id`).

- [`patient-whatsapp-simulator/`](../patient-whatsapp-simulator/) — React + TypeScript + Vite Patient Bot Simulator:
  - Conversational WhatsApp simulation for new/returning patient booking.
  - Interactive profile editing and appointment cancellation cards.

- [`future_plans/`](../future_plans/) — Modular Feature Roadmaps & Architectural RFCs:
  - `01_clinic_branding_logo_address.md` through `08_master_implementation_schedule.md`.

---

## 🚀 Quick Start

### 1. Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```
- **Interactive Swagger Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Health Check:** [http://127.0.0.1:8000/api/v1/system/health](http://127.0.0.1:8000/api/v1/system/health)

### 2. Frontend Receptionist Dashboard (Next.js 16)
```bash
cd frontend
pnpm install
pnpm dev
```
- **Dashboard UI:** [http://localhost:3000](http://localhost:3000)
- **Reservations Calendar:** [http://localhost:3000/reservations](http://localhost:3000/reservations)

### 3. Simulator (React + Vite)
```bash
cd patient-whatsapp-simulator
npm install
npm run dev
```
- **Simulator UI:** [http://localhost:5173/](http://localhost:5173/)

---

## 📡 Core API Summary (`/api/v1`)

| Resource | Primary Endpoints | Description |
|---|---|---|
| **Patients** | `GET/POST /api/v1/patients`, `GET/PATCH/DELETE /api/v1/patients/{id}` | Patient registration, duplicate check, demographics |
| **Dentists** | `GET /api/v1/dentists`, `GET /api/v1/dentists/{id}` | Doctor directory, working shifts, and time-off leaves |
| **Availability** | `GET /api/v1/availability/slots?dentist_id=...&date=...` | Dynamic free slot calculation engine |
| **Appointments** | `GET/POST /api/v1/appointments`, `PATCH .../status`, `POST .../reschedule`, `POST .../cancel` | 7-state booking and calendar scheduling |
| **Visit Summary** | `GET/POST /api/v1/appointments/{id}/visit-summary` | Clinical findings, prescriptions, and diagnosis |
| **Sales & Billing** | `GET/POST /api/v1/sales`, `PATCH /api/v1/appointments/{id}/payment` | Invoicing, payment settlement, and revenue KPIs |
| **Inventory** | `GET/POST /api/v1/inventory`, `PATCH /api/v1/inventory/{id}/adjust` | Clinical supplies and low-stock threshold alerts |
| **Purchases** | `GET/POST /api/v1/purchases`, `POST /api/v1/purchases/{id}/receive` | Vendor purchase orders and supply receiving |
| **Export** | `GET /api/v1/export/{entity}.csv` | On-demand downloadable CSV reports |
| **Patient Requests**| `POST/GET /api/v1/patient-requests`, `POST .../approve`, `POST .../reject` | WhatsApp simulator queue review |

For complete payload schemas and code examples, refer to [`API Reference.md`](./API%20Reference.md).
