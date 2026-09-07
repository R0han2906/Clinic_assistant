# Clinix (Avicena Clinic) / Zendenta — Dental Management Ecosystem

An enterprise-ready dental clinic management ecosystem built for clinic receptionists, practitioners, and patient communication. The repository comprises three integrated applications and comprehensive technical specifications:

1. **`frontend/` — Clinix Receptionist Clinic Dashboard** (Next.js 16 App Router + Tailwind CSS v4)
2. **`backend/` — FastAPI Domain API** (Dual repository: Supabase PostgreSQL 17-table relational database + OpenPyXL Excel pilot storage)
3. **`patient-whatsapp-simulator/` — Patient WhatsApp Simulator** (React + TypeScript + Vite)
4. **`future_plans/` — Modular Feature Specifications & Implementation Roadmaps**

---

## 📁 Repository Structure

- [`frontend/`](frontend/) — **Clinix / Zendenta v3 Receptionist Clinic Dashboard**
  - **Framework:** Next.js 16 (Turbopack) with strict Server vs. Client Component discipline.
  - **Modules:** Multi-dentist daily calendar (`/reservations`), Lobby Waiting Room with color-coded timers (`/dashboard`), 4-step Walk-In intake drawer, Patients directory (`/patients`), Treatments catalog (`/treatments`), Staff list, and Role-partitioned reports (`/reports`).
  - **Direct-Access Mode:** Streamlined for clinic front-desk operations without login friction; direct access to patient intake, scheduling, and billing workflows.
  - **Synchronization & Collision Engine:** Timezone-safe local calendar coordinates, multi-identifier doctor mapping (`DEN-000001` Dr. Sarah Wilson, `DEN-000002` Dr. Michael Chen, `DEN-000003` ROHAN), and live event listeners (`appointment-created`, `appointment-updated`).
  - **Lifecycle Engine:** 7-state appointment machine (`scheduled`, `checked-in`, `in-progress`, `completed`, `paid`, `cancelled`, `no-show`).
  - **Interactive Modals:** Take Payment (480px), Read-only Visit Summary, Reschedule, Cancel, and Walk-in intake.
  - See [`frontend/README.md`](frontend/README.md) and [`frontend/FRONTEND.md`](frontend/FRONTEND.md).

- [`backend/`](backend/) — **FastAPI Core Backend**
  - **Layered Architecture:** Dedicated Routes (`/api/v1` & `/api`), Domain Services, Controllers, and Pydantic validation schemas.
  - **Dual Storage Engine:** Seamlessly toggle between Supabase PostgreSQL (17 relational tables with connection pooling) and OpenPyXL Excel pilot workbook (`clinic_data.xlsx`) with OS-level file locking and atomic writes.
  - **Hardened Serialization:** Nullable foreign keys (`patient_id`, `dentist_id`) and ISO timestamp conversion preventing serialization crashes.
  - **API Surface:** Patients, Appointments, Provider Availability, Treatments, Odontogram Checkups, Billing/Sales, Inventory, Purchases, Staff, and On-Demand CSV exports.
  - See [`backend/README.md`](backend/README.md).

- [`patient-whatsapp-simulator/`](patient-whatsapp-simulator/) — **Patient WhatsApp Simulator**
  - **Framework:** React + TypeScript + Vite + Tailwind CSS.
  - **Purpose:** Emulates WhatsApp conversational intake, phone verification, slot selection, profile editing, and cancellation flows before physical WhatsApp business deployment.

- [`future_plans/`](future_plans/) — **Architectural Feature Roadmaps & Modular Markdown Plans**
  - `01_clinic_branding_logo_address.md` — Clinix branding & address customization.
  - `02_navbar_and_header_simplification.md` — Header and navigation streamlining.
  - `03_reservations_calendar_overlap_and_stacking.md` — Enhanced multi-slot collision handling.
  - `04_reservations_timeline_9am_to_12am.md` — Extended timeline operational hours.
  - `05_merged_financials_and_accounts_hub.md` — Unified financial & billing dashboard.
  - `06_payment_methods_streamlining.md` — Payment gateway & method optimization.
  - `07_unified_inventory_and_equipment_hub.md` — Stock and peripheral asset hub.
  - `08_master_implementation_schedule.md` — Master implementation timeline.

- [`docs/`](docs/) — **Complete System Specifications & References**
  - [`API Reference.md`](docs/API%20Reference.md) — Comprehensive REST API endpoints and payload schemas.
  - [`System Architecture.md`](docs/System%20Architecture.md) — Technical architecture, concurrency, and repository model.
  - [`Product Requirements Document.md`](docs/Product%20Requirements%20Document.md) — Product requirements and MVP scope.
  - [`Product Design Specification.md`](docs/Product%20Design%20Specification.md) — Receptionist UX & simulator interaction design.
  - [`Implementation Phases.md`](docs/Implementation%20Phases.md) — Roadmap and verification gates.
  - [`Project Rules.md`](docs/Project%20Rules.md) — Non-negotiable safety, validation, and concurrency rules.
  - [`Project Memory.md`](docs/Project%20Memory.md) — Decision log and system context.

---

## 🚀 Quick Start Guide

### 1. Run the Backend (FastAPI)

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

- **Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc:** [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check:** [http://localhost:8000/api/v1/system/health](http://localhost:8000/api/v1/system/health)

### 2. Run the Receptionist Dashboard (Next.js 16)

```powershell
cd frontend
pnpm install
pnpm dev
```

- **Dashboard UI:** [http://localhost:3000](http://localhost:3000)
- **Calendar Reservations:** [http://localhost:3000/reservations](http://localhost:3000/reservations)
- **Patients Directory:** [http://localhost:3000/patients](http://localhost:3000/patients)

### 3. Run the Patient WhatsApp Simulator (React + Vite)

```powershell
cd patient-whatsapp-simulator
npm install
npm run dev
```

- **Simulator UI:** [http://localhost:5173/](http://localhost:5173/)

---

## 🧪 Automated Testing

To run the backend test suite:

```powershell
cd backend
pytest tests/ -v --tb=short
```
