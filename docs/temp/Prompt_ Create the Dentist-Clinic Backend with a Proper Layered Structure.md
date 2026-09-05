# Prompt: Create the Dentist-Clinic Backend with a Proper Layered Structure

## Role

You are a senior Python backend architect and FastAPI engineer. Build the backend foundation for a dentist-clinic appointment system using a clean, modular, feature-oriented architecture.

Think carefully before creating files. First inspect the existing repository, project instructions, current frontend, package configuration, and the project Markdown documents. Do not blindly copy the reference structure. The attached structure is only an architectural reference for separation of concerns.

**The existing repository may not contain the files, directories, names, or framework assumed by this prompt. Some files may be missing, differently named, combined into one file, placed in another directory, or already implemented using a different but valid pattern. Do not assume that a file such as `app.py`, `main.py`, `config.py`, `routes.py`, `controllers.py`, `services.py`, `repositories.py`, `models.py`, or any listed module already exists.**

Adapt the architecture to the actual dentist-clinic product, current Excel-first pilot storage, future Supabase migration, and later WhatsApp integration.

## 1. Product Context

The product is for a dentist clinic, not a general hospital.

The current first release is a clinic staff website with a patient-request simulator. Clinic staff must be able to:

- Register patients.
- Store basic patient details such as name, age or date of birth, and phone number.
- Search and identify existing patients.
- View structured previous-visit summaries.
- Manage one dentist most of the time, with support for two or three dentists.
- Configure dentist working hours, breaks, leave, and blocked periods.
- Check dentist availability.
- Select and book an appointment range.
- Cancel or reschedule appointments.
- View the daily schedule.

A frontend-only Patient Request Simulator will imitate future patient input. It will later be replaced or complemented by a WhatsApp adapter.

The first storage implementation is a structured Excel workbook per clinic. Supabase is intentionally deferred. The backend must be designed so the Excel repository can later be replaced by a Supabase or PostgreSQL repository without rewriting the appointment domain logic.

## 2. Required Technology Direction

Use the project’s existing technology choices if already established. If the backend is not yet initialized, use:

- Python 3.11 or the project-supported Python version.
- FastAPI.
- Pydantic v2 for request and response schemas.
- Uvicorn for local serving.
- `openpyxl` for Excel workbook operations.
- `pytest` and `httpx` for tests.
- `ruff` and `mypy` or the project’s equivalent quality tools.
- `python-dotenv` or a typed settings solution such as `pydantic-settings`.

Do not introduce Supabase, PostgreSQL, Redis, Celery, WhatsApp API, payment providers, or AI integrations in the first Excel pilot unless the existing project explicitly requires them.

Use an adapter boundary so those services can be added later without changing the core domain services.

## 2A. Mandatory Repository Discovery Before Editing

Before creating, moving, renaming, or deleting any file, perform a repository-discovery pass.

Inspect:

- The top-level directory tree.
- Existing backend, frontend, and shared directories.
- Python package configuration such as `pyproject.toml`, `requirements.txt`, or `Pipfile`.
- Existing FastAPI or Flask application entry points.
- Existing routers, route files, controllers, services, models, schemas, repositories, utilities, and tests.
- Existing environment files and configuration loading.
- Existing Excel or storage code.
- Existing frontend API calls and expected endpoint names.
- Existing documentation and project instructions.
- Existing test and lint commands.

Create an internal mapping before changing anything:

| Required responsibility | Existing file or module | Status | Action |
|---|---|---|---|
| Application entry point | actual path or `missing` | existing/missing/unclear | preserve/adapt/create |
| Route registration | actual path or `missing` | existing/missing/unclear | preserve/adapt/create |
| Patient logic | actual path or `missing` | existing/missing/unclear | preserve/adapt/create |
| Appointment logic | actual path or `missing` | existing/missing/unclear | preserve/adapt/create |
| Storage logic | actual path or `missing` | existing/missing/unclear | preserve/adapt/create |
| Tests | actual path or `missing` | existing/missing/unclear | preserve/adapt/create |

Do not create a second file simply because the expected name is absent. First search by responsibility, class name, function name, route path, import, and related terminology. For example, if `patient.service.py` does not exist, search for patient-related functions in all Python files before creating a new service.

