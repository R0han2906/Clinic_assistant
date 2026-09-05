# Product Requirements Document

## Product

**Working name:** DentalFlow

**Product type:** Dentist-clinic staff website with a Patient Request Simulator, temporary Excel-based pilot storage, and a later WhatsApp patient-input channel.

**Document status:** Revised product baseline (aligned with website-first & simulator-first architecture)

## 1. Important Scope Decision

The first product is **not** a live WhatsApp bot and **not** a general hospital-management system.

The core release statement is:
> **The first release is a dentist-clinic staff website with a Patient Request Simulator, FastAPI backend, and controlled Excel pilot storage. Supabase and real WhatsApp integration come later after validation.**

There is currently **no dedicated business WhatsApp number** available. Therefore, the initial version must not depend on a live WhatsApp account, dedicated phone number, or WhatsApp Business Platform integration.

Instead, the product introduces a **Patient Request Simulator** that imitates the structured requests a patient would later send through WhatsApp. It submits requests directly to the same FastAPI backend services that the future WhatsApp webhook will use.

For this document, “hospital” means **dentist clinic**.

## 2. Product Summary

DentalFlow provides dental-clinic staff with a simple, reliable internal website. Staff can register a patient, record basic registration details, record structured previous visit summaries, select the dentist requested by the patient, check dentist availability, and book an appointment range.

To test and prove patient-side appointment workflows without waiting for a business WhatsApp number, DentalFlow includes a **Patient Request Simulator**. The simulator acts as an input adapter sending structured appointment requests to the FastAPI backend.

### Intended Flow (Current Iteration)
```text
Patient Request Simulator
        -> FastAPI patient-request endpoint
        -> patient and availability services
        -> appointment service
        -> temporary Excel storage
        -> clinic staff website
```

### Future Flow (Post-Validation)
```text
Patient WhatsApp
        -> WhatsApp webhook
        -> same FastAPI patient-request and appointment services
        -> Supabase or approved production storage later
        -> clinic staff website
```

During the initial iteration stage, the system stores data in a structured Excel workbook (`clinic_data.xlsx`) rather than Supabase. The website remains the primary user interface for staff. The workbook is the temporary pilot data store and can be inspected or exported by staff.

Later, patients will submit appointment requests through WhatsApp. WhatsApp will send structured requests to the exact same backend workflow. It will not create a separate booking system.

## 3. Product Vision

> Give small dental clinics a simple, reliable way to register patients, manage dentist availability, and simulate patient requests before introducing real WhatsApp automation and cloud database infrastructure.

## 4. First Target Customer

The first customer is a single-location dental clinic with one dentist most of the time, with support for two or three dentists when necessary. The clinic has front-desk staff who need a clear, dependable way to register patients, record past visits, and schedule appointments without double booking.

The first release does not target general hospitals, large dental chains, emergency departments, or complex multi-location practices.

## 5. Users

| User | Main need |
|---|---|
| Receptionist or clinic staff | Register patients, review previous visits, check dentist availability, and book/manage appointments |
| Dentist | Review daily schedule, appointments, and patient summaries |
| Clinic owner | Review operational activity, working hours, and dentist availability |
| Platform administrator / Developer | Configure clinic settings, inspect workbook data health, and manage system backups |
| Simulator User / Tester | Simulate patient appointment requests imitating future WhatsApp messages |
| Patient (Later Phase) | Submit appointment requests through WhatsApp once a dedicated business number is configured |

## 6. Product Principles

1. **Website first:** Build and validate the clinic staff workflow before WhatsApp.
2. **Simulator first for patient input:** Use a Patient Request Simulator to prove patient-side workflows before acquiring WhatsApp Business infrastructure.
3. **Excel first, but temporary:** Use a structured workbook for early iterations; do not treat it as the final production database.
4. **One booking engine:** Website bookings, simulator requests, and future WhatsApp bookings must use the identical availability and appointment domain rules.
5. **Small-clinic focus:** Optimize for a single dental clinic before supporting complex multi-facility organizations.
6. **Human control:** Staff can review, modify, reschedule, or cancel every appointment.
7. **Administrative scope:** Store only administrative and registration information needed for scheduling.
8. **No unsafe clinical automation:** Strictly administrative; do not diagnose, triage, or prescribe.
9. **Migration-ready:** Excel columns, types, and identifiers must be strictly normalized so migration to Supabase or PostgreSQL requires zero application logic changes.

## 7. MVP Goals

The first release must allow staff and testers to:

