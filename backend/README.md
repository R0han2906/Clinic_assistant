# DentalFlow Backend API

FastAPI MVC backend for the DentalFlow dental clinic staff assistant with structured Excel pilot storage.

## Architecture Overview

```text
backend/
├── app/
│   ├── main.py                     # FastAPI application entrypoint & middleware
│   ├── core/                       # App settings, exceptions & locking
│   ├── models/                     # Pydantic schemas (Patient, Visit, Dentist, Appointment, Audit)
│   ├── repositories/               # Excel pilot storage (openpyxl, atomic replacement & backups)
│   ├── services/                   # Business domain services (Availability, Booking, Patient, Visit)
│   └── controllers/                # API Routers (/api/patients, /api/dentists, /api/appointments, /api/system)
├── data/
│   ├── clinic_data.xlsx            # Clinic workbook pilot storage
│   └── backups/                    # Auto-generated pre-write snapshots
└── tests/                          # Pytest automated test suite
```

## Running the Backend

### Prerequisites
- Python >= 3.11
- `uv` (recommended) or `pip`

### Install Dependencies
```bash
uv pip install -r requirements.txt
```
*(or `pip install -r requirements.txt`)*

### Start Dev Server
```bash
uvicorn app.main:app --reload --port 8000
```

### Interactive API Docs
- Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- ReDoc: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

## Running Tests
```bash
pytest
```
