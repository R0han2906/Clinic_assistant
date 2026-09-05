# DentalFlow (Clinic Assistant)

**DentalFlow** is an administrative product for dental clinic front-desk staff to register patients, log structured previous visit summaries, manage dentist availability, and book appointment ranges.

---

## 📁 Repository Structure

- [`docs/`](docs/) — Core specifications, design guidelines, and operating rules.
  - [`Agent.md`](docs/Agent.md) — Agent operating manual & principles.
  - [`Project Rules.md`](docs/Project%20Rules.md) — Non-negotiable engineering & safety rules.
  - [`Product Requirements Document.md`](docs/Product%20Requirements%20Document.md) — Product baseline and MVP scope.
  - [`System Architecture.md`](docs/System%20Architecture.md) — Technical architecture & Excel pilot storage model.
  - [`Product Design Specification.md`](docs/Product%20Design%20Specification.md) — Receptionist UX & screen workflows.
  - [`Implementation Phases.md`](docs/Implementation%20Phases.md) — Strict delivery phases and exit gates.
  - [`Project Memory.md`](docs/Project%20Memory.md) — Durable context, decisions & current stage.
  - [`API Reference.md`](docs/API%20Reference.md) — Complete frontend API reference for all backend routes.

- [`backend/`](backend/) — FastAPI MVC backend.
  - `app/controllers/` — Route handlers (patients, dentists, appointments, system).
  - `app/services/` — Domain logic (booking, availability, patient duplicate detection).
  - `app/repositories/` — Excel workbook repository (atomic writes, locking, backups).
  - `app/models/` — Pydantic request/response schemas.
  - `app/core/` — Config, exceptions, file locking.
  - `data/` — Live workbook (`clinic_data.xlsx`) and `backups/`.
  - `tests/` — Automated test suite.

---

## 🚀 Quick Start (Backend)

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

- **Interactive API Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Health Check:** [http://127.0.0.1:8000/api/system/health](http://127.0.0.1:8000/api/system/health)

---

## 🧪 Run Tests

```bash
cd backend
python -m pytest tests/ -v
```

All 10 tests should pass. The test suite covers patient creation, duplicate detection, appointment booking, conflict prevention, rescheduling, and API endpoints.

---

## 📡 API Summary

| Resource | Routes |
|---|---|
| Patients | `GET/POST /api/patients`, `GET /api/patients/{id}`, visits sub-resource |
| Dentists | `GET/POST /api/dentists`, schedule & leave sub-resources |
| Availability | `GET /api/availability/slots` |
| Appointments | `GET/POST /api/appointments`, reschedule / cancel / complete actions |
| System | `GET /api/system/health`, `GET /api/system/export-workbook` |

See [`docs/API Reference.md`](docs/API%20Reference.md) for the complete request/response reference for frontend developers.
