# One-Time Project Documentation Update Prompt

## Instructions for the AI Agent

You are updating the documentation for a dentist-clinic appointment product. Think carefully before changing anything. Do not make superficial edits. First understand the existing project documents, then update them consistently according to the new situation described below.

Your task is to revise the project’s Markdown documentation, not to build the full application yet.

## 1. Read the Existing Documentation First

Before making any change, read these files completely:

- `PRD.md`
- `Architecture.md`
- `rules.md`
- `phases.md`
- `Design.md`
- `memory.md`
- `agent.md`

Also inspect the existing source-code repository, directory structure, and current implementation if they exist. Do not assume that the documentation and code are already consistent.

## 2. New Product Situation

The current product direction is now:

> Build the dentist-clinic staff website and patient-request simulator first. Add real WhatsApp integration later, after the internal workflow is proven.

The product is for a **dentist clinic**, not a general hospital.

The clinic staff will use the website to:

- Register patients.
- Store basic patient details such as name, age or date of birth, phone number, and other approved registration fields.
- Search for existing patients.
- Review structured summaries of previous visits.
- Select the dentist requested by the patient.
- Check whether the dentist is available.
- Support one dentist most of the time, with two or three dentists when configured.
- Select and book an appointment range.
- Change, cancel, or reschedule appointments.
- Review the daily schedule.

There is currently no dedicated business WhatsApp number available. Therefore, the first version must not depend on a real WhatsApp number, live WhatsApp account, or WhatsApp Business Platform integration.

Instead, create a **Patient Request Simulator**. The simulator should imitate the information a patient would later send through WhatsApp. It should submit structured patient and appointment requests to the same FastAPI backend services that a future WhatsApp webhook will use.

The intended flow is:

```text
Patient Request Simulator
        -> FastAPI patient-request endpoint
        -> patient and availability services
        -> appointment service
        -> temporary Excel storage
        -> clinic staff website
```

The future flow will be:

```text
Patient WhatsApp
        -> WhatsApp webhook
        -> same FastAPI patient-request and appointment services
        -> Supabase or approved production storage later
        -> clinic staff website
```

The simulator must not become a separate booking system. It must be an input adapter that can later be replaced by WhatsApp.

## 3. Storage Decision

Do not introduce Supabase at this stage.

For the early controlled iteration, use a structured Excel workbook as temporary storage. The workbook should be one workbook per clinic and should contain clear sheets such as:

- `Patients`
- `Visits`
- `Dentists`
- `Availability`
- `Appointments`
- `Staff`
- `AuditLog`
- `Metadata`

FastAPI must be the only writer to the workbook. The browser and simulator must never edit the workbook directly.

The documentation must state that Excel is a temporary pilot storage layer, not the final production database. It requires file locking, validation, backups, atomic writes, stable identifiers, and persistent storage.

The architecture must keep a repository boundary so that Excel can later be replaced by Supabase or PostgreSQL without rewriting the product’s booking logic.

## 4. Required Documentation Changes

Update all affected files. Do not update only one file and leave contradictory statements elsewhere.

### `PRD.md`

Revise the product summary, vision, target users, MVP scope, and user journeys so that the first product is the dentist-clinic staff website plus patient-request simulator.

Make it clear that:

- Website comes first.
- Patient-request simulator comes before WhatsApp.
- WhatsApp is a later integration.
- Supabase is deferred.
- Excel is temporary pilot storage.
- The product is administrative, not clinical.

Include requirements for patient registration, previous-visit summaries, dentist availability, appointment ranges, staff approval, and future WhatsApp-compatible input.

### `Architecture.md`

Rewrite the architecture around:

- Staff website.
- FastAPI backend.
- Excel workbook repository.
- Patient Request Simulator.
- Appointment and availability services.
- Future WhatsApp adapter.
- Future Supabase repository.

Show that both the simulator and future WhatsApp integration call the same backend services. Explain why direct browser-to-Excel access is forbidden and how file locking, validation, backups, and atomic replacement work.

### `rules.md`

Add or revise rules requiring:

- Dentist-clinic scope.
- Website-first development.
- Simulator-first patient input.
- Excel-only backend writes.
- No direct workbook edits while the website is active.
- Stable identifiers.
- One appointment engine for website, simulator, and future WhatsApp.
- No real WhatsApp number required for the first iteration.
- No Supabase before validation.
- No clinical advice, diagnosis, triage, or prescriptions.

