# Product Design Specification

## 1. Design Objective

The first experience is for dental-clinic staff, not patients. The website must help a receptionist complete registration and booking tasks accurately while working under time pressure.

Patients will use WhatsApp only in a later phase. The future WhatsApp flow should mirror the same internal concepts but should not determine the first website design.

## 2. Primary Staff Workflow

The main workflow should be:

```text
Find or register patient
        -> Review previous visits
        -> Select dentist
        -> Check dentist availability
        -> Select appointment range
        -> Confirm details
        -> Save appointment
        -> Show updated schedule
```

The workflow should be possible from one clear patient profile and appointment context without forcing staff to navigate through unrelated screens.

## 3. Main Website Screens

### Staff login

The login screen should be simple and should not expose operational data before authentication.

### Today dashboard

The first screen after login should show today’s appointments, dentists working today, unconfirmed items, and actions requiring staff attention.

### Patient search

Staff should be able to search by patient identifier, name, or phone number. Search results must display enough information to distinguish patients without exposing unnecessary details.

### Patient profile

The profile should show registration information, previous visit summaries, upcoming appointments, and actions to book or modify an appointment.

### Registration form

The form should collect only the approved fields. Required and optional fields must be visibly different. Duplicate-looking patients should trigger a review step rather than silently creating another record.

### Dentist availability

Staff should see which dentist is available, unavailable, on leave, or already booked. If two or three dentists are available, the page should make the choices explicit.

### Appointment booking

The booking page should show patient, dentist, date, start time, end time, and appointment status before the final confirmation.

### Schedule

The schedule should support a daily view first. It should show dentist, patient, appointment range, and status. A weekly view may be added after staff usage proves it is needed.

## 4. Design Principles

1. **Staff first:** Optimize for receptionists and clinic operations.
2. **One task at a time:** Avoid presenting every configuration option on one screen.
3. **Visible truth:** Show the current dentist availability and appointment status clearly.
4. **Safe confirmation:** Require confirmation before saving, cancelling, or rescheduling.
5. **Recoverable errors:** Explain what went wrong and how staff can continue.
6. **No silent changes:** Never substitute a dentist or appointment range without showing it.
7. **Data minimization:** Do not display clinical information where it is not needed.
8. **Excel is invisible to normal use:** Staff use the website; the workbook is a storage and export layer.

## 5. Registration UX

The registration form should be divided into small sections:

- Identity: name and patient identifier.
- Contact: phone number and optional email.
- Demographics: age or date of birth.
- Clinic-required acknowledgement or consent.
- Save and continue to appointment.

After saving, show a clear confirmation with the patient identifier. If a possible duplicate is found, show the matching records and ask staff to choose an existing patient or confirm a new record.

## 6. Previous Visit UX

Previous visits should be displayed as a chronological list or table with date, dentist, visit type, and short staff-entered summary.

The first version should not display an unstructured mass of sensitive notes. If a visit summary is needed, keep it short, structured, and accessible only to authorized staff.

## 7. Dentist and Availability UX

The availability screen should show:

- Dentist name.
- Working status.
- Working hours.
- Leave or blocked periods.
- Existing appointments.
- Available ranges.

When a staff member selects a dentist, the system should show the chosen dentist prominently. If “any available dentist” is allowed, the final confirmation must still show which dentist was assigned.

## 8. Appointment Confirmation

Before saving, show a confirmation card:

```text
Patient: [name]
Dentist: [dentist]
Date: [date]
Time: [start]–[end]
Status: Ready to confirm
```

The final action should be explicit, such as `Confirm appointment`. After saving, the interface should show the appointment identifier and status.

## 9. Error States

| Situation | Design response |
|---|---|
| Patient not found | Offer registration without losing the current intent |
| Possible duplicate | Show matching records and require staff confirmation |
| Dentist unavailable | Explain why and show valid alternatives |
| Range already booked | Refresh availability and ask staff to choose again |
| Excel write failed | Do not show success; preserve entered information and provide retry/support action |
| Workbook locked | Tell staff that another operation is in progress; retry safely |
| Unknown error | Show a safe message and create a staff or admin alert |

## 10. Visual Direction

Use a calm, professional interface suitable for a dental clinic. Prioritize readable typography, clear labels, high contrast, consistent spacing, restrained color, and obvious primary actions.

Appointment status must be communicated with text as well as color. Avoid excessive animations, decorative dashboards, and dense charts in the first version.

## 11. Later WhatsApp Design

WhatsApp should ask for one decision at a time:

1. New or existing patient.
2. Patient name and required registration details.
3. Preferred dentist or any available dentist.
4. Preferred date or appointment range.
5. Available options.
6. Confirmation.
7. Human-support option.

The WhatsApp flow must not expose the Excel workbook or internal identifiers unnecessarily. It should send structured information to the backend and show the patient an understandable confirmation.

## 12. Usability Testing

Test with real clinic staff using realistic tasks:

- Register a new patient.
- Find an existing patient.
- Review a previous visit.
- Identify the available dentist.
- Book a range.
- Cancel and reschedule.
- Recover from a failed write.
- Find today’s appointments.

A design is acceptable when staff can complete the core tasks accurately without developer explanation.
