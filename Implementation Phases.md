# Implementation Phases

## Strategy

Build and validate the clinic staff website first. Do not begin with WhatsApp or Supabase. The first proof must be that dental-clinic staff can register patients and book correct appointment ranges using the website.

## Phase 0: Confirm the Clinic Workflow

**Objective:** Understand the real dental-clinic process before coding.

**Activities:**

- Choose one dentist clinic as the first design partner.
- Observe registration and appointment booking.
- Identify the minimum patient and previous-visit fields.
- Document how one, two, or three dentists are scheduled.
- Document appointment duration, breaks, leave, and walk-ins.
- Decide whether the clinic uses fixed appointment ranges or flexible slots.
- Agree how staff will inspect or export the workbook.

**Exit gate:** The clinic approves the first workflow, fields, availability rules, and pilot success measures.

## Phase 1: Staff Website Prototype

**Objective:** Prove that the staff can use the website without WhatsApp.

**Build:**

- Staff login.
- Patient registration form.
- Patient search.
- Patient profile.
- Previous-visit list and structured summary entry.
- Dentist list.
- Basic schedule and availability screen.
- Appointment creation form.

At this stage, the interface may use test data or a local file. Focus on workflow clarity, not production infrastructure.

**Exit gate:** Staff can register a patient, find the patient, review previous visits, and book an appointment range without developer assistance.

## Phase 2: FastAPI and Excel Pilot Backend

**Objective:** Make the website operational with controlled temporary storage.

**Build:**

- FastAPI API.
- Structured workbook schema.
- One workbook per clinic.
- Workbook repository using `openpyxl` or equivalent.
- File lock and atomic write process.
- Backup before writes.
- Stable identifiers.
- Patient, visits, dentists, availability, appointments, staff, metadata, and audit sheets.
- Validation and error recovery.

**Exit gate:** Every successful website action produces a correct workbook record and every failed write is visible to staff.

## Phase 3: Scheduling Reliability

**Objective:** Make dentist availability and appointment booking trustworthy.

**Build:**

- Working hours.
- Dentist leave and blocked periods.
- Breaks.
- Appointment duration.
- Fixed appointment ranges or approved slot rules.
- Conflict detection.
- Double-booking tests.
- Cancellation and rescheduling.
- Timezone handling.
- Appointment status history.

**Exit gate:** The system passes concurrent booking, duplicate submission, cancellation, rescheduling, and failed-write tests.

## Phase 4: Controlled Clinic Pilot

**Objective:** Use the website with one real dental clinic.

**Activities:**

- Use clinic-approved fields and workflows.
- Train staff.
- Keep the current manual process as a fallback.
- Monitor workbook backups and failures.
- Record staff friction and missing requirements.
- Measure time to register a patient and book an appointment.
- Measure scheduling errors and staff adoption.

**Exit gate:** Staff use the website repeatedly for at least two weeks and confirm that it is better than their current process.

## Phase 5: Decide on Supabase Migration

**Objective:** Move beyond Excel only when evidence justifies it.

Migrate when multiple staff need concurrent writes, more than one clinic is active, workbook size or reliability becomes a problem, backups and access control need to be stronger, or the product is ready for WhatsApp traffic.

**Migration activities:**

- Freeze the workbook schema.
- Export each sheet.
- Normalize into tables.
- Preserve stable identifiers.
- Compare row counts and important records.
- Run parallel verification.
- Keep the original workbook as an archive.
- Switch the repository implementation from Excel to Supabase.

**Exit gate:** The same website workflow works against Supabase with verified data parity.

## Phase 6: Add WhatsApp Patient Input

**Objective:** Allow patients to submit appointment requests through WhatsApp.

**Build:**

- Official WhatsApp Business integration.
- Verified webhook.
- Patient opt-in and opt-out handling.
- Patient identification or registration flow.
- Preferred dentist selection.
- Date or appointment-range selection.
- Availability response.
- Human handoff.
- Confirmation and reminder templates.
- Idempotent webhook processing.

WhatsApp must call the same patient, availability, and appointment services as the staff website. It must not create a separate scheduling implementation.

**Exit gate:** A WhatsApp request can become a staff-visible appointment without duplicate records or conflicting availability.

## Phase 7: Productize and Expand

**Objective:** Make onboarding repeatable and add only validated capabilities.

Possible later capabilities:

1. Waitlist and cancellation recovery.
2. Follow-up reminders.
3. Multiple dentists and locations.
4. Payment links.
5. Practice-management integrations.
6. More detailed clinical records after proper review.
7. Constrained staff-assistance AI.

Do not add diagnosis, prescription generation, or autonomous clinical decisions as ordinary roadmap items.

## Go/No-Go Gates

| Gate | Continue when | Stop or revise when |
|---|---|---|
| Workflow | Staff agree on the real process | Requirements remain unclear |
| Website prototype | Staff complete the core tasks | They need constant developer help |
| Excel pilot | Writes and backups are reliable | Records are lost or frequently corrupted |
| Clinic pilot | Staff use it repeatedly | Staff return immediately to the old process |
| Supabase migration | Concurrent usage or reliability justifies it | Excel is sufficient and migration adds no value |
| WhatsApp | Website workflow is stable | Website rules still change frequently |
| Expansion | Customers repeatedly request the same capability | Features are based only on speculation |