If an existing file combines several responsibilities, split it only when the split improves maintainability and can be done safely. Preserve behavior and update imports. If a file already follows a different but coherent naming convention, use the project convention consistently instead of renaming everything unnecessarily.

If a required responsibility is genuinely missing, create it in the most appropriate existing package. If the project has no suitable package, create the smallest required package and explain why.

Never delete or overwrite working code merely to match the reference tree. Before a move or rename, search all imports, route registrations, tests, scripts, configuration references, and documentation references. Update every reference and run the relevant tests.

If the repository is empty, create the proposed structure from this prompt. If it is partially implemented, perform an incremental restructure. If the repository’s framework differs from FastAPI, report the difference before converting it; do not silently rewrite the project.

## 3. Safe Restructuring Rules

1. Preserve working behavior unless the task explicitly requires a behavior change.
2. Do not create duplicate route handlers for the same endpoint.
3. Do not create duplicate models, schemas, services, or repository implementations for the same concept.
4. Use one canonical module for each responsibility.
5. Prefer adapters and compatibility imports during migration when immediate renaming would break callers.
6. Keep a short migration record of moved, renamed, merged, created, and intentionally untouched files.
7. Run import checks and tests after structural changes.
8. Do not remove an old file until all references are migrated and the replacement is verified.
9. If two files appear to implement the same responsibility, compare them before deciding which one becomes canonical.
10. If naming is ambiguous, choose a clear name, update references, and document the mapping.
11. Do not create empty architectural folders without a current purpose.
12. Do not add future integrations as fake implementations merely to fill the directory tree.

## 4. Architectural Style

Use a **modular monolith with feature modules and clear layers**.

The required separation is:

```text
Routes / routers
    -> Controllers
        -> Application services
            -> Domain services and rules
                -> Repository interfaces
                    -> Excel repository implementation
```

External integrations must be isolated:

```text
Future WhatsApp adapter
Future Supabase repository
Future email or notification provider
```

The backend must not contain business logic inside route declarations. Routes should define HTTP paths and dependencies, controllers should translate HTTP input into application calls, services should execute use cases, and repositories should handle storage.

## 5. Required Backend Directory Structure

The following tree is a target architecture, not a demand to create every file regardless of need. Create only the files required by the current implementation, and preserve equivalent existing files when they already satisfy the responsibility.

Create a structure similar to the following, adapting names to the existing repository conventions:

