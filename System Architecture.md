# System Architecture

## 1. Architecture Goal

The system must reliably convert WhatsApp conversations into valid clinic appointments while keeping clinic staff in control and protecting clinic and patient data.

The first implementation should be a **modular monolith**. It should have clear internal modules but remain one deployable backend. Microservices are not justified until scale, team size, or operational boundaries require them.

## 2. High-Level Architecture

```text
Patient WhatsApp
      |
      v
Meta WhatsApp Business Platform
      |
      | verified webhook
      v
FastAPI Application
  |       |       |       |
  |       |       |       +--> Human handoff queue
  |       |       +----------> Reminder and job worker
  |       +------------------> PostgreSQL
  +--------------------------> Staff dashboard API
                                  |
                                  v
                         Clinic staff web dashboard
```

## 3. Main Components

### 3.1 WhatsApp adapter

The WhatsApp adapter handles provider authentication, outbound messages, inbound webhook payloads, message templates, interactive replies, delivery statuses, retries, and provider-specific identifiers.

Provider-specific code must stay behind an internal interface. The business logic should not directly depend on raw Meta payloads.

### 3.2 Webhook receiver

The webhook endpoint must verify the provider challenge, authenticate webhook requests where applicable, validate payload structure, acknowledge quickly, and enqueue processing rather than performing long operations inside the HTTP request.

Webhook processing must be idempotent. The same event may be delivered more than once. Store provider event identifiers and do not process an already completed event again.

### 3.3 Conversation engine

The conversation engine manages the patient’s current flow, such as choosing a doctor, selecting a service, choosing a date, selecting a slot, confirming, cancelling, or rescheduling.

The engine should use explicit states and transitions. It should not rely on hidden model memory or unstructured text alone.

### 3.4 Booking domain service

The booking service owns availability, slot generation, temporary holds, appointment creation, cancellation, rescheduling, conflict detection, and status history.

This service must be the only authority allowed to create or modify appointments. The chatbot and staff dashboard must call the same domain service.

### 3.5 Staff dashboard API

The dashboard API exposes authenticated operations for calendars, doctors, schedules, appointments, waitlists, conversations, staff takeover, and reports.

Every query must be scoped to the authenticated clinic. Platform administrators require explicit elevated permissions and audit logging.

### 3.6 Background job worker

The worker handles reminders, retryable message sends, waitlist notifications, daily summaries, cleanup tasks, and scheduled follow-ups.

Jobs must have unique keys, retry limits, backoff, status, and failure visibility. A reminder must not be sent twice because a worker restarted.

### 3.7 PostgreSQL

PostgreSQL is the source of truth for clinic configuration, schedules, appointments, conversations, consent, and audit history.

Use migrations for every schema change. Do not modify production tables manually.

## 4. Suggested Backend Modules

```text
app/
  main.py
  config.py
  database.py
  dependencies.py
  api/
    auth.py
    clinics.py
    doctors.py
    schedules.py
    appointments.py
    conversations.py
    whatsapp.py
    dashboard.py
  domain/
    booking.py
    availability.py
    conversations.py
    permissions.py
    reminders.py
  integrations/
    whatsapp/
      client.py
      schemas.py
      webhook.py
      templates.py
    email/
  models/
  schemas/
  repositories/
  workers/
  security/
  observability/
  tests/
```

## 5. Core Data Model

The initial relational model should include:

- `clinics`
- `users`
- `clinic_memberships`
- `roles`
- `doctors`
- `patients`
- `appointment_types`
- `working_hours`
- `doctor_leaves`
- `availability_rules`
- `appointments`
- `appointment_status_history`
- `waitlist_entries`
- `conversations`
- `messages`
- `webhook_events`
- `message_templates`
- `reminder_jobs`
- `consent_records`
- `audit_logs`

All tenant-owned tables should contain `clinic_id`. Use foreign keys, unique constraints, indexes for common queries, and timestamps stored in UTC with the clinic timezone stored separately.

## 6. Appointment Consistency

Appointment creation must be transactional. The service must re-check availability at the moment of creation, not only when the slot is displayed.

A safe flow is:

1. Start a database transaction.
2. Lock or reserve the relevant schedule range.
3. Re-check doctor, service, leave, and existing appointments.
4. Create the appointment with a unique business key.
5. Write status history and audit log.
6. Commit.
7. Send confirmation asynchronously.

If confirmation fails after the appointment commits, the appointment remains visible and the message job is retried. Do not silently delete the appointment.

## 7. Security Architecture

The system must use HTTPS, secure secret storage, short-lived authenticated sessions, role-based authorization, tenant checks, rate limits, validated inputs, safe database queries, controlled error responses, and encrypted backups.

Sensitive content should not be written to ordinary logs. Logs should use identifiers, event types, timestamps, and operational metadata instead.

Use separate development, staging, and production environments. Never use real patient data in development or testing.

## 8. Integration Boundaries

The application should isolate external services behind adapters:

| Integration | Internal responsibility |
|---|---|
| WhatsApp provider | Send/receive messages and statuses |
| Email provider | Optional staff notifications |
| Payment provider | Optional payment collection |
| AI provider | Optional intent extraction or FAQ assistance |
| Object storage | Optional private documents |
| Monitoring provider | Errors, metrics, and alerts |

If the WhatsApp provider changes, the booking domain should not change.

## 9. AI Boundary

AI may classify an incoming message into a known administrative intent or draft a response from approved clinic content. AI may not create a booking without domain validation, override permissions, diagnose, prescribe, provide emergency triage, or modify clinic rules.

The safe sequence is:

```text
Message -> intent extraction -> validated command -> domain rules -> database action -> response
```

## 10. Deployment Environments

### Local

Docker Compose may run FastAPI, PostgreSQL, Redis, and a local webhook tunnel.

### Staging

Use a separate database, test WhatsApp number, test credentials, fake clinic data, automated migrations, and production-like configuration.

### Production

Use managed PostgreSQL, private secrets, HTTPS, backups, monitoring, job workers, deployment rollback, database migration checks, and documented incident response.

## 11. Reliability Requirements

The system should provide:

- Health-check endpoints.
- Structured logs.
- Error tracking.
- Webhook replay support.
- Safe retry and idempotency.
- Queue monitoring.
- Backup verification.
- Database migration rollback strategy.
- Manual operational controls.
- Clear failure messages to staff.

## 12. Architecture Decisions

| Decision | Choice | Reason |
|---|---|---|
| Backend | FastAPI | Efficient API development and strong typing through Pydantic |
| Database | PostgreSQL | Reliable relational transactions and scheduling data integrity |
| Initial shape | Modular monolith | Lower operational complexity for a small team |
| Patient channel | WhatsApp | Low learning friction and existing patient familiarity |
| Staff interface | Web dashboard | Better control for calendars, exceptions, and reporting |
| Background work | Redis-backed worker | Reliable reminders and retries |
| AI | Optional and constrained | Avoids unsafe autonomous clinical behavior |
| Time handling | UTC plus clinic timezone | Prevents cross-timezone scheduling errors |

## 13. Architecture Risks

The highest-risk areas are WhatsApp account onboarding, policy and pricing changes, provider outages, appointment concurrency, clinic-specific scheduling rules, patient-data handling, and staff adoption.

Mitigate these risks with a test account, provider abstraction, automated concurrency tests, narrow initial scope, explicit human handoff, and real-clinic pilots before expansion.
