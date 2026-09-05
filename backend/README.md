# DentalFlow Backend API

A high-performance FastAPI layered backend for the **DentalFlow** dental clinic platform, featuring structured 12-sheet Excel pilot storage (`clinic_data.xlsx`), atomic OS file locking, and versioned REST endpoints (`/api/v1` and `/api`).

---

## 📁 Architecture Overview

```text
backend/
├── app/
│   ├── app.py                      # Application factory (CORS, RequestIdMiddleware, error handlers)
│   ├── main.py                     # Entrypoint for Uvicorn
│   ├── api/
│   │   ├── router.py               # Root router mounting /api/v1 and /api
│   │   └── v1/
│   │       ├── router.py           # v1 composite router
│   │       └── routes/             # Primary route layer
│   │           ├── patient_routes.py         # GET/POST/PATCH/PUT patients, duplicate checks
│   │           ├── appointment_routes.py     # Booking, reschedule, cancel, payment, reminders
│   │           ├── availability_routes.py    # Working hours, slot generation
│   │           ├── dentist_routes.py         # Profiles, weekly schedule, leaves
│   │           ├── visit_routes.py           # Structured visit summaries
│   │           ├── treatment_routes.py       # Clinical procedure catalog
│   │           ├── checkup_routes.py         # 4-step checkup & 32-tooth odontogram
│   │           ├── patient_request_routes.py # Simulator intake, approve, reject, cancel
│   │           └── health_routes.py          # Liveness & storage health
│   ├── controllers/                # Thin controllers coordinating domain services
│   ├── services/                   # Domain logic (BookingService, AvailabilityService, PatientService, etc.)
│   ├── repositories/               # 12-sheet Excel storage engine (OpenPyXL)
│   │   ├── base.py                 # Abstract BaseClinicRepository interface
│   │   ├── excel_repository.py     # Thread/process-safe OpenPyXL repository with filelock
│   │   └── excel_schema.py         # Schema definitions for all 12 sheets
│   ├── models/                     # Pure Pydantic models & validation schemas
│   ├── core/                       # App settings, custom exceptions & locking
│   ├── shared/                     # Cross-cutting middleware (RequestIdMiddleware)
│   └── infrastructure/             # Decoupled adapters for future WhatsApp (Phase 9) & Supabase (Phase 8)
├── data/
│   ├── clinic_data.xlsx            # Single authoritative Excel pilot storage workbook
│   └── backups/                    # On-demand snapshots (no automatic per-save file sprawl)
├── scripts/                        # Standalone utilities (seed_demo_data, cleanup_backups, reset_storage)
└── tests/                          # Automated Pytest suite (25 tests, 0 failures)
```

---

## ⚡ Single-Workbook Storage & Invariants

To avoid disk bloat where every request would spawn a new backup file (e.g. 100 entries creating 100 `.xlsx` files):
- **Controlled Backup Model (`AUTO_BACKUP_ON_SAVE = False`):** All records are persisted into a single authoritative `clinic_data.xlsx`.
- **Timestamp Tracking:** Every row explicitly records `created_at`, `updated_at`, and `booking_time`.
- **Atomic Writes:** Saves write to a `.tmp` file and invoke `os.replace()`, eliminating partial corruption risks.
- **OS File Locking:** Non-reentrant lock-once pattern ensures safe serialized writes across concurrent calls.

---

## 🚀 Running the Backend

### Prerequisites
- Python >= 3.11
- `pip` or `uv`

### Install Dependencies
```bash
pip install -r requirements.txt
```

### Start Development Server
```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Interactive API Documentation
- **Swagger UI:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- **Health Check:** [http://127.0.0.1:8000/api/system/health](http://127.0.0.1:8000/api/system/health)

---

## 🧪 Running Tests

Execute the complete automated test suite:
```bash
python -m pytest tests/ -v --tb=short
```

**All 25 tests pass with 0 failures:**
- `tests/test_api_endpoints.py`: Patient registration, PATCH detail updates, appointment booking, rescheduling, and cancellation.
- `tests/test_patient_service.py`: Duplicate phone detection, patient search, and update logic.
- `tests/test_patient_requests_simulator.py`: Simulator intake, staff approval, rejection, and patient cancellation.
- `tests/test_excel_repository.py`: Workbook initialization, single-file invariant, timestamps (`booking_time`), and conflict handling.
- `tests/test_failure_modes.py`: Request-ID tracing, structured 404/409 error responses, and slot conflict codes.
- `tests/test_ui_photo_backend_features.py`: Treatment procedures catalog, 4-step medical checkup with 32-tooth odontogram, and billing reminders.