```text
backend/
├── pyproject.toml or requirements files
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml                  # Only if useful for local development
├── README.md
├── alembic.ini                         # Add only when a relational database is introduced
│
├── app/
│   ├── main.py                         # Application entry point; bootstrap only
│   ├── app.py                          # FastAPI application factory and middleware setup
│   │
│   ├── config/
│   │   ├── __init__.py
│   │   ├── settings.py                 # Typed environment configuration
│   │   ├── security.py                  # Security-related settings only
│   │   ├── storage.py                   # Excel path, backup path, persistence settings
│   │   └── logging.py                   # Logging configuration
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── router.py                    # Mounts API version routers
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── router.py                # Mounts feature routers
│   │       ├── dependencies.py          # Authentication, clinic scope, and service dependencies
│   │       └── routes/
│   │           ├── __init__.py
│   │           ├── health.routes.py
│   │           ├── auth.routes.py
│   │           ├── patients.routes.py
│   │           ├── visits.routes.py
│   │           ├── dentists.routes.py
│   │           ├── availability.routes.py
│   │           ├── appointments.routes.py
│   │           ├── staff.routes.py
│   │           ├── clinics.routes.py
│   │           └── patient_requests.routes.py
│   │
│   ├── modules/
│   │   ├── __init__.py
│   │   │
│   │   ├── auth/
│   │   │   ├── __init__.py
│   │   │   ├── auth.controller.py
│   │   │   ├── auth.service.py
│   │   │   ├── auth.schemas.py
│   │   │   ├── auth.dependencies.py
│   │   │   ├── auth.constants.py
│   │   │   └── auth.tests.py
│   │   │
│   │   ├── clinics/
│   │   │   ├── __init__.py
│   │   │   ├── clinic.controller.py
│   │   │   ├── clinic.service.py
│   │   │   ├── clinic.repository.py
│   │   │   ├── clinic.schemas.py
│   │   │   ├── clinic.types.py
│   │   │   └── clinic.tests.py
│   │   │
│   │   ├── patients/
│   │   │   ├── __init__.py
│   │   │   ├── patient.controller.py
│   │   │   ├── patient.service.py
│   │   │   ├── patient.repository.py
│   │   │   ├── patient.schemas.py
│   │   │   ├── patient.types.py
│   │   │   ├── patient.validators.py
│   │   │   └── patient.tests.py
│   │   │
│   │   ├── visits/
│   │   │   ├── __init__.py
│   │   │   ├── visit.controller.py
│   │   │   ├── visit.service.py
│   │   │   ├── visit.repository.py
│   │   │   ├── visit.schemas.py
│   │   │   ├── visit.types.py
│   │   │   └── visit.tests.py
│   │   │
│   │   ├── dentists/
│   │   │   ├── __init__.py
│   │   │   ├── dentist.controller.py
│   │   │   ├── dentist.service.py
│   │   │   ├── dentist.repository.py
│   │   │   ├── dentist.schemas.py
│   │   │   ├── dentist.types.py
│   │   │   └── dentist.tests.py
│   │   │
│   │   ├── availability/
│   │   │   ├── __init__.py
│   │   │   ├── availability.controller.py
│   │   │   ├── availability.service.py
│   │   │   ├── availability.repository.py
│   │   │   ├── availability.schemas.py
│   │   │   ├── availability.rules.py
│   │   │   └── availability.tests.py
│   │   │
│   │   ├── appointments/
│   │   │   ├── __init__.py
│   │   │   ├── appointment.controller.py
│   │   │   ├── appointment.service.py
│   │   │   ├── appointment.repository.py
│   │   │   ├── appointment.schemas.py
│   │   │   ├── appointment.types.py
│   │   │   ├── appointment.state_machine.py
│   │   │   ├── appointment.rules.py
│   │   │   └── appointment.tests.py
│   │   │
│   │   ├── patient_requests/
│   │   │   ├── __init__.py
│   │   │   ├── patient_request.controller.py
│   │   │   ├── patient_request.service.py
│   │   │   ├── patient_request.schemas.py
│   │   │   ├── patient_request.types.py
│   │   │   └── patient_request.tests.py
│   │   │
│   │   ├── staff/
│   │   │   ├── __init__.py
│   │   │   ├── staff.controller.py
│   │   │   ├── staff.service.py
│   │   │   ├── staff.repository.py
│   │   │   ├── staff.schemas.py
│   │   │   └── staff.tests.py
│   │   │
│   │   └── audit/
│   │       ├── __init__.py
│   │       ├── audit.service.py
│   │       ├── audit.repository.py
│   │       ├── audit.schemas.py
│   │       └── audit.tests.py
│   │
│   ├── domain/
│   │   ├── __init__.py
│   │   ├── entities/
│   │   │   ├── clinic.py
│   │   │   ├── patient.py
│   │   │   ├── visit.py
│   │   │   ├── dentist.py
│   │   │   ├── availability.py
│   │   │   └── appointment.py
│   │   ├── value_objects/
│   │   │   ├── identifiers.py
│   │   │   ├── phone_number.py
│   │   │   ├── appointment_range.py
│   │   │   └── timezone.py
│   │   ├── enums/
│   │   │   ├── appointment_status.py
│   │   │   ├── dentist_status.py
│   │   │   ├── staff_role.py
│   │   │   └── request_status.py
│   │   └── errors/
│   │       ├── domain_error.py
│   │       ├── slot_unavailable_error.py
│   │       ├── duplicate_patient_error.py
│   │       └── invalid_transition_error.py
│   │
│   ├── repositories/
│   │   ├── __init__.py
│   │   ├── interfaces/
│   │   │   ├── clinic_repository.py
│   │   │   ├── patient_repository.py
│   │   │   ├── visit_repository.py
│   │   │   ├── dentist_repository.py
│   │   │   ├── availability_repository.py
│   │   │   ├── appointment_repository.py
│   │   │   ├── staff_repository.py
│   │   │   └── audit_repository.py
│   │   └── excel/
│   │       ├── excel_repository_base.py
│   │       ├── excel_workbook.py
│   │       ├── excel_schema.py
│   │       ├── excel_lock.py
│   │       ├── excel_backup.py
│   │       ├── clinic_excel_repository.py
│   │       ├── patient_excel_repository.py
│   │       ├── visit_excel_repository.py
│   │       ├── dentist_excel_repository.py
│   │       ├── availability_excel_repository.py
│   │       ├── appointment_excel_repository.py
│   │       ├── staff_excel_repository.py
│   │       └── audit_excel_repository.py
│   │
│   ├── shared/
│   │   ├── __init__.py
│   │   ├── errors/
│   │   │   ├── app_error.py
│   │   │   ├── bad_request_error.py
│   │   │   ├── unauthorized_error.py
│   │   │   ├── forbidden_error.py
│   │   │   ├── not_found_error.py
│   │   │   ├── conflict_error.py
│   │   │   ├── workbook_error.py
│   │   │   └── error_handlers.py
│   │   ├── middleware/
│   │   │   ├── request_id.py
│   │   │   ├── exception_handler.py
│   │   │   ├── logging.py
│   │   │   ├── cors.py
│   │   │   └── security_headers.py
│   │   ├── responses/
│   │   │   └── api_response.py
│   │   ├── pagination/
│   │   │   └── pagination.py
│   │   ├── security/
│   │   │   ├── password.py
│   │   │   ├── tokens.py
│   │   │   └── permissions.py
│   │   ├── time/
│   │   │   └── timezone.py
│   │   └── identifiers/
│   │       └── id_generator.py
│   │
│   ├── infrastructure/
│   │   ├── __init__.py
│   │   ├── logging/
│   │   │   └── logger.py
│   │   ├── storage/
│   │   │   ├── storage_interface.py
│   │   │   ├── local_storage.py
│   │   │   └── persistent_storage.py
│   │   ├── whatsapp/
│   │   │   ├── whatsapp_interface.py
│   │   │   └── README.md              # Future only; no live integration now
│   │   └── supabase/
│   │       ├── supabase_interface.py
│   │       └── README.md              # Future only; no live integration now
│   │
│   ├── docs/
│   │   ├── openapi.py
│   │   ├── api_conventions.md
│   │   └── error_codes.md
│   │
│   └── tests/
│       ├── conftest.py
│       ├── factories.py
│       ├── fixtures/
│       │   └── demo_workbook.xlsx
│       ├── unit/
│       │   ├── domain/
│       │   ├── services/
│       │   └── repositories/
│       ├── integration/
│       │   ├── patients_api_test.py
│       │   ├── visits_api_test.py
│       │   ├── availability_api_test.py
│       │   ├── appointments_api_test.py
│       │   └── patient_requests_api_test.py
│       └── e2e/
│           └── staff_booking_flow_test.py
│
└── scripts/
    ├── create_demo_workbook.py
    ├── validate_workbook.py
    ├── backup_workbook.py
    ├── reset_demo_data.py
    └── health_check.py
```

