# Project Rules

## 1. Scope Rules

1. The current product is for a dentist clinic, not a general hospital.
2. The current release is the clinic staff website.
3. WhatsApp integration is a later phase.
4. Supabase is deferred until the workflow is validated.
5. Excel is temporary pilot storage, not the final production database.
6. Start with one clinic and one controlled workbook.
7. Do not expand into hospital management, diagnosis, prescriptions, billing, or laboratory operations without an approved scope change.

## 2. Excel Pilot Rules

1. The FastAPI backend is the only writer to the workbook.
2. Staff must not manually edit the workbook while the website is running.
3. Every workbook write must use a file lock.
4. Write to a temporary file, validate it, then atomically replace the main workbook.
5. Create a backup before important writes.
6. Keep one workbook per clinic.
7. Never use names as primary identifiers.
8. Keep stable identifiers across workbook-to-Supabase migration.
9. Validate required sheets, headers, field types, and controlled status values.
10. Store the workbook only on persistent, access-controlled storage.
11. Never place passwords or API secrets in Excel.
12. If the workbook cannot be safely written, do not claim that the operation succeeded.

## 3. Data Scope Rules

1. Collect only information required for registration, appointment operations, and a concise previous-visit record.
2. The initial patient fields are name, age or date of birth, phone number, optional email, identifier, and required clinic acknowledgements.
3. Previous visits must be structured summaries, not an unbounded medical-record replacement.
4. Explain why a new patient field is needed before adding it.
5. Use stable patient, visit, dentist, and appointment identifiers.
6. Do not use patient data for unrelated analytics or AI training.
7. Do not use real patient data in development or test environments.

## 4. Scheduling Rules

1. FastAPI appointment services are the only authority for availability and booking.
2. The website must re-check availability immediately before saving.
3. Dentist availability must consider working hours, leave, breaks, existing appointments, appointment duration, and clinic timezone.
4. A confirmed appointment must contain patient, dentist, date, start time, end time, and status.
5. A booking must not be confirmed if the workbook write fails.
6. A reschedule must preserve the old appointment until the new range is successfully secured.
7. Cancellation and rescheduling must create history and audit events.
8. Concurrent requests must be serialized through the workbook lock during the pilot.
9. If two or three dentists are available, the selected dentist must be shown before confirmation.
10. Never let a future WhatsApp flow use different booking rules from the website.

## 5. Website Rules

1. The website is for authorized clinic staff.
2. The browser must communicate only with FastAPI, never directly with the workbook.
3. Staff should see clear forms, patient search, previous visits, availability, and appointments.
4. Raw workbook structure should not be the main user experience.
5. Show save success only after the backend confirms the write.
6. Make errors understandable and actionable.
7. Log out or expire sessions safely.
8. Staff permissions must be explicit.

## 6. WhatsApp Rules for the Later Phase

1. Use the official WhatsApp Business Platform or an approved provider.
2. Do not build the product by automating a personal WhatsApp account.
3. WhatsApp must call existing backend services.
4. WhatsApp must not write directly to Excel.
5. Record opt-in and opt-out status.
6. Respect message templates, service windows, pricing, and provider policy.
7. Provide clear human escalation.
8. Treat webhook events as repeatable and process them idempotently.
9. Do not add WhatsApp until the staff website workflow is stable.

## 7. Safety Rules

1. The product is administrative.
2. It must not diagnose, prescribe, or perform emergency triage.
3. A request containing a clinical question must be referred to clinic staff.
4. The system must not pretend to be a dentist or clinician.
5. The system must disclose uncertainty and provide human help.

## 8. Engineering Rules

1. Use FastAPI with typed request and response schemas.
2. Keep workbook access in a repository module.
3. Keep booking and availability rules in domain services.
4. Use database or file migrations where appropriate.
5. Write tests for duplicate patients, conflicts, concurrent booking, failed writes, and permissions.
6. Keep future Supabase integration behind a storage interface.
7. Do not introduce microservices before there is a demonstrated need.
8. Keep secrets outside source code and workbooks.
9. Do not claim work is complete without validation.
10. Report limitations honestly.

## 9. Agent Documentation Rules

1. Read all project Markdown files before a material change.
2. Update `PRD.md` when product scope or requirements change.
3. Update `Architecture.md` when components, storage, data flow, or deployment change.
4. Update `Design.md` when workflows, screens, language, or accessibility change.
5. Update `phases.md` when implementation order or release gates change.
6. Update `memory.md` when a decision, risk, current stage, or unresolved question changes.
7. Update `agent.md` only when the project operating process changes.
8. Keep all documents consistent; do not leave the old WhatsApp-first assumptions in one file after the scope changes.

## 10. Definition of Done

A feature is done only when its requirement is clear, its scope is approved, its data impact is understood, its permissions are implemented, its failure path is handled, relevant tests pass, the user flow is reviewed, and the affected project documents are updated.
