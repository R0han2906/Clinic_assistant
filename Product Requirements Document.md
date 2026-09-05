# Product Requirements Document

## Product

**Working name:** ClinicFlow WhatsApp

**Product type:** WhatsApp-first clinic appointment and administrative automation system.

**Document status:** Initial product baseline

**Owner:** Product team

## 1. Product Summary

ClinicFlow WhatsApp helps small outpatient clinics manage appointment conversations through WhatsApp while giving clinic staff a simple operational dashboard.

Patients do not need to install a new application. They can ask administrative questions, view available appointment slots, book, confirm, cancel, and reschedule appointments. Staff can manage schedules, take over conversations, and monitor the clinic’s daily operations from the dashboard.

The product is an **administrative automation system**, not an AI doctor and not a replacement for clinical judgment.

## 2. Problem Statement

Small clinics often manage appointments through a mixture of phone calls, WhatsApp messages, paper notes, spreadsheets, and calendars. This creates repetitive receptionist work, slow replies, missed appointments, double bookings, and empty slots after cancellations.

The product should reduce repetitive appointment work without forcing patients to learn a new application or forcing clinics to replace their existing staff immediately.

## 3. Product Vision

> Make clinic appointment administration as simple as replying to a WhatsApp message while giving clinic staff reliable operational control.

## 4. Target Customer

The first target customer is a private outpatient specialty clinic with approximately two to eight doctors, several reception or support staff, recurring appointments, and meaningful WhatsApp traffic.

The initial product should focus on one specialty and one launch geography. Suitable early niches include dental, dermatology, physiotherapy, ophthalmology, fertility, and diagnostic consultation clinics.

Hospitals, emergency departments, pharmacies, and complex multi-location healthcare networks are out of scope for the first release.

## 5. Users

| User | Primary need |
|---|---|
| Patient | Book or manage an appointment quickly through WhatsApp |
| Receptionist | Manage schedules, correct bookings, and handle exceptions |
| Doctor | View relevant appointment information and availability |
| Clinic owner | Reduce workload, improve attendance, and monitor operations |
| Platform administrator | Configure clinics, support customers, and manage platform health |

## 6. Product Principles

1. **Administrative first:** The product manages scheduling and communication, not diagnosis.
2. **Human control:** Staff can take over any conversation or change any appointment.
3. **Deterministic booking:** The backend, not an AI model, decides whether an appointment is valid.
4. **Minimal patient friction:** Patients should use WhatsApp without installing another application.
5. **Operational clarity:** Staff should see the truth of the schedule in one place.
6. **Privacy by design:** Collect only what is needed and protect it by default.
7. **Measurable value:** Every feature should connect to saved time, fewer errors, better attendance, or recovered slots.
8. **Tenant isolation:** One clinic must never see another clinic’s data.

## 7. Goals for the MVP

The MVP must allow a patient to complete a basic appointment journey through WhatsApp and allow staff to control that journey from a simple dashboard.

### MVP goals

- Configure a clinic, doctors, services, and working hours.
- Show valid appointment slots.
- Prevent double booking.
- Book, confirm, cancel, and reschedule appointments.
- Send approved confirmation and reminder messages.
- Allow staff takeover and manual correction.
- Record consent, important actions, and message status.
- Measure automation rate, staff intervention, cancellations, and attendance.

### Non-goals for the MVP

- Clinical diagnosis or medical triage.
- AI-generated prescriptions.
- Patient medical-record management.
- Hospital, pharmacy, laboratory, or insurance workflows.
- A separate patient mobile app.
- Complex billing or claims processing.
- Fully autonomous treatment follow-up.

## 8. Core User Journeys

### Patient booking

The patient sends a WhatsApp message. The system identifies the clinic, presents configured options, checks real availability, temporarily holds the selected slot, confirms the appointment, and records the conversation.

### Patient rescheduling

