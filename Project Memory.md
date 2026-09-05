# Project Memory

## Purpose

This file stores durable project context. It should contain stable facts, approved decisions, evidence, risks, and unresolved questions. It is not a task log and should not contain temporary brainstorming.

## Product Identity

**Working name:** ClinicFlow WhatsApp

**Category:** WhatsApp-first outpatient clinic appointment automation.

**Primary interface:** WhatsApp for patients; web dashboard for clinic staff.

**Initial backend direction:** FastAPI, PostgreSQL, background worker, and official WhatsApp Business Platform integration.

**Initial architecture:** Modular monolith.

## Approved Product Direction

The project will begin with administrative workflows, especially booking, confirmation, cancellation, rescheduling, reminders, waitlist recovery, and human handoff.

The product will not initially provide diagnosis, clinical triage, prescriptions, medical records, hospital operations, or a separate patient mobile application.

## Target Customer

The initial target is a small private outpatient specialty clinic with approximately two to eight doctors, several staff members, significant WhatsApp appointment traffic, and measurable scheduling or no-show problems.

The first launch must choose one specialty and one geography rather than targeting all healthcare providers.

## Technical Decisions

- FastAPI is the initial backend framework.
- PostgreSQL is the source of truth.
- Appointment creation is transactional and deterministic.
- WhatsApp provider payloads are isolated behind an adapter.
- Background jobs handle reminders and retries.
- A staff dashboard is needed for real clinic operations, but it can be delayed during the earliest prototype.
- AI is optional and constrained to administrative intent understanding or approved FAQ assistance.
- AI cannot decide availability, bypass permissions, diagnose, prescribe, or modify clinic rules.

## Business Decisions

The product should be sold as a digital administrative receptionist, not as a generic chatbot or AI doctor.

The primary value claims must be measurable: staff time saved, increased confirmation rate, reduced no-shows, faster rescheduling, or recovered cancelled slots.

A paid pilot is stronger validation than positive feedback alone.

## Safety and Privacy Decisions

- Use official WhatsApp integration only.
- Record opt-in and opt-out status.
- Provide human escalation.
- Do not use real patient data during development.
- Enforce clinic tenant isolation.
- Do not claim regulatory compliance without formal review.
- Keep sensitive message content out of ordinary logs.

## Current Stage

The project is at the planning and validation stage. The next practical milestone is to choose the first specialty and conduct structured interviews with clinics before building a broad platform.

## Known Risks

1. Clinics may like the demo but refuse to pay.
2. WhatsApp policies and pricing may change.
3. Clinic-specific scheduling rules may be more complex than expected.
4. Staff may distrust automation if human takeover is difficult.
5. Patient data may create legal and security obligations.
6. Provider onboarding may create account-ownership and migration friction.
7. Free hosting may not provide production reliability or backups.

## Unresolved Questions

- Which country and regulatory environment is the first launch target?
- Which specialty has the strongest combination of message volume and scheduling pain?
- Will the product connect directly to Meta Cloud API or use an approved provider for the pilot?
- What is the exact pricing model?
- What data is necessary for the first booking workflow?
- Does the first clinic require payment collection?
- What is the required patient verification method for changing an appointment?

## Evidence Standards

Claims about WhatsApp capability, pricing, policies, security, healthcare regulation, or provider limits must be checked against current authoritative documentation before implementation or customer commitments.

## Change History

| Date | Change |
|---|---|
| Initial | Created product direction and operating baseline |