### `phases.md`

The implementation order must be:

1. Confirm the real dental-clinic workflow.
2. Build staff website prototype.
3. Build FastAPI and Excel pilot backend.
4. Build patient registration and previous-visit workflow.
5. Build dentist availability and appointment-range booking.
6. Build Patient Request Simulator.
7. Run a controlled clinic pilot.
8. Decide whether to migrate to Supabase.
9. Add real WhatsApp integration only after the internal workflow is stable.

Each phase must have a clear objective, activities, exit criteria, and stop-or-pivot condition.

### `Design.md`

Focus the design on:

- Receptionist and clinic staff workflows.
- Patient registration.
- Existing-patient search.
- Previous-visit summaries.
- Dentist availability.
- Appointment-range selection.
- Daily schedule.
- Patient Request Simulator.
- Clear separation between the simulator and the future WhatsApp adapter.

The simulator should have a simple patient-request form or chat-like flow and should send the request to FastAPI. It should not write directly to Excel.

### `memory.md`

Record the new durable decisions:

- Dentist clinic is the initial domain.
- Website is first.
- No real WhatsApp number is currently available.
- Patient Request Simulator is the current patient-input method.
- Excel is temporary pilot storage.
- Supabase is deferred.
- WhatsApp is a later adapter using the same services.
- FastAPI is the backend boundary.

Record unresolved questions such as the first clinic, exact registration fields, appointment-range rules, hosting location, and the trigger for Supabase migration.

### `agent.md`

Update the agent instructions so future agents must:

1. Read all project documents before material changes.
2. Follow the website-first and simulator-first order.
3. Never start WhatsApp integration before the website workflow is stable.
4. Never introduce Supabase merely because it is familiar or convenient.
5. Treat Excel as temporary and enforce safe access through FastAPI.
6. Keep simulator input and future WhatsApp input behind the same service interfaces.
7. Update every affected Markdown file when a decision changes.
8. Inspect the current repository before implementing.
9. Think through data, security, migration, reliability, and staff usability.
10. Report assumptions, risks, tests, and unresolved questions honestly.

## 5. Expert Review Requirements

While updating the files, act as an experienced product and software architect. Identify and document important risks rather than blindly accepting the requested approach.

In particular, explain that Excel is suitable only for a controlled prototype because it has weaknesses around concurrent writes, backups, access control, corruption, and hosted persistence. Do not reject the Excel decision for the prototype, but clearly define the safeguards and migration trigger.

Make sure the system does not create duplicate booking logic. The website, simulator, and future WhatsApp integration must all use the same availability and appointment services.

Make sure the data model is migration-ready. Stable identifiers, consistent columns, controlled status values, timestamps, and clear sheet boundaries are required from the first iteration.

Make sure previous visits remain limited and structured. Do not quietly turn the MVP into a full electronic medical record system.

Make sure the future WhatsApp layer is described as an input channel, not as the product’s core domain logic.

## 6. Consistency Review

After editing, search all Markdown files for obsolete statements such as:

- WhatsApp-first product.
- WhatsApp required for the MVP.
- Supabase required immediately.
- Direct browser access to Excel.
- Patient mobile app required.
- General hospital-management scope.

Remove or rewrite obsolete active assumptions. Historical notes may remain only if clearly labeled as historical.

Check that the following statement is true in every relevant file:

> The first release is a dentist-clinic staff website with a Patient Request Simulator, FastAPI backend, and controlled Excel pilot storage. Supabase and real WhatsApp integration come later after validation.

## 7. Output Requirements

Update the existing files in place:

- `PRD.md`
- `Architecture.md`
- `rules.md`
- `phases.md`
- `Design.md`
- `memory.md`
- `agent.md`

Do not create unnecessary duplicate documentation files.

At the end, report:

1. Which files were changed.
2. The most important decisions recorded.
3. Any risks introduced by Excel pilot storage.
4. Any unresolved questions.
5. Whether the documents are internally consistent.
6. What the next implementation step should be.

Do not claim that the application has been built. This task is to update the project documentation correctly.

## 8. Final Instruction

Think deeply before editing. Treat this as a real product documentation change, not a simple find-and-replace operation. Preserve useful existing decisions, remove obsolete assumptions, make the new architecture coherent, and update the documentation so that a future coding agent can understand exactly what to build and in what order.

After completing the update, this file may be deleted because it is a one-time migration instruction.
