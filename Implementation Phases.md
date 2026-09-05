# Implementation Phases

## Operating Principle

Build the smallest reliable product that can prove a clinic will use and pay for the workflow. Do not build a broad platform before validating one repeated operational problem.

## Phase 0: Product Discovery

**Objective:** Choose a narrow market and verify that the problem is real.

**Activities:**

- Choose one specialty and geography.
- Interview clinic owners and receptionists.
- Observe current booking and cancellation workflows.
- Measure message volume, response time, no-shows, and cancellations.
- Identify the person who can approve a purchase.
- Define the pilot success metric.

**Exit gate:** At least three clinics agree to pilot, and at least one expresses willingness to pay if the measured problem improves.

## Phase 1: Concierge Prototype

**Objective:** Test the workflow before investing in a complete system.

**Activities:**

- Create a clickable conversation prototype.
- Simulate doctor and slot selection.
- Manually support unusual requests behind the scenes.
- Test the language, flow length, and human handoff.
- Record real objections from clinics and patients.

**Exit gate:** Patients can understand the flow, and receptionists agree that it solves repetitive work rather than creating more work.

## Phase 2: Technical Foundation

**Objective:** Build a reliable backend foundation.

**Activities:**

- Create the FastAPI application.
- Add PostgreSQL and migrations.
- Implement clinic, doctor, service, schedule, and appointment models.
- Implement authentication and tenant isolation.
- Implement deterministic availability and booking rules.
- Add automated tests for conflicts and permissions.

**Exit gate:** The backend can create, cancel, and reschedule appointments correctly under concurrent requests.

## Phase 3: WhatsApp MVP

**Objective:** Connect a test WhatsApp account and complete the core patient journey.

**Activities:**

- Configure Meta or an approved provider.
- Implement verified webhook receipt.
- Add idempotent message processing.
- Add doctor, service, date, and slot selection.
- Add booking confirmation.
- Add cancellation and rescheduling.
- Add human handoff.
- Add delivery-status tracking.

**Exit gate:** The full test flow works repeatedly without duplicate bookings or lost conversations.

## Phase 4: Staff Dashboard

**Objective:** Give receptionists operational control.

**Activities:**

- Add daily calendar.
- Add doctor and status filters.
- Add manual appointment controls.
- Add schedule and leave management.
- Add conversation queue.
- Add staff takeover.
- Add basic metrics.

**Exit gate:** A receptionist can operate the pilot without database access or developer assistance.

## Phase 5: Pilot and Reliability

**Objective:** Prove value with real clinics under controlled conditions.

**Activities:**

- Onboard three pilot clinics.
- Use clinic-approved configuration and consent language.
- Monitor webhook, job, and message failures.
- Measure automation rate, staff time saved, no-shows, and recovered cancellations.
- Review patient confusion and staff complaints weekly.
- Fix reliability problems before adding features.

**Exit gate:** At least one clinic pays, clinics continue using the system, and the product demonstrates measurable operational value.

## Phase 6: Commercial Readiness

**Objective:** Make the product repeatably deployable and supportable.

**Activities:**

- Add clinic onboarding flow.
- Add subscription and usage tracking.
- Document support procedures.
- Add backup and restore verification.
- Add audit review and security checks.
- Add message-cost accounting.
- Add product analytics.
- Create a repeatable sales demo and case study.

**Exit gate:** A new clinic can be onboarded with a documented process and without custom engineering for every setup.

## Phase 7: Controlled Expansion

**Objective:** Add features only when supported by evidence.

**Priority order:**

1. Waitlist and cancellation recovery.
2. Follow-up reminders.
3. Local-language support.
4. Payment links.
5. Multi-location support.
6. Consultation notes.
7. Integrations with billing, laboratory, or practice-management tools.
8. Constrained AI assistance for staff.

Do not expand into clinical decision support, prescriptions, or medical records without a separate product, safety, legal, and security review.

## Decision Gates

| Gate | Continue when | Stop or pivot when |
|---|---|---|
| Discovery | Clinics repeat the same painful problem | Pain is vague or non-urgent |
| Prototype | Users understand and complete the flow | Users need constant explanation |
| MVP | Booking is reliable and staff can control it | Double bookings or lost conversations occur |
| Pilot | Clinics use it repeatedly and measure value | Clinics praise it but do not use it |
| Commercial | At least one customer pays and onboarding is repeatable | Every customer requires custom work |
| Expansion | Existing customers request the same next capability | Features are driven only by speculation |

## Release Discipline

Every phase must produce a short decision record containing the result, evidence, unresolved risks, and the next approved step. Never move forward only because development work has already been done.
