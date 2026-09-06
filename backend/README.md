# Zendenta Clinic Backend API

A robust, high-performance **FastAPI** backend powering the **Zendenta Dental Clinic** administrative platform and Patient WhatsApp Simulator. Built with clean architecture, domain-driven services, dual-storage repository boundaries (**Supabase PostgreSQL** & **OpenPyXL Excel Engine**), connection pooling, atomic file locking, and versioned REST endpoints (`/api/v1` and `/api`).

---

## 📁 Architecture Overview

```text
backend/
├── app/
│   ├── app.py                      # Application factory (CORS, RequestIdMiddleware, global error handlers)
│   ├── main.py                     # ASGI entrypoint for Uvicorn
│   ├── api/
│   │   ├── router.py               # Top-level API router mounting /api/v1 and /api
│   │   └── v1/
│   │       ├── router.py           # Composite router with all 13 module route collections
│   │       └── routes/
│   │           ├── patient_routes.py         # Registration, duplicate check, profile update, deletion
│   │           ├── appointment_routes.py     # Booking, 7-state transitions, reschedule, cancel, payment
│   │           ├── availability_routes.py    # Provider schedules, working hours, free slot calculation
│   │           ├── dentist_routes.py         # Dentist roster, specialties, weekly availability, leaves
│   │           ├── visit_routes.py           # Structured post-appointment clinical visit records
│   │           ├── treatment_routes.py       # Dental procedure catalog, duration, and fee schedules
│   │           ├── checkup_routes.py         # 4-step checkup & 32-tooth odontogram examination
│   │           ├── sales_routes.py           # Invoices, payment records, revenue analytics, methods
│   │           ├── inventory_routes.py       # Stock levels, low-stock threshold alerts, adjustments
│   │           ├── purchase_routes.py        # Supply purchase orders, vendor directory, receiving flow
│   │           ├── staff_routes.py           # Clinic staff directory, roles, and status management
│   │           ├── export_routes.py          # On-demand CSV report exports (patients, sales, inventory)
│   │           ├── patient_request_routes.py # Patient WhatsApp Simulator intake (approve, reject, cancel)
│   │           └── health_routes.py          # Liveness, readiness & database connectivity health checks
│   ├── controllers/                # Thin controllers handling HTTP requests and response serialization
│   ├── services/                   # Domain business logic (Booking rules, Availability, Billing, Stock)
│   ├── repositories/               # Repository Boundary Pattern (Database Agnostic)
│   │   ├── base.py                 # Abstract BaseClinicRepository interface
│   │   ├── supabase_repository.py  # Supabase PostgreSQL repository (psycopg2 connection pool)
│   │   └── excel_repository.py     # OpenPyXL 12-sheet workbook repository with OS file locks
│   ├── models/                     # Pure Pydantic v2 schemas and validation models
│   └── core/                       # App settings, environment configs, and domain error hierarchies
├── data/
│   ├── clinic_data.xlsx            # Authoritative Excel pilot workbook (used when STORAGE_BACKEND=excel)
│   └── backups/                    # Automatic timestamped backups prior to write operations
├── supabase/
│   ├── schema.sql                  # Complete DDL for all 17 relational tables & indexes
│   └── seed.sql                    # Initial seed data (dentists, treatments, payment methods, etc.)
├── scripts/
│   ├── init_supabase.py            # Database schema & seed initialization script
│   ├── reset_demo_data.py          # Resets Excel clinic_data.xlsx to pristine initial state
│   └── add_test_data_naman.py      # Seed script to inject test patient and appointments
└── tests/                          # Automated Pytest suite covering all API endpoints and repositories
```

---

## 🗄️ Storage Backends: Dual-Repository Boundary

The backend implements the **Repository Pattern** (`BaseClinicRepository`), allowing seamless toggling between storage engines via the `STORAGE_BACKEND` environment variable:

