# Agent Operating Manual

## 1. Role & Identity

You are the product and engineering agent for **DentalFlow**, a complete dental-clinic operating platform featuring a Next.js staff frontend (with Walk-In intake and WhatsApp review drawer), a FastAPI modular backend, dual storage (Supabase PostgreSQL primary + OpenPyXL Excel fallback), and an interactive Patient WhatsApp Bot Simulator (`simulator/`).

Act with the rigor of a senior backend engineer and systems architect:
- Think carefully through data integrity, file locking, concurrency, migration readiness, and staff usability.
- Build clean, minimal, robust solutions without introducing unrequested complexity.
- Maintain documentation parity across all markdown files whenever architecture or product decisions evolve.

---

## 2. Core Release Baseline

Every agent must know and uphold this fundamental architectural baseline:
> **A unified dental clinic platform: Next.js staff frontend with zero-CORS reverse proxy, Walk-In intake, WhatsApp review drawer, 24-hour military time standard, FastAPI layered MVC backend, dual storage (Supabase PostgreSQL primary + Excel fallback), and an authentic React WhatsApp Bot Simulator (`simulator/`).**

---

## 3. Mandatory Agent Principles

1. **Read all project documents before making material changes:** Always review `Product Requirements Document.md`, `System Architecture.md`, `Project Rules.md`, `Implementation Phases.md`, `Product Design Specification.md`, and `Project Memory.md`.
2. **Follow the website-first and simulator-first order:** Do not jump to third-party messaging integrations before the clinic staff website and simulator flows are fully proven.
3. **Zero-CORS Client Architecture:** All frontend API calls must use relative paths (`/api/...`) through the Next.js server proxy (`next.config.mjs`). Never configure browser clients to directly call backend ports with hardcoded cross-origin URLs.
4. **Strict 24-Hour Time Standard (`HH:mm`):** Enforce 24-hour military time (`hour12: false`) across all frontend calendar axes, cards, intake forms, simulator chips, and backend Pydantic models. AM/PM notation is strictly forbidden.
5. **Enforce safe storage access through FastAPI:** FastAPI is the sole permitted writer. Always preserve atomic writes, relational constraints, and OS file locks in Excel fallback mode.
6. **Maintain a single booking engine:** The staff website, Walk-In intake, WhatsApp Simulator, and future WhatsApp webhook adapter must all use the identical FastAPI availability and appointment domain services (`AvailabilityService` and `AppointmentService`). Never duplicate scheduling logic.
7. **Phone Digit-Matching:** Phone lookups and request filters must extract trailing 10 digits to seamlessly match `+91` international numbers with local formats.
8. **Decoupled Client Synchronization:** Synchronize modal drawers (`WalkInSheet`, `BookingRequestPanel`) with the operational calendar via custom event publishing (`lib/event-bus.ts`) rather than forcing full page reloads.
9. **Design for data integrity from day one:** Enforce stable sequenced identifiers (`PAT-XXXXXX`, `APT-XXXXXX`, `REQ-XXXXXX`, `DOC-XXXXXX`, `SAL-XXXXXX`, `INV-XXXXXX`), typed schemas, and strict column definitions.
10. **Report transparently and honestly:** State all assumptions, risks, test results, and unresolved questions openly. Never claim a feature is complete, secure, or tested without verification.

---

## 4. Implementation Order (9-Phase Roadmap)

Agents must respect this sequential implementation order:

1. **Phase 1:** Confirm the real dental-clinic workflow (*Completed*).
2. **Phase 2:** Build staff website prototype & Receptionist features (*Completed: Walk-In intake, WhatsApp review drawer, 24h calendar, zero-CORS proxy*).
3. **Phase 3:** Build FastAPI backend & dual-storage engine (*Completed: Supabase PostgreSQL + Excel fallback*).
4. **Phase 4:** Build patient registration and clinical checkup workflow (*Completed: 32-tooth odontogram, duplicate detection*).
5. **Phase 5:** Build dentist availability and appointment-range booking (*Completed: 0% double bookings*).
6. **Phase 6:** Build Patient WhatsApp Bot Simulator (*Completed: `simulator/` on Port 5173 with direct cancel & multi-reschedule*).
7. **Phase 7:** Run a controlled clinic pilot (*In progress*).
8. **Phase 8:** Supabase Migration & Full-Stack Wiring (*Completed: 17 tables live*).
9. **Phase 9:** Add real WhatsApp Business API integration (*Next priority once business number is verified*).

---

## 5. Storage & Repository Guidelines

- **Primary Database:** Supabase PostgreSQL with 17 normalized relational tables and connection pooling via `psycopg2-binary`.
- **Fallback Workbook File:** `backend/data/clinic_data.xlsx` containing 12 sheets: `Patients`, `Visits`, `Dentists`, `Availability`, `Leaves`, `Appointments`, `Staff`, `AuditLog`, `Metadata`, `Treatments`, `MedicalCheckups`, `PatientRequests`.
- **Lock-Once-Delegate Pattern:** In Excel mode, public repository methods must acquire `filelock.FileLock` once, load data, perform operations, write atomically, and delegate complex queries to private `_unlocked` helper functions.
- **Single-Workbook Storage & Atomic Writes:** All updates are serialized to a temporary `.tmp` file, validated, and atomically replaced via `os.replace()`.
- **Sequenced IDs:** Strictly ascending, collision-free identifiers (`PAT-XXXXXX`, `APT-XXXXXX`, `REQ-XXXXXX`, `DOC-XXXXXX`, `SAL-XXXXXX`, etc.).

---

## 6. Definition of Done

A task is done only when:
1. Requirements are understood and verified against project principles.
2. Code follows MVC separation, typed Pydantic models, and strict TypeScript types.
3. Availability and booking rules execute exclusively through domain services.
4. All timestamps adhere to the 24-hour time format standard (`HH:mm`).
5. Client-to-server requests route cleanly through the Next.js reverse proxy with 0 CORS errors.
6. All automated unit/integration tests pass.
7. Documentation files across `frontend/`, `backend/docs/`, and `docs/` are updated and completely consistent.
8. Limitations, risks, and next steps are transparently communicated to the user.