You may adjust names to follow Python conventions, but maintain the conceptual separation. Python modules should normally use `snake_case.py`; do not copy TypeScript naming conventions blindly.

## 6. Layer Responsibilities

### Routes

Routes define URL paths, HTTP methods, tags, response status codes, dependencies, and request/response schema references. They must remain thin.

Routes must not contain Excel operations, booking algorithms, duplicate-detection logic, or direct business decisions.

### Controllers

Controllers translate validated HTTP requests into application-service calls and translate results into API responses. They may coordinate dependencies but must not own storage implementation or complex domain rules.

### Services

Services implement use cases such as registering a patient, finding a patient, adding a visit, listing availability, booking an appointment, cancelling an appointment, rescheduling an appointment, and submitting a patient request.

Services should depend on repository interfaces, not concrete Excel classes.

### Domain

Domain entities, value objects, enums, state transitions, and scheduling rules belong here. Domain code should not import FastAPI, Excel, HTTP, or provider SDKs.

### Repositories

Repositories provide interfaces for storing and retrieving domain data. The first implementation is Excel. A future Supabase implementation must satisfy the same interfaces.

### Infrastructure

Infrastructure contains external-system clients and runtime concerns. WhatsApp and Supabase are placeholders for future adapters only. Do not add live integrations in the Excel pilot.

