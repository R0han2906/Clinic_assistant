# Project Rules

## 1. Purpose

These rules protect product quality, patient safety, data privacy, maintainability, and customer trust. They apply to product decisions, code, documentation, testing, and agent behavior.

## 2. Scope Rules

1. The first release is for outpatient appointment administration.
2. The first release must target one clear specialty and launch geography.
3. New features must explain which customer problem they solve.
4. Do not build a feature only because it sounds impressive.
5. Do not expand into hospital management, clinical records, prescriptions, or diagnosis without an explicit product decision and professional review.

## 3. Patient Safety Rules

1. The system must not diagnose.
2. The system must not prescribe or recommend medication.
3. The system must not make emergency or clinical triage decisions.
4. Unclear, urgent, sensitive, or medical questions must be escalated to a human.
5. Every automated flow must have a clear human-support path.
6. The bot must not imply that it is a doctor or that a response is medical advice.
7. The system must never hide uncertainty from the patient or clinic staff.

## 4. WhatsApp Rules

1. Use the official WhatsApp Business Platform or an approved provider.
2. Never automate a personal WhatsApp account.
3. Store the clinic’s provider account identifiers securely.
4. Record patient opt-in and opt-out status.
5. Respect provider message windows, template rules, pricing, rate limits, and policy changes.
6. Do not send unsolicited messages.
7. Do not repeatedly message a patient after an opt-out.
8. Keep provider-specific payloads inside an integration adapter.
9. Treat webhook events as repeatable and process them idempotently.
10. Do not assume that a message was delivered merely because an API call succeeded.

## 5. Data and Privacy Rules

1. Collect the minimum data required for the defined workflow.
2. Do not use real patient data in development.
3. Every clinic-owned record must be tenant-scoped.
4. Every authenticated request must check clinic membership and permissions.
5. Do not place sensitive patient content in ordinary logs.
6. Use encrypted transport and secure secret storage.
7. Define retention, export, deletion, and backup procedures before production.
8. Do not claim legal or regulatory compliance without a documented review.
9. Do not share one clinic’s data with another clinic.
10. Do not use patient data to train models without explicit legal, contractual, and consent review.

## 6. Scheduling Rules

1. PostgreSQL and the booking domain are the source of truth.
2. AI cannot decide whether a slot is available.
3. Availability must be checked again when an appointment is created.
4. Appointment creation must be transactional.
5. A successful booking must have an audit record.
6. Rescheduling must not release the old slot until the new slot is successfully secured.
7. Cancellation must create a status-history record.
8. All timestamps must be timezone-aware.
9. A reminder failure must not silently cancel an appointment.
10. Duplicate webhook events must not create duplicate appointments.

## 7. Engineering Rules

1. Prefer a modular monolith until scale clearly requires another architecture.
2. Use migrations for database changes.
3. Do not modify production data manually without an auditable procedure.
4. Add tests for every booking rule and security boundary.
5. Keep business logic independent from WhatsApp payload formats.
6. Use typed request and response schemas.
7. Validate external input.
8. Use idempotency keys for external events and operations where appropriate.
9. Fail visibly and safely.
10. Avoid premature abstractions and unnecessary dependencies.
11. Keep modules small enough to understand and test.
12. Document major decisions and their reasons.

## 8. Product Design Rules

1. Optimize for the receptionist’s busy working day.
2. Use plain language.
3. Keep patient messages short and actionable.
4. Use buttons or lists when they reduce typing.
5. Always show the selected doctor, date, time, and timezone before confirmation.
6. Make undo, cancel, and human help easy to find.
7. Never make staff depend on hidden automation.
8. Show status clearly: confirmed, pending, cancelled, rescheduled, no-show, or requires attention.
9. Design for failure, not only the happy path.
10. Do not confuse visual polish with operational value.

## 9. Agent Rules

1. Read `PRD.md`, `Architecture.md`, `rules.md`, `phases.md`, `Design.md`, and `memory.md` before making a material project decision.
2. Inspect the existing repository before creating or changing files.
3. Preserve existing behavior unless the request explicitly changes it.
4. Ask for clarification when a requirement changes scope, safety, data handling, or architecture materially.
5. State assumptions when proceeding without clarification.
6. Do not invent completed work, user feedback, test results, or regulatory approvals.
7. Update the appropriate documentation file after a material decision.
8. Never place temporary notes in permanent project memory.
9. Keep implementation changes traceable to a requirement or approved technical decision.
10. Run relevant tests or explain why they could not be run.
11. Report risks and unresolved questions honestly.
12. Never trade patient safety or data isolation for speed.

## 10. Definition of Done

A feature is done only when:

- Its requirement and scope are clear.
- Its design is consistent with the architecture.
- Permissions and tenant boundaries are implemented.
- Happy-path and failure-path tests exist.
- Logs and error handling are appropriate.
- Documentation is updated.
- The feature has been manually reviewed in a realistic workflow.
- Known limitations are recorded.