The patient requests a change. The system verifies identity using the WhatsApp number and configured safeguards, shows valid alternatives, releases the original slot only after the new slot is confirmed, and sends an updated confirmation.

### Cancellation and waitlist recovery

A patient cancels. The system marks the appointment as cancelled, updates availability, and optionally offers the slot to eligible waitlisted patients according to clinic rules.

### Staff takeover

A patient asks an unclear, sensitive, urgent, or clinical question. The system stops automated replies, informs the patient that a staff member will respond, and places the conversation in a staff queue.

## 9. Functional Requirements

### Clinic configuration

The system must support clinic profile details, operating hours, holidays, doctors, services, appointment duration, buffers, leave periods, booking limits, cancellation rules, reminder timing, and support contacts.

### Appointment engine

The appointment engine must use timezone-aware timestamps, respect doctor availability, prevent conflicts, support configurable appointment durations, maintain appointment status history, and use transactional protection against concurrent bookings.

### WhatsApp integration

The system must receive incoming messages through verified webhooks, send permitted message types, support approved templates, track message status, store provider message identifiers, handle retries safely, and support human escalation.

### Staff dashboard

The dashboard must provide a calendar, appointment list, filtering by doctor and status, manual create/edit/cancel actions, schedule management, staff takeover, waitlist visibility, and basic operational metrics.

### Authentication and authorization

Users must authenticate securely. Access must be controlled by clinic membership and role. A receptionist, doctor, clinic owner, and platform administrator must not automatically have the same permissions.

### Auditability

The system must record who created, changed, cancelled, or manually approved an appointment. Logs must not expose unnecessary sensitive message content.

## 10. Non-Functional Requirements

| Area | MVP requirement |
|---|---|
| Availability | Reliable enough for pilot clinics; failures must be visible and recoverable |
| Security | HTTPS, secret management, access control, tenant isolation, and secure backups |
| Performance | Normal dashboard requests should usually return within two seconds under pilot load |
| Reliability | Idempotent webhook processing and safe retry behavior |
| Privacy | Minimum necessary collection, consent records, retention rules, and deletion/export process |
| Accessibility | Clear text, readable controls, keyboard-friendly dashboard basics |
| Observability | Structured logs, error tracking, health checks, and alerting |
| Maintainability | Modular backend, migrations, automated tests, and documented decisions |

## 11. Success Metrics

The MVP is successful only if it produces business value.

| Metric | Initial target |
|---|---|
| Pilot clinics | At least 3 |
| Paying pilot clinics | At least 1 |
| Booking completion rate | Measured and improving each iteration |
| Staff intervention rate | Decreasing for configured administrative flows |
| Staff time saved | Measured against the clinic baseline |
| Recovered cancelled slots | Measured during the pilot |
| No-show rate | Compared with the pre-pilot baseline |
| Critical booking errors | Zero tolerated in confirmed production workflows |
| Patient complaints | Reviewed weekly and resolved systematically |

## 12. Release Criteria

Do not release to real patient traffic until the system has passed booking conflict tests, webhook retry tests, permission tests, tenant-isolation tests, reminder tests, backup-restore tests, and human-handoff tests.

The clinic must approve its configuration, privacy notice, consent language, support process, and escalation process before activation.

## 13. Open Decisions

The following decisions must be made before production implementation:

- First specialty and launch geography.
- Direct Meta Cloud API or an approved provider.
- Whether patients can book without an existing patient record.
- Required patient verification for rescheduling and cancellation.
- Data retention period.
- Whether payments are included in the first commercial release.
- Clinic pricing model and message-cost pass-through.
- Whether the product is a single-clinic deployment or multi-tenant SaaS from the beginning.

## 14. Product Positioning

The product should be sold as a digital administrative receptionist, not as a chatbot and not as a medical AI system.

> Your patients continue using WhatsApp. ClinicFlow turns those conversations into confirmed appointments, reminders, rescheduling, cancellation recovery, and a clear schedule for your staff.
