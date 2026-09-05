# Prompt: Build the Patient WhatsApp Bot Frontend Simulation

## Role

You are a senior frontend engineer and product designer. Build a polished frontend-only simulation of a patient interacting with a future dental-clinic WhatsApp appointment bot.

This is a prototype for validating the patient conversation and user experience. It is not the real WhatsApp integration and must not require a WhatsApp number, Meta account, backend, Supabase, database, API key, or external service.

Think carefully before coding. First inspect the existing project structure and technology stack. Follow the project’s existing conventions instead of replacing the setup unnecessarily.

## Product Context

The product is for a dental clinic. Clinic staff will eventually manage patients, previous visits, dentists, availability, and appointments through a separate staff website.

This task covers only the **patient-side bot simulation frontend**.

The simulation should represent what a patient might experience later through WhatsApp. It should show realistic messages, buttons, selectable lists, appointment options, confirmation, and human-help behavior.

The frontend must use mocked local data and local state only.

## Strict Scope

Build only:

- A patient-facing chat-style interface.
- A simulated dental-clinic bot conversation.
- Mock dentist data.
- Mock appointment availability.
- Mock patient registration data.
- Mock booking confirmation.
- Mock cancellation or restart behavior.
- A human-support handoff state.
- Reset and restart controls for testing.

Do not build:

- Real WhatsApp integration.
- WhatsApp Cloud API.
- Meta login or developer setup.
- Backend endpoints.
- FastAPI code.
- Supabase.
- PostgreSQL.
- Excel integration.
- Real authentication.
- Real patient records.
- Real message sending.
- Payments.
- Diagnosis, medical advice, emergency triage, or prescriptions.
- A staff dashboard.
- A full clinic-management system.

## Main User Journey

The prototype must support this complete simulated flow:

```text
Welcome
  -> Choose appointment action
  -> New or existing patient
  -> Enter or select patient details
  -> Select dentist or any available dentist
  -> Select preferred date
  -> Select appointment range
  -> Review appointment details
  -> Confirm appointment
  -> Show booking confirmation
```

The user should also be able to:

- Go back one step.
- Restart the conversation.
- Cancel the current flow.
- Ask for human help.
- See a clear message when no slot is available.
- Try another dentist or date.

## Suggested Conversation

Use realistic but clearly simulated content.

### Welcome

```text
Hello. Welcome to DentalFlow Clinic.
I can help you request a dental appointment.
What would you like to do?
```

Buttons:

- Book an appointment.
- Change an appointment.
- Cancel an appointment.
- Talk to clinic staff.

### Patient type

```text
Are you a new patient or have you visited this clinic before?
```

Buttons:

- New patient.
- Existing patient.

### New-patient details

Collect only prototype fields:

- Full name.
- Age or date of birth.
- Phone number.
- Optional short appointment reason.

Do not collect unnecessary medical information.

### Dentist selection

```text
Which dentist would you prefer?
```

Mock options may include:

- Dr. Ananya Rao.
- Dr. Rahul Mehta.
- Any available dentist.

The interface must clearly show whether a dentist is available for the selected date.

### Date selection

Use a small set of mock dates relative to the current date or clearly labeled demo dates. Do not pretend that the data is live.

### Appointment range selection

Show realistic appointment ranges such as:

- 10:00 AM – 10:30 AM.
- 11:30 AM – 12:00 PM.
- 4:00 PM – 4:30 PM.

Each option should show its availability state. Unavailable ranges must be disabled or clearly marked.

### Review

Before confirmation, show:

```text
Please review your request:

Patient: [name]
Dentist: [dentist]
Date: [date]
Time: [start] – [end]

Would you like to confirm this appointment request?
```

Buttons:

- Confirm.
- Change details.
- Cancel.

### Confirmation

After the user confirms, show:

```text
Your appointment request has been recorded in this simulation.

Dentist: [dentist]
Date: [date]
Time: [start] – [end]
Reference: DEMO-XXXXXX

The clinic team would confirm the final appointment in the real system.
```

The wording must clearly say that this is a simulation and not a real booking.

### Human handoff

Show:

```text
A clinic staff member would take over this conversation here.
This prototype does not send real messages.
```

Provide a restart button.

## UI Requirements

Create a chat-style screen that visually resembles a modern messaging experience without copying WhatsApp branding, logos, or proprietary assets.

The interface should include:

- Clinic header.
- Clinic name and simulated online status.
- Bot messages on the left.
- Patient messages on the right.
- Timestamps or step indicators.
- Buttons and selectable cards.
- Text input only where needed.
- Scrollable conversation area.
- Sticky action area for current choices.
- Restart or reset control.
- Clear simulation label.

The design should be calm, professional, and appropriate for a dental clinic. Avoid excessive decoration, gradients, animations, or unnecessary dashboards.

## Interaction Requirements

The conversation must be implemented as a finite state machine or an equally clear state-based structure. Do not scatter unrelated boolean conditions across the UI.

Suggested states:

- `welcome`
- `select_action`
- `select_patient_type`
- `collect_name`
- `collect_age`
- `collect_phone`
- `collect_reason`
- `select_dentist`
- `select_date`
- `select_time_range`
- `review`
- `confirmed`
- `human_handoff`
- `cancelled`
- `no_availability`

The UI must preserve the conversation history while the user progresses.

Buttons must update the chat naturally by adding the patient’s selection as a patient message and then displaying the next bot message.

Validation must be clear. For example:

- Name cannot be empty.
- Age must be reasonable or use a date-of-birth field.
- Phone number must have a basic valid format.
- A dentist or appointment range must be selected before continuing.

## Mock Data

Keep all mock data in one clearly named file or module. Example structure:

```ts
const mockDentists = [
  {
    id: "dentist-1",
    name: "Dr. Ananya Rao",
    specialty: "General Dentistry",
  },
  {
    id: "dentist-2",
    name: "Dr. Rahul Mehta",
    specialty: "Restorative Dentistry",
  },
];
```

Use stable mock identifiers. Do not create random behavior that makes the flow difficult to test.

The booking reference may be generated for visual realism, but it must be labeled as a demo reference.

## Responsive Design

The interface must work on:

- Desktop browser.
- Tablet.
- Mobile-width browser.

On mobile width, the chat should occupy the available viewport without horizontal scrolling. On desktop, keep the chat at a comfortable readable width rather than stretching it across the entire screen.

## Accessibility

Use semantic buttons and form labels. Ensure keyboard navigation, visible focus states, readable contrast, accessible error messages, and screen-reader-friendly labels.

Do not rely on color alone to communicate availability or status.

## Technical Requirements

- Use the existing project framework and build commands.
- Keep the implementation frontend-only.
- Use local component state or a small frontend state module.
- Do not add a backend dependency.
- Do not add API keys.
- Do not call external services.
- Do not store data permanently.
- Refreshing the page may reset the simulation.
- Keep components modular and readable.
- Add basic tests if the project already supports frontend testing.

Suggested component structure:

```text
PatientBotSimulator
  ChatHeader
  ConversationView
  MessageBubble
  ChoiceButtons
  TextInputStep
  AppointmentOptionCard
  ReviewCard
  SimulationNotice
  RestartButton
```

The exact structure may differ if the existing project has established conventions.

## Product Boundary

This frontend simulates the patient input channel. It does not prove that a real appointment has been created.

Use language such as:

- “Demo request recorded.”
- “Simulated appointment request.”
- “In the real system, clinic staff would confirm availability.”

Do not use language such as:

- “Your real appointment is confirmed.”
- “Your dentist has been booked.”
- “Your medical issue has been assessed.”

## Acceptance Criteria

The implementation is complete when:

1. A user can complete the new-patient appointment-request flow from start to finish.
2. A user can select an existing-patient path using mocked data.
3. A user can select one of two dentists or any available dentist.
4. The interface shows available and unavailable appointment ranges.
5. The user can review and change details before confirmation.
6. The confirmation clearly identifies the flow as a simulation.
7. Restart, back, cancel, and human-handoff states work.
8. Invalid input produces understandable errors.
9. The interface works on desktop and mobile-width screens.
10. No backend, database, WhatsApp API, Supabase, or external service is required.
11. The code is organized so a future backend adapter can replace mock data without rewriting the conversation UI.
12. The project still builds successfully using its normal command.

## Final Deliverable

After implementation, report:

- Which files were changed.
- How to run the frontend.
- Which user flows were implemented.
- What is mocked.
- What is intentionally not implemented.
- Any known limitations.
- What backend interface the future WhatsApp integration will need.

Do not build the backend in this task. Do not connect WhatsApp in this task. Build a polished, testable, frontend-only simulation that can later connect to the real FastAPI services.
