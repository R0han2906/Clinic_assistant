# Product Design Specification

## 1. Design Objective

The primary user experience is designed for **dental-clinic front-desk staff (receptionists)** and **practitioners**. The web platform enables staff to triage walk-in patients, review incoming WhatsApp booking requests, inspect dentist schedules, record clinical checkups with interactive odontograms, and book or reschedule appointments rapidly with zero errors.

In addition, an authentic **Patient WhatsApp Bot Simulator** (`simulator/`) provides a realistic mobile messaging experience for patient-side workflows including booking, multi-appointment rescheduling, and direct cancellation.

Core design baseline:
> **A unified dental clinic operating system: Next.js staff frontend with zero-CORS proxy, Walk-In intake, WhatsApp review drawer, 24-hour time standard, FastAPI MVC backend, Supabase PostgreSQL primary storage, and patient WhatsApp simulator.**

---

## 2. Primary Staff Workflows

### 2.1 Standard Appointment Booking
```text
[Search or Register Patient]
           |
           v
[Review Previous Visits on Patient Profile]
           |
           v
[Select Requested Dentist & Desired Date]
           |
           v
[View Available 24-Hour Slot Ranges (e.g., 10:00 - 10:30)]
           |
           v
[Select Slot & Review Confirmation Summary]
           |
           v
[Atomic Save -> Update Daily Schedule View]
```

### 2.2 Walk-In Triage Workflow (`features/walk-in`)
```text
[Patient arrives at clinic front desk]
           |
           v
[Staff clicks "Walk-In" in Top Navigation]
           |
           v
[Debounced Autocomplete Search (`/api/v1/patients/lookup?q=...`)]
      ├── Found: Auto-populates Name, Phone, Age, Medical History
      └── New: Inline creation form with duplicate detection
           |
           v
[Live On-Duty Dentist Availability Grid (`DentistAvailabilityGrid.tsx`)]
   - Displays all active dentists for current date
   - Calculates ongoing appointments, next free slot (24h), and estimated wait
   - Highlights dentist with "Shortest Wait" badge
           |
           v
[1-Click Booking -> Creates Appointment with source: 'WALK_IN']
           |
           v
[Live Event Bus dispatches 'APPOINTMENT_CREATED' -> Calendar updates instantly]
```

### 2.3 WhatsApp Inbound Request Review (`features/whatsapp-agent`)
```text
[Patient submits booking via WhatsApp Simulator]
           |
           v
[FastAPI creates request with status: 'pending' and ID: 'REQ-XXXXXX']
           |
           v
[Top-Nav Badge (`BookingRequestBadge.tsx`) pulses with pending count]
           |
           v
[Staff opens Review Drawer (`BookingRequestPanel.tsx`)]
   - Displays cards (`BookingRequestCard.tsx`) with patient info, preferred dentist, 24h slot, reason
           |
      ┌────┴────────────────────────┐
      v                             v
[1-Click "Approve"]          [1-Click "Reject"]
   - Calls backend approval     - Prompts for reason
   - Creates confirmed          - Marks request rejected
     appointment ('WHATSAPP')
   - Syncs to calendar
```

---

## 3. Staff Website Screens & UI Components

### 3.1 Authentication
- Clean, focused login card for receptionists and dentists.
- Currently supports direct front-desk bypass for seamless clinic trial operations.

### 3.2 Today's Schedule Dashboard (`CalendarBoard.tsx`)
- Default operational view with multi-dentist columns.
- **Strict 24-Hour Time Standard:** Left-axis hour markers from `09:00` to `00:00`.
- **Appointment Cards:** Rendered with 24-hour intervals (`09:00 › 10:00`, `14:30 › 15:30`), patient name, procedure badge, and intake source tag (`WALK_IN`, `WHATSAPP`, `PHONE`).
- Status badges: `confirmed` (emerald), `pending` (amber), `completed` (blue), `cancelled` (gray), `no_show` (rose).

### 3.3 Walk-In Intake Drawer (`WalkInSheet.tsx`)
- Sliding right drawer accessible from header navigation.
- **Patient Autocomplete (`PatientAutocomplete.tsx`):** Instant search against `/api/v1/patients/lookup` matching phone, name, or `PAT-XXXXXX` with highlighted search tokens.
- **On-Duty Availability Grid (`DentistAvailabilityGrid.tsx`):** Real-time calculation of dentist schedules, showing current patient, next opening, and shortest-wait badges.

