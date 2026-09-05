# Project Memory

## Purpose

This file stores durable project context, approved decisions, current stage, evidence, risks, and unresolved questions. It is not a temporary task log.

## Current Product Identity

**Working name:** DentalFlow

**Domain:** Dentist-clinic staff operations.

**First product:** Staff website for patient registration, previous-visit summaries, dentist availability, and appointment-range booking.

**Later product input:** Patient requests through WhatsApp.

**Initial storage:** One structured Excel workbook per clinic.

**Deferred storage:** Supabase or another managed PostgreSQL system after workflow validation.

## Clarified Scope

For this project, “hospital” means a dentist clinic. The first customer is a clinic with mostly one dentist, with support for two or three dentists when required.

The clinic staff will use the website. The Excel workbook is the temporary pilot data store and can be inspected or downloaded by staff when necessary. The website, not direct workbook editing, is the normal operating interface.

The initial patient data includes registration details such as name, age or date of birth, phone number, optional email, stable patient identifier, and structured summaries of previous visits. The system also stores dentist availability and appointment ranges.

## Approved Product Order

1. Build the staff website.
2. Validate registration and appointment workflows with a dentist clinic.
3. Use Excel temporarily for controlled iterations.
4. Improve scheduling reliability and staff usability.
5. Migrate to Supabase only when concurrency, reliability, backups, or scale justify it.
6. Add WhatsApp as a patient-input channel using the same backend services.

## Technical Decisions

- FastAPI is the initial backend.
- The website communicates with FastAPI, never directly with Excel.
- The workbook repository is the only writer to the Excel file.
- Workbook writes use locking, validation, backups, and atomic replacement.
- Stable identifiers must be used from the beginning to make migration possible.
- Appointment availability and booking are deterministic backend services.
- WhatsApp, when added, must call the same services as the website.
- Supabase is not required for the first controlled iteration.
- The first architecture is a modular monolith.

## Data Boundaries

The initial product must not become a complete electronic medical record. Previous visits should be concise, structured summaries. New fields require a clear purpose and review of privacy implications.

Passwords and API secrets must never be stored in the workbook. Real patient data must not be used in development or test environments.

## Current Stage

The project is in the revised planning stage. The next implementation step is to define the first dental-clinic workflow and build the staff website prototype before adding WhatsApp.

## Main Risks

1. Excel is not a durable multi-user production database.
2. Workbook corruption or concurrent writes could damage clinic records.
3. Cloud deployments may use ephemeral storage unless persistent storage is configured.
4. Staff may need more scheduling flexibility than fixed ranges provide.
5. Duplicate patient records may be created without a review workflow.
6. Previous-visit information may become more clinical and sensitive than initially planned.
7. WhatsApp may be added before the internal workflow is stable.
8. Supabase migration may be delayed if identifiers and workbook columns are inconsistent.

## Unresolved Questions

- Which dental clinic will be the first design partner?
- Which country and privacy requirements apply?
- Are appointment ranges fixed or generated from duration rules?
- How should existing patients be matched safely?
- What exact previous-visit summary does the clinic need?
- Will the pilot run locally or on persistent hosted storage?
- When is the clinic ready to migrate from Excel to Supabase?
- Which WhatsApp provider or Meta Cloud API path will be used later?

## Evidence Standard

Claims about WhatsApp capabilities, pricing, policies, data protection, or provider limits must be checked against current authoritative documentation before implementation or commercial promises.

## Change History

| Change | Result |
|---|---|
| Initial planning | Product originally considered WhatsApp-first clinic automation |
| Revised scope | Product changed to dentist-clinic website first, Excel pilot storage, WhatsApp later, Supabase deferred |