### Shared

Shared code contains genuinely cross-cutting concerns such as errors, permissions, request IDs, time handling, response formatting, and security utilities. Do not put feature-specific business logic in `shared`.

## 7. API Route Groups

Use a versioned API such as `/api/v1`.

Recommended route groups:

```text
GET    /health

POST   /api/v1/auth/login
POST   /api/v1/auth/logout
GET    /api/v1/auth/me

POST   /api/v1/patients
GET    /api/v1/patients
GET    /api/v1/patients/{patient_id}
PATCH  /api/v1/patients/{patient_id}

POST   /api/v1/patients/{patient_id}/visits
GET    /api/v1/patients/{patient_id}/visits

GET    /api/v1/dentists
POST   /api/v1/dentists
PATCH  /api/v1/dentists/{dentist_id}

GET    /api/v1/availability
POST   /api/v1/availability/rules
POST   /api/v1/availability/block-periods

GET    /api/v1/appointments
POST   /api/v1/appointments
GET    /api/v1/appointments/{appointment_id}
PATCH  /api/v1/appointments/{appointment_id}
POST   /api/v1/appointments/{appointment_id}/cancel
POST   /api/v1/appointments/{appointment_id}/reschedule

POST   /api/v1/patient-requests
GET    /api/v1/patient-requests
POST   /api/v1/patient-requests/{request_id}/approve
POST   /api/v1/patient-requests/{request_id}/reject

GET    /api/v1/clinics/current
PATCH  /api/v1/clinics/current
GET    /api/v1/audit-events
```

The exact endpoints may change after inspecting the frontend requirements. Do not create endpoints that are not needed by an actual workflow.

## 8. Excel Pilot Requirements

Implement the workbook repository carefully.

### Workbook sheets

Use one workbook per clinic with these sheets:

- `Patients`
- `Visits`
- `Dentists`
- `Availability`
- `Appointments`
- `Staff`
- `PatientRequests`
- `AuditLog`
- `Metadata`

### Workbook rules

- FastAPI is the only writer.
- Use stable identifiers.
- Validate headers and value types.
- Use a file lock for every write.
- Write to a temporary file and atomically replace the main file.
- Create a backup before important mutations.
- Include schema version in `Metadata`.
- Do not store passwords or API secrets in the workbook.
- Do not expose filesystem paths to the frontend.
- Do not claim success before the file is safely written.
- Do not use an ephemeral deployment filesystem for real clinic records.

## 9. Patient Request Simulator Contract

The frontend simulator will eventually call the patient-request API. Define the contract now, but do not build a real WhatsApp integration.

A request may contain:

```json
{
  "patient": {
    "full_name": "Example Patient",
    "age": 29,
    "phone_number": "+910000000000"
  },
  "preferred_dentist_id": "dentist-001",
  "preferred_date": "2026-09-10",
  "preferred_start_time": "10:00",
  "preferred_end_time": "10:30",
  "source": "simulator"
}
```

The backend must validate the request, create or match the patient according to explicit rules, check availability, and either create a pending request or a confirmed appointment according to the approved workflow.

The future WhatsApp adapter should produce the same internal request shape with `source: "whatsapp"`.

## 10. Authentication and Permissions

Implement the minimum secure staff authentication needed by the existing project. Use roles such as:

- `clinic_owner`
- `receptionist`
- `dentist`
- `platform_admin`

Every clinic-scoped request must verify that the authenticated user is associated with the clinic. Do not rely on a clinic ID supplied by the browser alone.

Use secure password hashing, protected sessions or tokens, secret configuration, safe error messages, and audit events for important changes.

If authentication is not in scope for the current prototype, create a clearly isolated development-only authentication substitute and label it as non-production. Do not silently treat it as production-ready.

## 11. Error Handling and Response Format

Use consistent errors with a machine-readable code, safe human-readable message, request ID, and optional field-level details.

Recommended categories include:

