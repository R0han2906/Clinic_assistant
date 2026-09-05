# DentalFlow (Clinic Assistant)

**DentalFlow** is an administrative clinic assistant and appointment management platform designed for dental practices. It combines a robust **FastAPI backend** with a structured **12-sheet Excel pilot storage engine** (`clinic_data.xlsx`) and an interactive **React + TypeScript Patient WhatsApp Simulator** to validate patient-to-clinic workflows before production WhatsApp business deployment.

---

## 📁 Repository Structure

- [`docs/`](docs/) — Core specifications, architectural design, and operating rules.
  - [`API Reference.md`](docs/API%20Reference.md) — Complete REST API reference for frontend developers.
  - [`System Architecture.md`](docs/System%20Architecture.md) — Technical architecture & 12-sheet Excel pilot storage model.
  - [`Product Requirements Document.md`](docs/Product%20Requirements%20Document.md) — Product baseline and MVP scope.
  - [`Product Design Specification.md`](docs/Product%20Design%20Specification.md) — Receptionist UX & simulator interaction design.
  - [`Implementation Phases.md`](docs/Implementation%20Phases.md) — Strict 9-phase roadmap and exit gates.
  - [`Project Rules.md`](docs/Project%20Rules.md) — Non-negotiable engineering, concurrency, and safety rules.
  - [`Project Memory.md`](docs/Project%20Memory.md) — Durable context, decisions & current stage.
  - [`Agent.md`](docs/Agent.md) — Agent operating manual & principles.

- [`backend/`](../backend/) — FastAPI layered backend.
  - `app/api/v1/routes/` — Primary route handlers (patients, appointments, availability, treatments, checkups, patient requests).
  - `app/services/` — Core domain logic (booking, availability engine, patient duplicate detection).
  - `app/repositories/` — 12-sheet Excel workbook repository (atomic writes, locking, single-workbook invariants).
  - `app/models/` — Pydantic schemas and validation models.
  - `data/` — Live authoritative workbook (`clinic_data.xlsx`) and on-demand `backups/`.
  - `tests/` — Automated test suite (25 tests passing).

- [`patient-whatsapp-simulator/`](../patient-whatsapp-simulator/) — React + TypeScript + Vite frontend.
  - Imitates WhatsApp conversational flow for new and existing patients.
  - Interactive profile editing card (`UpdatePatientCard`).
  - Interactive appointment cancellation card (`CancelAppointmentCard`).

---

## 🚀 Quick Start

### Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
python -m pytest tests/ -v --tb=short
uvicorn app.main:app --reload --port 8000
```
- **Interactive API Docs (Swagger UI):** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Health Check:** [http://127.0.0.1:8000/api/system/health](http://127.0.0.1:8000/api/system/health)

### Simulator (React + Vite)
```bash
cd patient-whatsapp-simulator
npm install
npm run dev
```
- **Simulator UI:** [http://localhost:5173/](http://localhost:5173/)

---

## 🧪 Run Tests

```bash
cd backend
python -m pytest tests/ -v --tb=short
```

**All 25 tests pass with 0 failures.** The test suite covers:
1. Patient registration, duplicate detection, search, and PATCH profile updates.
2. Slot availability calculation considering working hours, breaks, and leaves.
3. Appointment booking, rescheduling, and cancellation under atomic file lock.
4. Patient Request Simulator intake, staff approval, rejection, and cancellation.
5. 12-sheet Excel repository integrity, timestamps (`booking_time`), and single-workbook invariants.
6. 4-step medical checkups with 32-tooth odontogram findings.
7. System health, Request-ID tracing middleware, and structured error responses.

---

## 📡 API Summary

| Resource | Endpoints |
|---|---|
| **Patients** | `GET/POST /api/patients`, `PATCH/PUT /api/patients/{id}`, `GET /api/patients/{id}`, `GET /api/patients/check-duplicate` |
| **Visits** | `GET/POST /api/patients/{id}/visits` |
| **Dentists** | `GET/POST /api/dentists`, `GET /api/dentists/{id}`, schedule & leave sub-resources |
| **Availability** | `GET /api/availability/slots` |
| **Appointments** | `GET/POST /api/appointments`, `POST /api/appointments/{id}/reschedule`, `POST /api/appointments/{id}/cancel`, `POST /api/appointments/{id}/complete`, `PATCH /api/appointments/{id}/payment`, `POST /api/appointments/{id}/remind-payment` |
| **Patient Requests** | `POST/GET /api/v1/patient-requests`, `POST /api/v1/patient-requests/{id}/approve`, `POST /api/v1/patient-requests/{id}/reject`, `POST /api/v1/patient-requests/{id}/cancel` |
| **Treatments** | `GET /api/treatments` |
| **Medical Checkups** | `POST /api/checkups`, `GET /api/checkups/appointment/{id}`, `GET /api/checkups/patient/{id}` |
| **System** | `GET /health`, `GET /api/system/health`, `GET /api/system/export-workbook` |

For complete schemas and examples, see [`docs/API Reference.md`](API%20Reference.md).