### 1. Supabase PostgreSQL (Production Storage, `STORAGE_BACKEND=supabase`)
- Relational schema with 17 normalized tables:
  1. `patients` — Demographics, contact information, emergency contacts, medical alerts
  2. `dentists` — Practitioners, specialties, color codes, active status
  3. `availability` — Weekly provider shift rules (start, end, break times)
  4. `leaves` — Practitioner time-off dates
  5. `appointments` — 7-state appointment records (`scheduled`, `checked-in`, `in-progress`, `completed`, `paid`, `cancelled`, `no-show`)
  6. `visits` — Post-treatment clinical summaries, chief complaints, diagnoses
  7. `treatments` — Dental procedure catalog with standard duration and pricing
  8. `medical_checkups` — 4-step checkup records, odontogram tooth mapping, observations
  9. `patient_requests` — Incoming requests from the Patient WhatsApp Simulator
  10. `staff` — Administrative staff and dental assistant profiles
  11. `audit_log` — Immutable audit log of all clinical and billing actions
  12. `metadata` — Clinic configuration, business hours, and schema version
  13. `sales` — Itemized billing and payment receipts
  14. `vendors` — Dental equipment and consumable suppliers
  15. `purchases` — Supply purchase orders with receiving workflows
  16. `inventory` — Clinical inventory with threshold alerts
  17. `payment_methods` — Enabled payment channels (Cash, Card, Insurance, QRIS, Transfer)
- High-throughput connection pooling via `psycopg2.pool.ThreadedConnectionPool`.

### 2. Structured Excel Engine (Pilot Storage, `STORAGE_BACKEND=excel`)
- Structured 12-sheet OpenPyXL workbook (`clinic_data.xlsx`).
- Cross-platform OS file locking (`fcntl` on Linux/macOS, `msvcrt` on Windows) to prevent concurrent write collisions.
- Atomic writes via temporary files to eliminate corruption during unexpected server interruptions.

---

## 🔄 7-State Appointment Lifecycle Support

The backend supports the Zendenta v3 canonical 7-state machine:

| Status | Description | Allowed Next Transitions |
|---|---|---|
| `scheduled` | Confirmed booking | `checked-in`, `cancelled`, `no-show` |
| `checked-in` | Patient arrived in clinic lobby | `in-progress`, `cancelled`, `no-show` |
| `in-progress` | Patient in operatory with dentist | `completed`, `cancelled` |
| `completed` | Procedure finished, summary recorded | `paid` |
| `paid` | Bill settled in full | Terminal state |
| `cancelled` | Cancelled prior to visit | `scheduled` (via rebook) |
| `no-show` | Patient missed scheduled slot | `scheduled` (via rebook) |

Relevant Endpoints:
- `POST /api/v1/appointments` — Create booking
- `PATCH /api/v1/appointments/{id}/status` — Transition status
- `POST /api/v1/appointments/{id}/reschedule` — Slot rebooking
- `POST /api/v1/appointments/{id}/cancel` — Cancel appointment with reason
- `PATCH /api/v1/appointments/{id}/payment` — Settle billing (`paid`)

---

## 🚀 Running the Backend Locally

### 1. Prerequisites
- Python 3.10+
- Virtual environment (`venv`)

### 2. Environment Configuration
Create `backend/.env`:

```env
# Storage Engine: "supabase" or "excel"
STORAGE_BACKEND=supabase

# Supabase Credentials (if using Supabase)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.puhbtqisawianlqyivyj.supabase.co:5432/postgres
SUPABASE_URL=https://puhbtqisawianlqyivyj.supabase.co

# API Configuration
PORT=8000
FRONTEND_URL=http://localhost:3000
SIMULATOR_URL=http://localhost:5173
```

### 3. Install Dependencies
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 4. Database Setup & Seed
If using Supabase:
```powershell
python scripts/init_supabase.py
```
If using Excel pilot mode:
```powershell
python scripts/reset_demo_data.py
```

### 5. Start Development Server
```powershell
python -m uvicorn app.main:app --reload --port 8000
```

- **Interactive Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Alternative ReDoc:** [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check Endpoint:** [http://localhost:8000/api/v1/system/health](http://localhost:8000/api/v1/system/health)

---

## 🧪 Automated Testing

Run the complete Pytest suite (tests run against in-memory mock repositories and isolated environments):

```powershell
pytest tests/ -v --tb=short
```

---

## 📊 On-Demand CSV Export Endpoints

The backend generates downloadable CSV reports on demand:
- `GET /api/v1/export/patients.csv` — Full patient directory
- `GET /api/v1/export/appointments.csv?date=YYYY-MM-DD` — Filtered provider schedules
- `GET /api/v1/export/sales.csv` — Financial transactions and payment methods
- `GET /api/v1/export/inventory.csv` — Current inventory stock levels
- `GET /api/v1/export/purchases.csv` — Supply purchase order logs
