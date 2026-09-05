# DentalFlow (Clinic Assistant)

**DentalFlow** is an administrative clinic assistant and patient appointment management platform built for dental practices. It features a high-performance **FastAPI backend** with a structured **12-sheet Excel pilot storage engine**, alongside a modern **React + TypeScript Patient WhatsApp Simulator** to emulate patient conversations, booking, profile editing, and cancellation flows before physical WhatsApp business deployment.

---

## 📁 Repository Structure

- [`backend/`](backend/) — FastAPI layered backend with OpenPyXL pilot storage, OS file locking, domain services, versioned routes (`/api/v1` and `/api`), and comprehensive automated tests.
  - `app/api/v1/routes/` — Primary API routing layer (patients, appointments, availability, treatments, checkups, patient requests).
  - `app/services/` — Core business rules (availability engine, booking under atomic file lock, patient duplicate detection).
  - `app/repositories/` — 12-sheet Excel workbook repository (`clinic_data.xlsx`) with atomic writes, OS file locking, and single-file storage invariants (no backup file sprawl).
  - `app/models/` — Pydantic schemas (Patient, PatientUpdate, Appointment, Visit, Dentist, Treatment, MedicalCheckup, PatientRequest).
  - `tests/` — Full automated test suite (25 tests covering all API endpoints, repositories, and error modes).
- [`patient-whatsapp-simulator/`](patient-whatsapp-simulator/) — React + TypeScript + Vite frontend imitating the patient WhatsApp interaction:
  - Phone verification (returning patient detection vs new patient registration).
  - Live slot picker with dentist and treatment selection.
  - Interactive Patient Profile Update card (`PATCH /api/patients/{id}`).
  - Interactive Cancellation card with reason capture (`POST /api/appointments/{id}/cancel` and `POST /api/v1/patient-requests/{id}/cancel`).
- [`docs/`](docs/) — Complete project specifications, design specifications, and operating manuals.
  - [`API Reference.md`](docs/API%20Reference.md) — Complete REST API reference for all backend endpoints.
  - [`System Architecture.md`](docs/System%20Architecture.md) — Technical architecture & 12-sheet Excel pilot storage model.
  - [`Product Requirements Document.md`](docs/Product%20Requirements%20Document.md) — Product baseline and MVP scope.
  - [`Product Design Specification.md`](docs/Product%20Design%20Specification.md) — Receptionist UX & simulator interaction design.
  - [`Implementation Phases.md`](docs/Implementation%20Phases.md) — Strict 9-phase roadmap and exit gates.
  - [`Project Rules.md`](docs/Project%20Rules.md) — Non-negotiable engineering, concurrency, and safety rules.
  - [`Project Memory.md`](docs/Project%20Memory.md) — Durable context, decisions & change history.
  - [`Agent.md`](docs/Agent.md) — Agent operating manual & principles.

---

## 🚀 Quick Start

### 1. Run Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
python -m pytest tests/ -v --tb=short
uvicorn app.main:app --reload --port 8000
```

- **Interactive API Documentation (Swagger UI):** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Alternative API Docs (ReDoc):** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- **Health Check Endpoint:** [http://127.0.0.1:8000/api/system/health](http://127.0.0.1:8000/api/system/health)

### 2. Run Patient WhatsApp Simulator (React + Vite)

```bash
cd patient-whatsapp-simulator
npm install
npm run dev
```

- **Web Simulator UI:** [http://localhost:5173/](http://localhost:5173/)

---

## 🧪 Automated Testing

All 25 automated tests pass with 0 failures:
```bash
cd backend
python -m pytest tests/ -v --tb=short
```

Modules tested:
- `tests/test_api_endpoints.py`: Patient lifecycle, updates via PATCH, appointment booking/rescheduling/cancellation, and simulator request cancellation.
- `tests/test_patient_service.py`: Phone duplicate detection, fuzzy search, and service-level profile updates.
- `tests/test_patient_requests_simulator.py`: Simulator request lifecycle (intake, staff approval, slot blocking, rejection, cancellation).
- `tests/test_excel_repository.py`: 12-sheet initialization, single-file storage invariant (no redundant `.xlsx` backups), timestamps (`booking_time` and `created_at`), and atomic write verification.
- `tests/test_failure_modes.py`: Request-ID tracing middleware, structured 404/409 error responses, and slot conflict handling.
- `tests/test_ui_photo_backend_features.py`: Treatment procedures catalog, 4-step medical checkup with 32-tooth odontogram, and billing reminders.