### 3.4 Inbound WhatsApp Request Panel (`BookingRequestPanel.tsx`)
- Slide-over drawer listing all unapproved `REQ-` items.
- Real-time badge counter (`BookingRequestBadge.tsx`) with pulse animation and 15s interval polling.
- Instant 1-click approval converts incoming requests into confirmed calendar appointments without manual re-typing.

### 3.5 Patient Search & Profile Management
- Search bar supporting patient name, phone number, or ID (`PAT-XXXXXX`).
- Demographic registration details, emergency contacts, medical flags, and allergies.
- Chronological list of previous visits and appointment history.

### 3.6 Interactive Odontogram Charting
- 32-tooth adult dental chart with FDI notation.
- Visual status tagging (cavity, crown, filling, missing, extraction).
- Seamlessly attached to clinical checkup records.

---

## 4. Patient WhatsApp Bot Simulator UX (`simulator/`)

The simulator is an authentic React + TypeScript + Vite web application running on Port 5173 that models the patient-facing WhatsApp experience.

### 4.1 Mobile Frame & Conversational UI
- Authentic WhatsApp mobile conversation shell (green brand accents `#075E54` / `#25D366`, chat bubbles, and timestamping).
- Interactive card components embedded directly within the chat stream.
- Strict 24-hour time chips (`HH:mm`, e.g., `10:00`, `14:30`, `16:00`).

### 4.2 Interactive Simulator Cards
1. **Phone Verification Card (`PhoneVerificationCard`):**
   - Inputs phone number and queries `GET /api/v1/patients/lookup?q={phone}`.
   - Automatically detects returning vs new patients.
2. **New Patient Onboarding Card (`NewPatientCard`):**
   - Collects Full Name, Age/DOB, and contact details.
3. **Dentist & Slot Selection Card (`SlotSelectionCard`):**
   - Displays dentists, treatments, and available 24-hour slots (`HH:mm`).
   - Submits request to `POST /api/v1/patient-requests`.
4. **Confirmation Card with Direct Cancellation:**
   - Displays assigned request ID (`REQ-XXXXXX`), preferred dentist, and 24h slot.
   - **Direct "Cancel Request" Button:** Allows immediate cancellation right from the confirmation bubble via `PATCH /api/v1/patient-requests/{id}`.
5. **Multi-Booking Rescheduling Flow:**
   - When the patient indicates a desire to reschedule, the bot fetches all upcoming bookings for that phone number (`GET /api/v1/patient-requests?patient_phone=...`).
   - Presents a card listing each upcoming appointment, allowing the patient to pick the exact booking they wish to modify.
   - Submits new time slot to `POST /api/v1/appointments/{id}/reschedule`.

---

## 5. Universal 24-Hour Time Standard (`HH:mm`)

Across all views, the system strictly enforces the 24-hour format:
- **No AM/PM markers:** Prevents morning/evening scheduling ambiguity.
- **Calendar left-axis:** `09:00`, `10:00`, ..., `23:00`, `00:00`.
- **Appointment card intervals:** `09:00 › 10:00`, `15:30 › 16:30`.
- **Operating timings:** Displayed in header as `09:00 - 00:00`.
- **Simulator chips:** Displayed as `09:30`, `11:00`, `14:00`, `18:30`.

---

## 6. Error States, Edge Cases & Network Reliability

| Scenario | UI/UX Behavior |
|---|---|
| **Zero-CORS Resolution** | Handled natively by Next.js server proxy (`/api/:path*` -> `:8000`), preventing CORS and loopback failures. |
| **Phone Format Differences** | Backend digit-matching ignores country code discrepancies (`+91` vs `10 digits`), matching seamlessly. |
| **Dentist on Leave** | Blocked dates dynamically greyed out with tooltip indicating dentist absence. |
| **Slot Booked Concurrently** | Toast notification: "This slot was just booked by another user. Here are the latest available slots." Refreshes slots automatically. |
| **Excel Storage Conflict** | `lock-once-delegate` handles atomic file access, auto-retrying safely without corruption. |
| **Unsaved Form Protection** | Warns users before navigating away from incomplete walk-in registrations. |
