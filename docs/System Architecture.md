# System Architecture

## 1. Architecture Decision

The first implementation is a **clinic staff website backed by FastAPI and a structured Excel workbook**.

Supabase is intentionally deferred. It should be introduced only after the clinic workflow is validated and the product needs durable multi-user database behavior, backups, concurrent access, migration tooling, or multiple clinics.

WhatsApp is a later input channel. When added, it will call the same backend services used by the website.

## 2. First-Iteration Architecture

```text
Clinic staff browser
        |
        v
Staff website frontend
        |
        v
FastAPI backend
   |        |        |
   |        |        +--> Authentication and permissions
   |        +-----------> Workbook repository
   |                         |
   |                         v
   |                   clinic_data.xlsx
   |
   +--> Appointment and availability services

Future:
Patient WhatsApp -> WhatsApp provider -> FastAPI webhook -> same services
```

## 3. Important Excel Constraint

Excel is acceptable for a controlled prototype, not as the final multi-clinic production database.

A workbook is vulnerable to concurrent writes, file corruption, accidental manual edits, weak access control, missing transactional guarantees, and deployment-storage problems. Therefore, the backend must be the only writer during the pilot. Staff may view or download the workbook, but they should not edit it while the website is running.

Every workbook write must use a file lock, a temporary output file, validation, and an atomic replace operation. The system must create backups before important writes and maintain a recovery copy.

If the website is deployed to a cloud environment, the workbook must be stored on persistent storage. Ephemeral local deployment storage is not acceptable for clinic records.

## 4. Components

### 4.1 Staff website

The website provides authenticated forms, patient search, patient profiles, previous visits, dentist configuration, availability, calendar views, and appointment management.

The website must never read or write the workbook directly from the browser. All operations go through the FastAPI backend.

### 4.2 FastAPI backend

FastAPI is responsible for authentication, validation, clinic configuration, patient registration, visit records, dentist availability, appointment rules, workbook access, audit events, and future WhatsApp webhooks.

### 4.3 Workbook repository

The repository is the only component allowed to read or write the Excel file. It should expose application-level operations such as `create_patient`, `find_patient`, `add_visit`, `list_available_ranges`, and `create_appointment` rather than allowing arbitrary workbook edits from business code.

Use `openpyxl` or an equivalent library. Keep workbook schema definitions in code and validate every sheet before saving.

### 4.4 Future WhatsApp adapter

The WhatsApp adapter will receive patient input, normalize it into internal commands, and call the same patient, availability, and appointment services as the website.

It must never write directly to the workbook because that would duplicate business rules and bypass validation.

## 5. Workbook Design

Use one workbook per clinic for the first pilot, not one workbook for all clinics.

Recommended sheets:

| Sheet | Purpose |
|---|---|
| `Patients` | One row per registered patient |
| `Visits` | One row per previous or new visit summary |
| `Dentists` | Dentist identity and status |
| `Availability` | Working days, hours, breaks, and blocked periods |
| `Appointments` | One row per appointment |
| `Staff` | Staff accounts or imported staff reference |
| `AuditLog` | Important changes and source of change |
| `Metadata` | Schema version, clinic timezone, last backup, and workbook version |

Use stable identifiers such as `PAT-000001`, `VIS-000001`, `DOC-000001`, and `APT-000001`. Do not use a patient’s name as a primary key.

Use controlled values for statuses, such as `confirmed`, `pending`, `cancelled`, `rescheduled`, `completed`, and `no_show`.

## 6. Data Flow: Staff Website

### Register patient

1. Staff submits the form.
2. FastAPI validates the fields.
3. The service searches for a matching patient using configured rules.
4. The system either creates a new stable patient identifier or asks staff to confirm a possible duplicate.
5. The workbook repository writes the patient record.
6. The system creates an audit event.
7. The website displays the saved record.

### Add previous visit

1. Staff opens the patient profile.
2. Staff enters a concise structured visit summary.
3. FastAPI validates the patient identifier and fields.
4. The workbook repository writes the visit row.
5. The patient profile displays the new visit.

### Book appointment

1. Staff selects the patient.
2. Staff selects a requested dentist or available dentist.
3. The availability service reads dentist schedules, leave, breaks, and existing appointments.
4. The service returns valid appointment ranges.
5. Staff selects a range.
6. The booking service re-checks availability.
7. The workbook repository writes the appointment atomically under a file lock.
8. The system writes an audit event.
9. The website shows the confirmed appointment.

## 7. Availability Logic

Availability must be derived from:

- Dentist working schedule.
- Dentist leave or blocked time.
- Clinic working hours.
- Appointment duration.
- Existing appointments.
- Buffer time, if configured.
- Clinic timezone.

The first release may use predefined ranges such as 30-minute or 60-minute slots. Do not create a complicated scheduling engine until the clinic’s real appointment patterns are understood.

If two or three dentists are available, the staff member may choose a specific dentist or select the first valid dentist according to the clinic’s approved rule. The product must show the dentist clearly before confirmation.

## 8. Future WhatsApp Data Flow

```text
Patient sends WhatsApp message
        -> provider webhook
        -> FastAPI webhook handler
        -> conversation normalizer
        -> patient/availability/booking services
        -> workbook repository during pilot
        -> WhatsApp confirmation
```

After Supabase migration, only the repository changes. The product services should continue to use the same interfaces.

## 9. Future Supabase Migration

Supabase should be introduced when one or more of the following becomes true:

- Multiple staff members need concurrent writes.
- More than one clinic is active.
- The workbook becomes too large or unreliable.
- Reliable backups and audit history are required.
- Staff need real-time schedule updates.
- WhatsApp traffic becomes active.
- The product needs production-grade authentication and row-level access control.

The migration process should export workbook sheets into normalized tables, preserve stable identifiers, validate row counts, compare important records, and keep the original workbook as an archived snapshot.

## 10. Security Boundaries

The browser must never receive workbook file paths or secrets. The backend must validate every field and every clinic scope. Staff authentication, session protection, role permissions, and audit events are required even during the pilot.

Do not store passwords in the workbook. Do not expose raw patient data through debug logs. Do not send the workbook through unencrypted email.

## 11. Deployment Options

### Local pilot

Run FastAPI, the website, and the workbook on a clinic-owned or controlled computer. This is simplest for early iteration but requires local backup and availability procedures.

### Controlled hosted pilot

Run the backend and website on a server with persistent storage, encrypted access, scheduled backups, and one workbook per clinic. This is more convenient for staff but requires careful storage and recovery design.

Do not deploy the workbook to ephemeral storage that can disappear during restart or redeploy.

## 12. Architecture Decisions

| Decision | Choice | Reason |
|---|---|---|
| First user interface | Staff website | Validate the clinic workflow first |
| First storage | One structured Excel workbook per clinic | Fast iteration and easy inspection/export |
| Final storage direction | Supabase or PostgreSQL-backed system | Needed after validation and concurrent usage |
| Backend | FastAPI | Clear typed API and Python ecosystem |
| Future patient channel | WhatsApp | Add only after staff workflow works |
| Appointment authority | FastAPI domain service | One source of scheduling rules |
| Workbook access | Repository with lock and validation | Prevent direct uncontrolled edits |
| Initial scale | One clinic | Reduce complexity and learn the workflow |

## 13. Main Risks

The major risks are Excel corruption, simultaneous staff actions, cloud persistence, duplicate patient records, unclear previous-visit data, incorrect availability, and premature WhatsApp integration.

Mitigate them with one-clinic scope, backend-only workbook writes, stable identifiers, file locks, backups, explicit schema, validation, and a migration-ready repository boundary.
