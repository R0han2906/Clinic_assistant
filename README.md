# Clinix (Avicena Clinic) / Zendenta — Dental Management Ecosystem

An enterprise-ready dental clinic management ecosystem built for clinic receptionists, practitioners, and patient communication. The repository comprises three integrated applications and comprehensive technical specifications:

1. **`frontend/` — Clinix Receptionist Clinic Dashboard** (Next.js 16 App Router + Tailwind CSS v4 + Zero-CORS Next.js Proxy)
2. **`backend/` — FastAPI Domain API** (Layered MVC: Supabase PostgreSQL 17-table relational database + OpenPyXL Excel pilot fallback)
3. **`simulator/` — Patient WhatsApp Simulator** (React + TypeScript + Vite running on Port 5173)
4. **`future_plans/` — Modular Feature Specifications & Implementation Roadmaps**
5. **`docs/` & `backend/docs/` — Comprehensive System Documentation**

---

## 📁 Repository Structure

- [`frontend/`](frontend/) — **Clinix / Zendenta v3 Receptionist Clinic Dashboard**
  - **Framework:** Next.js 16 (Turbopack) with strict Server vs. Client Component discipline.
  - **Zero-CORS Reverse Proxy:** Built-in `next.config.mjs` server rewrites proxying `/api/:path*` to `http://127.0.0.1:8000/api/:path*`, eliminating browser CORS issues and IPv6 resolution mismatches.
  - **Walk-In Intake Triage (`features/walk-in`):** Live debounced patient search autocomplete (`/api/v1/patients/lookup`) and on-duty dentist availability grid (`DentistAvailabilityGrid.tsx`) with real-time wait estimation and shortest-wait badges. Appointments tagged with `source: 'WALK_IN'`.
  - **WhatsApp Inbound Review Drawer (`features/whatsapp-agent`):** Unread counter badge (`BookingRequestBadge.tsx`) with live pulse animation, and review drawer (`BookingRequestPanel.tsx`) with 1-click approvals converting simulator intake requests into confirmed calendar appointments (`source: 'WHATSAPP'`).
  - **Strict 24-Hour Time Standard (`HH:mm`):** Calendar left axis `09:00` to `00:00`, appointment cards (`09:00 › 10:00`), clinic header operating timings (`09:00 - 00:00`), and visit summaries strictly enforce 24-hour military time (`hour12: false`).
  - **Modules:** Multi-dentist daily calendar (`/reservations`), Lobby Waiting Room with color-coded timers (`/dashboard`), Walk-In intake drawer, Patients directory (`/patients`), Treatments catalog (`/treatments`), Staff list, and Role-partitioned reports (`/reports`).
  - **Lifecycle Engine:** 7-state appointment machine (`scheduled`, `checked-in`, `in-progress`, `completed`, `paid`, `cancelled`, `no-show`).
  - See [`frontend/README.md`](frontend/README.md) and [`frontend/FRONTEND.md`](frontend/FRONTEND.md).

- [`backend/`](backend/) — **FastAPI Core Backend**
  - **Layered Architecture:** Dedicated Routes (`/api/v1` & `/api`), Domain Services, Controllers, and Pydantic validation schemas.
  - **Dual Storage Engine:** Seamlessly toggle between Supabase PostgreSQL (17 relational tables with connection pooling) and OpenPyXL Excel pilot workbook (`clinic_data.xlsx`) with OS-level `lock-once-delegate` file locking and atomic writes.
  - **Filtering & Digit-Matching:** `GET /api/v1/patient-requests` supports `patient_phone` filtering with trailing 10-digit matching, seamlessly pairing `+91` international numbers with local inputs.
  - **Autocomplete & Rescheduling:** `GET /api/v1/patients/lookup?q=...` and `POST /api/v1/appointments/{id}/reschedule`.
  - **Dedicated Documentation:** See [`backend/docs/README.md`](backend/docs/README.md), [`backend/docs/ARCHITECTURE.md`](backend/docs/ARCHITECTURE.md), [`backend/docs/API_DOCUMENTATION.md`](backend/docs/API_DOCUMENTATION.md), and [`backend/docs/PATIENT_REQUESTS_WORKFLOW.md`](backend/docs/PATIENT_REQUESTS_WORKFLOW.md).

- [`simulator/`](simulator/) — **Patient WhatsApp Simulator**
  - **Framework:** React + TypeScript + Vite + Tailwind CSS.
  - **Intake Flow:** Mobile messaging UI generating persistent `REQ-XXXXXX` requests.
  - **Direct Cancellation:** 1-click cancellation action directly from the Confirmation Card calling `PATCH /api/v1/patient-requests/{id}`.
  - **Multi-Booking Rescheduling:** Displays all upcoming appointments for the verified phone number and allows the patient to select which booking to reschedule.
  - **24-Hour Time Notation:** All available slot chips render in 24-hour military time (`HH:mm`).

- [`future_plans/`](future_plans/) — **Architectural Feature Roadmaps & Modular Markdown Plans**
  - Modular roadmap documents covering branding, navbar simplification, calendar overlapping, financials, inventory, and master schedules.

- [`docs/`](docs/) — **Complete System Specifications & References**
  - [`README.md`](docs/README.md) — Documentation index and master reference.
  - [`API Reference.md`](docs/API%20Reference.md) — Comprehensive REST API endpoints, schemas, and proxy rewrites.
  - [`System Architecture.md`](docs/System%20Architecture.md) — Technical architecture, proxy model, concurrency, and repository model.
  - [`Product Requirements Document.md`](docs/Product%20Requirements%20Document.md) — Product requirements, walk-in intake, and MVP scope.
  - [`Product Design Specification.md`](docs/Product%20Design%20Specification.md) — Receptionist UX, Walk-In drawer, WhatsApp review, & simulator design.
  - [`Implementation Phases.md`](docs/Implementation%20Phases.md) — 9-phase roadmap and verification gates.
  - [`Project Rules.md`](docs/Project%20Rules.md) — 24-hour standard, zero-CORS proxying, phone digit matching, and concurrency rules.
  - [`Project Memory.md`](docs/Project%20Memory.md) — Durable decisions, 20-revision history log, and system context.
  - [`Agent.md`](docs/Agent.md) — Agent operating manual and definition of done.

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
cd simulator
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