- `VALIDATION_ERROR`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `DUPLICATE_PATIENT`
- `SLOT_UNAVAILABLE`
- `WORKBOOK_LOCKED`
- `WORKBOOK_WRITE_FAILED`
- `INVALID_APPOINTMENT_TRANSITION`
- `INTERNAL_ERROR`

Do not expose stack traces, filesystem paths, secrets, or workbook internals to users.

## 12. Scheduling and Data Integrity

The booking service must:

1. Validate the clinic, patient, dentist, date, and requested range.
2. Load the dentist schedule and blocked periods.
3. Check existing appointments.
4. Acquire the workbook write lock.
5. Re-check availability after acquiring the lock.
6. Write the appointment and audit event.
7. Validate the workbook.
8. Atomically replace the file.
9. Return the confirmed result only after the write succeeds.

The system must not allow duplicate appointments caused by double-clicks, retries, duplicate simulator submissions, or repeated webhook events.

## 13. Testing Requirements

Create tests for:

### Unit tests

- Patient validation.
- Duplicate patient detection.
- Visit validation.
- Dentist availability calculation.
- Appointment range validation.
- Appointment state transitions.
- Permission rules.
- Repository behavior.
- Workbook schema validation.

### Integration tests

- Patient registration API.
- Patient search API.
- Previous-visit API.
- Dentist configuration API.
- Availability API.
- Appointment creation API.
- Cancellation and rescheduling API.
- Patient-request simulator API.
- Workbook backup and recovery.

### Failure tests

- Two staff requests attempt the same range.
- The workbook is locked.
- The workbook is corrupt.
- A duplicate request is submitted.
- A required sheet is missing.
- A user from another clinic attempts access.
- A storage write fails.
- A dentist is on leave.
- A previously available range becomes unavailable.

## 14. Implementation Order

Implement in this order:

1. Inspect the existing repository and frontend contract.
2. Create configuration and application bootstrap.
3. Create shared errors, response format, request IDs, and logging.
4. Create domain entities, enums, value objects, and scheduling rules.
5. Create repository interfaces.
6. Create workbook schema and Excel repository infrastructure.
7. Create patient and visit modules.
8. Create dentist and availability modules.
9. Create appointment module.
10. Create patient-request module for the frontend simulator.
11. Add authentication and clinic permissions.
12. Add API routers and thin controllers.
13. Add tests and demo workbook scripts.
14. Connect the existing frontend simulator.
15. Document the future Supabase and WhatsApp adapter boundaries.

Do not build future integrations before the current Excel workflow works.

## 15. Definition of Done

The backend structure is complete when:

- Routes, controllers, services, repositories, schemas, domain rules, and infrastructure are separated.
- The FastAPI application starts successfully.
- The demo workbook can be created and validated.
- Patient registration works through the API.
- Previous visits can be added and retrieved.
- Dentist availability can be configured and queried.
- Appointment ranges can be booked without double booking.
- Patient requests from the simulator can be created and reviewed.
- Excel writes are locked, validated, backed up, and recoverable.
- Tests cover important business and failure paths.
- Future Supabase and WhatsApp integrations have clear adapter boundaries but are not falsely implemented.
- The project documentation is updated if the implementation creates new decisions.

## 16. Final Reporting

After implementation, report:

1. The created directory structure.
2. Which modules were implemented.
3. Which routes are available.
4. Which features use Excel storage.
5. Which integrations are intentionally not implemented.
6. Tests executed and their results.
7. Known limitations.
8. Recommended next step.

Do not claim production readiness, healthcare compliance, WhatsApp integration, or Supabase integration unless those things actually exist and have been tested.

## Final Instruction

Before reporting completion, explicitly state whether the repository was empty, partially implemented, or already structured; which existing files were reused; which files were created; which files were moved or renamed; which files were left untouched; and whether any compatibility concerns remain.

Use the attached architecture only as a reference for separation of concerns. Create a structure that is appropriate for this dentist-clinic product and FastAPI/Python. Keep routes, controllers, services, repositories, schemas, domain logic, shared utilities, infrastructure, and tests properly separated. Think deeply about maintainability, data integrity, Excel limitations, future migration, and the frontend simulator contract before creating files.
