# Product Requirements Document

## Product

**Working name:** DentalFlow

**Product type:** Dentist-clinic staff website with temporary Excel-based data storage and a later WhatsApp patient-input channel.

**Document status:** Revised product baseline

## 1. Important Scope Decision

The first product is **not** a WhatsApp bot and not a general hospital-management system.

The first product is a website used by a dental clinic’s staff to register patients, record previous visits, manage dentists and their availability, and book appointment ranges. WhatsApp will be integrated only after the website workflow is proven.

For this document, “hospital” means **dentist clinic**.

## 2. Product Summary

DentalFlow gives dental-clinic staff a simple internal website. Staff can register a patient, record basic patient details, record previous visit information, select the dentist requested by the patient, check whether the dentist is available, and book an appointment range.

During the initial iteration stage, the system stores data in a structured Excel workbook rather than Supabase. The website remains the main user interface for staff. The workbook is the temporary pilot data store and can also be inspected or exported by staff.

Later, patients will provide appointment input through WhatsApp. WhatsApp will send structured requests to the same backend workflow used by the staff website. It will not create a separate booking system.

## 3. Product Vision

> Give small dental clinics a simple, reliable way to register patients and manage dentist availability before introducing WhatsApp automation.

## 4. First Target Customer

The first customer is a single-location dental clinic with one dentist most of the time, with support for two or three dentists when necessary. The clinic has front-desk staff who need a clear way to register patients and schedule appointments.

The first release should not target hospitals, large dental chains, emergency departments, or complex multi-location practices.

## 5. Users

| User | Main need |
|---|---|
| Receptionist or clinic staff | Register patients, review history, check dentist availability, and book appointments |
| Dentist | See their schedule and upcoming patient appointments |
| Clinic owner | Review operational activity and maintain dentist configuration |
| Platform administrator | Configure, support, and maintain the product |
| Patient | Later, submit appointment information through WhatsApp |

## 6. Product Principles

1. **Website first:** Build and validate the clinic staff workflow before WhatsApp.
2. **Excel first, but temporary:** Use a structured workbook for early iterations; do not treat it as the final production database.
3. **One booking engine:** Website bookings and future WhatsApp bookings must use the same availability and appointment rules.
4. **Small-clinic focus:** Optimize for a single dental clinic before supporting complex organizations.
5. **Human control:** Staff can review and correct every appointment.
6. **Administrative scope:** Store only the patient information needed for the initial workflow.
7. **No unsafe clinical automation:** Do not diagnose or prescribe.
8. **Migration-ready:** Excel columns and identifiers must be designed so that migration to Supabase or PostgreSQL is straightforward.

## 7. MVP Goals

The first website MVP must allow staff to:

- Log in securely.
- Register a patient.
- Record patient name, age or date of birth, phone number, and relevant basic details.
- Record previous visit information in a structured way.
- Select a requested dentist.
- See whether one, two, or three dentists are available.
- View valid appointment ranges.
- Book an appointment range.
- Modify or cancel an appointment.
- View the dentist’s schedule.
- Search for an existing patient.
- Review the patient’s previous visits.
- Store and retrieve the records from a structured Excel workbook.

## 8. Initial Data Scope

### Patient registration

The initial patient record should contain only the fields needed for registration and appointment operations:

- Patient identifier.
- Full name.
- Age or date of birth.
- Phone number.
- Optional email.
- Emergency-contact information only if the clinic explicitly requires it.
- Consent or acknowledgement status where applicable.
- Created date and last updated date.

### Previous visits

The first version should not attempt to recreate a complete electronic medical record. It should store a structured visit summary such as:

- Visit identifier.
- Patient identifier.
- Visit date.
- Dentist.
- Visit type.
- Short staff-entered summary.
- Follow-up date or recommendation, if the clinic chooses to record it.

Avoid storing unnecessary clinical detail until the data model, privacy controls, retention policy, and professional requirements are reviewed.

### Dentist availability

The system should support:

- Dentist name and profile.
- Working days and hours.
- Breaks.
- Leave or blocked periods.
- Appointment duration or slot range.
- Current availability.
- Maximum number of parallel dentists supported by the clinic configuration.

## 9. Appointment Requirements

The appointment flow must:

1. Identify the patient.
2. Show the requested dentist or available dentists.
3. Check dentist working hours, leave, breaks, and existing appointments.
4. Show valid appointment ranges.
5. Allow staff to select a range.
6. Confirm the dentist, date, start time, end time, and patient.
7. Save the appointment to the workbook.
8. Prevent conflicting appointments within the configured scope.
9. Show the updated schedule.

The first version may use fixed appointment ranges. Flexible slot generation can be added only after the clinic’s actual scheduling pattern is understood.

## 10. Website Requirements

The staff website must provide:

- Secure staff login.
- Patient registration form.
- Patient search and profile page.
- Previous-visit list.
- Dentist and availability setup.
- Daily schedule view.
- Appointment creation, edit, cancellation, and rescheduling.
- Clear appointment status.
- Workbook data-health indicator.
- Manual export or download of the Excel workbook.
- Basic audit information for important changes.

The website should not expose raw workbook internals as the primary experience. Staff should use clear forms and calendars; the workbook is the pilot storage layer and fallback inspection format.

## 11. WhatsApp Later

WhatsApp is a later phase. It will collect administrative input such as:

- Patient name.
- Phone number.
- Preferred dentist.
- Preferred date or date range.
- Preferred appointment range.
- Basic appointment reason, if the clinic approves it.

The WhatsApp flow must send the request to the same backend booking service. It must not write directly to Excel or create a separate set of appointment rules.

## 12. Explicitly Out of Scope

- WhatsApp integration in the first website iteration.
- Supabase in the first iteration.
- Complete medical records.
- Diagnosis, treatment advice, or prescription generation.
- Emergency triage.
- Billing, insurance, pharmacy, or laboratory management.
- Multi-location organizations.
- Patient mobile application.
- Fully automatic clinical follow-up.

## 13. Success Metrics

| Metric | Initial target |
|---|---|
| Pilot dental clinics | At least 1, preferably 3 |
| Staff completing registration without developer help | 100% of pilot staff |
| Appointment conflict rate | Zero confirmed double bookings |
| Patient lookup accuracy | Staff can find the correct patient reliably |
| Data-write reliability | Every confirmed action produces a saved workbook record |
| Time to create an appointment | Faster than the clinic’s current process |
| Staff willingness to continue | Positive after at least two weeks of use |
| Excel-to-database migration readiness | All records have stable identifiers and consistent columns |

## 14. Product Positioning

The first product should be positioned as:

> A simple dental-clinic appointment and patient-registration website that helps staff manage dentist availability and patient history without forcing the clinic to adopt a complex hospital system.

WhatsApp should be positioned later as a convenient patient-input channel, not as the product’s foundation before the internal clinic workflow is proven.
