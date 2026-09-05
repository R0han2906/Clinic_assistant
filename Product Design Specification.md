# Product Design Specification

## 1. Design Objective

The product should feel simple for patients and dependable for clinic staff. It should reduce decisions, typing, and uncertainty during appointment administration.

The design must prioritize clarity and recovery over visual novelty.

## 2. Experience Model

The product has two connected experiences:

| Experience | Design goal |
|---|---|
| Patient WhatsApp conversation | Complete a common administrative task with minimal effort |
| Staff dashboard | Understand and control the clinic’s operational state quickly |

The patient should not need to understand the internal system. The staff member must be able to understand exactly what happened.

## 3. Patient Conversation Principles

1. Start with a clear welcome and the clinic identity.
2. Present a small number of choices.
3. Prefer buttons and lists over free typing.
4. Keep one question per step.
5. Confirm important details before committing.
6. Show doctor, service, date, time, and timezone clearly.
7. Offer back, restart, cancel, and human help.
8. Never make a patient repeat information unnecessarily.
9. Use plain language and the clinic’s approved terminology.
10. Tell the patient when the request has been sent to a human.

## 4. Booking Conversation

Recommended flow:

```text
Welcome
  -> Choose service
  -> Choose doctor or first available
  -> Choose date
  -> Choose slot
  -> Confirm details
  -> Create appointment
  -> Send confirmation
```

The system must not claim that an appointment is confirmed until the transaction succeeds.

If the selected slot becomes unavailable, explain the conflict and present fresh options. Do not silently substitute another time.

## 5. Cancellation and Rescheduling

Cancellation must display the appointment being cancelled and ask for confirmation.

Rescheduling should show available alternatives first. The old appointment must remain intact until the new slot is successfully booked.

After a cancellation, the patient should receive a clear status message. If the clinic uses a waitlist, the system may begin recovery according to configured rules.

## 6. Human Handoff

The handoff message should be short and honest:

> I’m transferring this conversation to the clinic team. A staff member will respond here. This chat is for appointments and clinic administration, not emergencies.

The staff queue should show:

- Patient identifier.
- Conversation start time.
- Last patient message.
- Reason for handoff.
- Assigned staff member.
- Current status.
- Response-time indicator.

## 7. Staff Dashboard Structure

The minimum dashboard navigation should be:

- Today.
- Calendar.
- Appointments.
- Conversations.
- Doctors and schedules.
- Waitlist.
- Reports.
- Settings.

The default landing screen should answer three questions immediately:

1. What is happening today?
2. What requires staff attention?
3. What could cause lost capacity or patient frustration?

## 8. Calendar Design

The calendar should support day and agenda views first. Week and month views can come later.

Each appointment should display:

- Time.
- Patient name or safe identifier.
- Doctor.
- Service.
- Status.
- Source, such as WhatsApp or manual.
- Attention indicator when action is required.

Use consistent status labels:

- Pending.
- Confirmed.
- Cancelled.
- Rescheduled.
- Completed.
- No-show.
- Requires attention.

Never communicate status only through color. Use text and accessible icons as well.

## 9. Visual Direction

The visual style should be calm, professional, and operational.

Recommended qualities:

- High contrast.
- Neutral background.
- One primary action color.
- Clear status colors with text labels.
- Moderate spacing.
- Large readable type.
- Few decorative elements.
- No excessive gradients, animation, or dashboard clutter.

The dashboard should look like a dependable clinic operations tool, not a social media application.

## 10. Accessibility

The dashboard must support keyboard navigation, visible focus states, readable contrast, clear form labels, error messages near the relevant field, and layouts that work on laptop and tablet screens.

WhatsApp messages should avoid excessive text, ambiguous instructions, and critical information conveyed through emoji or color alone.

## 11. Error States

Every important action needs an explicit error state.

Examples:

| Situation | User-facing behavior |
|---|---|
| Slot taken | Explain that it is no longer available and show alternatives |
| WhatsApp send failure | Keep the appointment state visible and alert staff |
| Webhook delay | Avoid duplicate response and process safely when received |
| Clinic closed | Show next available hours or human-support option |
| Unknown request | Ask a clarifying question or hand off |
| Backend failure | Give a safe message and place the issue in staff attention queue |

## 12. Content Rules

Use short sentences, direct verbs, and specific labels. Avoid technical language such as “intent classification,” “webhook,” or “API” in patient messages.

Do not say “Done” when the system has only started a request. Use accurate states such as “Checking availability,” “Appointment confirmed,” or “Waiting for clinic staff.”

## 13. Design Validation

Test designs with real receptionists before polishing them. Ask them to complete realistic tasks without coaching:

- Find today’s unconfirmed appointments.
- Block a doctor’s leave.
- Reschedule a patient.
- Take over a conversation.
- Find a cancelled slot.
- Identify a failed reminder.

A design is successful when staff can complete these tasks accurately under time pressure.