- Authenticate safely into the staff website.
- Register a patient with name, age/DOB, phone number, and required clinic acknowledgements.
- Check for duplicate patients before creating new records.
- Record concise, structured previous visit summaries.
- Configure and inspect dentist working hours, breaks, and leaves.
- See whether one, two, or three dentists are available on any given date.
- Calculate valid appointment ranges excluding working hours, breaks, leaves, and booked appointments.
- Book, reschedule, and cancel appointment ranges with zero double bookings.
- Review the daily dentist schedule.
- Search for existing patients by name, phone, or stable identifier.
- Store and retrieve all records from a structured 9-sheet Excel workbook with file locking and atomic writes.
- Submit simulated patient appointment requests via the **Patient Request Simulator** and verify that requests appear correctly on the staff website.
- Export or download the Excel workbook for backup or manual audit.

## 8. Initial Data Scope

### Patient registration
The patient record contains only fields required for registration and scheduling operations:
- Patient identifier (`PAT-000001` format).
- Full name.
- Age or date of birth.
- Phone number.
- Optional email address.
- Emergency contact information (only if explicitly required by clinic).
- Consent / acknowledgement status.
- Created timestamp and last updated timestamp.

### Previous visits
Structured visit summaries, not an unbounded electronic medical record (EMR):
- Visit identifier (`VIS-000001` format).
- Patient identifier.
- Visit date.
- Dentist identifier and name.
- Visit type (e.g., consultation, cleaning, follow-up, procedure).
- Short staff-entered summary (concise administrative notes).
- Follow-up recommendation date, if applicable.

### Dentist availability & scheduling
- Dentist identifier (`DOC-000001` format) and profile.
- Working days and hours per day of the week.
- Break periods.
- Leave and blocked date ranges.
- Standard slot duration (e.g., 30 or 60 minutes).
- Active status.
- Maximum parallel dentists supported (1 to 3 dentists).

## 9. Appointment Requirements

The appointment flow must:
1. Identify the patient (existing or newly registered).
2. Show the requested dentist or available dentists.
3. Evaluate dentist working hours, leave, breaks, and existing appointments under a single read lock.
4. Return valid non-conflicting appointment ranges.
5. Allow staff (or simulator) to select a valid range.
6. Atomically lock, re-validate, and persist the appointment to the workbook.
7. Record an audit log entry.
8. Display the confirmed appointment on the daily schedule.

The first version uses deterministic slot calculation. Flexible dynamic slotting will be added only after real clinic scheduling patterns are observed.

## 10. Website Requirements

The staff website must provide:
- Secure staff authentication.
- Patient registration form with duplicate detection.
- Patient search and profile management.
- Structured previous-visit entry and history view.
- Dentist schedule configuration (hours per weekday, breaks, leave dates).
- Daily schedule view per dentist.
- Appointment creation, rescheduling, and cancellation.
- Real-time workbook health indicator.
- Manual workbook export/download button.
- Clear error handling for locked files or write conflicts.

## 11. Patient Request Simulator Requirements

The Patient Request Simulator must:
- Provide a clear test harness interface simulating the patient's perspective.
- Capture: patient name, phone number, requested dentist (or "any"), preferred date, preferred time range, and appointment reason.
- Submit structured JSON payloads to the FastAPI patient-request endpoint.
- Receive and display available slots or booking confirmations.
- Be completely decoupled from the staff website UI, functioning strictly as an external input adapter.

## 12. WhatsApp Later

WhatsApp is deferred to a later phase once a dedicated WhatsApp Business number is provisioned and internal workflows are stabilized.

When integrated, WhatsApp will:
- Act purely as an input channel replacing the simulator adapter.
- Convert incoming WhatsApp messages into the exact same command structures used by the simulator.
- Use the identical FastAPI availability and appointment services.
- Never write directly to the Excel workbook or bypass business rules.

## 13. Explicitly Out of Scope

- Real WhatsApp Business Platform integration in the first release.
- Live business phone number dependency.
- Supabase or PostgreSQL in the first iteration.
- Full electronic medical record (EMR) system.
- Clinical diagnosis, medical advice, or prescription generation.
- Emergency triage or urgent care routing.
- Billing, insurance claims, pharmacy, or laboratory integration.
- Multi-location clinic hierarchies.
- Native mobile applications (iOS/Android).

## 14. Success Metrics

| Metric | Initial Target |
|---|---|
| Pilot dental clinics | 1 partner clinic (expandable to 3) |
| Staff self-sufficiency | 100% of staff complete registration and booking without developer intervention |
| Double booking rate | 0% double bookings under concurrent staff and simulator activity |
| Data-write reliability | 100% of confirmed actions persisted atomically with zero corruption |
| Simulator-to-Staff workflow | Simulated patient requests appear on staff schedule in real time |
| Excel-to-Database migration readiness | 100% of records use stable sequenced IDs and strict column types |
| Staff satisfaction | Positive feedback after 2 weeks of continuous operational use |

## 15. Product Positioning

The product is positioned as:
> **A simple, dedicated dental-clinic appointment and patient-registration website with a patient-request simulator, helping staff manage dentist availability and patient records without the bloat or cost of a generic hospital management suite.**
