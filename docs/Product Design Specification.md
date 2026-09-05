# Product Design Specification

## 1. Design Objective

The primary user experience is designed for **dental-clinic front-desk staff (receptionists)**. The website must enable a receptionist to register patients, review previous visit summaries, inspect dentist availability, and book or reschedule appointments rapidly and without errors while interacting with patients in person or on the telephone.

Because no dedicated business WhatsApp number is currently available, the product also includes a **Patient Request Simulator**. The simulator provides a separate, clean test harness interface that imitates the structured inputs a patient will eventually submit through WhatsApp.

Core design baseline:
> **The first release is a dentist-clinic staff website with a Patient Request Simulator, FastAPI backend, and controlled Excel pilot storage. Supabase and real WhatsApp integration come later after validation.**

---

## 2. Primary Staff Workflow

The receptionist workflow is linear, minimal, and keyboard-accessible:

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
[View Available Slot Ranges (Calculated in Real-Time)]
           |
           v
[Select Slot & Review Confirmation Summary]
           |
           v
[Atomic Save -> Update Daily Schedule View]
```

All core actions should be accessible within two clicks from the main navigation, minimizing screen transitions during phone calls.

---

## 3. Staff Website Screens

### 3.1 Authentication
- Clean, focused login card for receptionists and dentists.
- No operational patient data exposed prior to valid session creation.

### 3.2 Today's Schedule Dashboard
- Default landing screen upon login.
- Displays today's date, active dentists on duty, and a chronological timeline of scheduled appointments.
- Status badges: `confirmed` (green), `pending` (yellow), `completed` (blue), `cancelled` (gray), `no_show` (red).
- Quick action button: "New Appointment" and "Register Patient".

### 3.3 Patient Search & Profile
- Fast search bar supporting patient name, phone number, or ID (`PAT-XXXXXX`).
- Search results card displaying name, phone, age/DOB, and last visit date.
- Dedicated patient profile displaying:
  - Demographic registration details.
  - Action buttons: "Book Appointment", "Add Visit Summary", "Edit Details".
  - Chronological list of structured previous visits.
  - Upcoming and past appointment history.

### 3.4 Patient Registration Form & Duplicate Detection UX
- Clean form divided into logical sections:
  1. Identity: Full Name, Age or Date of Birth.
  2. Contact: Phone Number (required), Email (optional).
  3. Clinic Consents: Checkbox for clinic data privacy acknowledgement.
- **Duplicate Detection Modal:** If a patient with the same phone number or similar name exists, display an immediate side-by-side comparison modal:
  - Option A: "Select Existing Patient" (redirects to their profile).
  - Option B: "Create Anyway" (calls `POST /api/patients?force_create=true`).

### 3.5 Structured Previous-Visit UX
- A concise modal or inline section on the patient profile to record:
  - Visit Date (defaults to today).
  - Attending Dentist (dropdown).
  - Visit Type (dropdown: Consultation, Cleaning, Filling, Root Canal, Extraction, Follow-up).
  - Short Summary (textarea limited to 500 characters, focusing on administrative/treatment overview).
- Avoids dense EMR complexity; displays as clean chronological cards.

### 3.6 Dentist Availability & Leave Management
- Visual weekly calendar showing dentist working hours and lunch breaks.
- Leave management panel: allows staff to register blocked vacation or leave dates (`POST /api/dentists/{id}/leaves`).
- Real-time indicator showing which dentists are currently available on any chosen date.

### 3.7 Appointment Booking & Slot Picker
- Visual slot selector showing generated non-conflicting time slots (e.g., 09:00–09:30, 09:30–10:00).
- Slots occupied by existing bookings, breaks, or dentist leaves are automatically omitted.
- Confirmation Card before final save:
  ```text
  +-----------------------------------------------+
  | Review Appointment Details                    |
  | Patient:  John Doe (PAT-000001)               |
  | Dentist:  Dr. Jane Smith (DOC-000001)         |
  | Date:     Monday, 2026-09-14                  |
  | Time:     10:00 - 10:30                       |
  | Status:   Ready to Confirm                    |
  |                                               |
  | [ Cancel ]             [ Confirm & Book Slot ]|
  +-----------------------------------------------+
  ```

---

## 4. Patient Request Simulator UX (Phase 6)

The Patient Request Simulator is built as an authentic React + TypeScript + Vite web application (`patient-whatsapp-simulator/`) simulating the WhatsApp patient conversation and self-service appointment portal.

### 4.1 Layout & Visual Theme
- Authentic WhatsApp mobile conversation frame (green brand accents `#075E54` / `#25D366`, chat bubbles, and timestamping).
- Interactive card components embedded directly within the chat stream to guide user actions.

### 4.2 Interactive Simulator Cards
1. **Phone Verification Card (`PhoneVerificationCard`):**
   - Inputs patient phone number and queries `GET /api/patients?query={phone}`.
   - Automatically detects returning patients versus first-time patients.
2. **New Patient Onboarding Card (`NewPatientCard`):**
   - Collects Full Name, Age/DOB, and contact details, persisting them via `POST /api/patients`.
3. **Dentist & Slot Selection Card (`SlotSelectionCard`):**
   - Dynamic dentist selector (`GET /api/dentists`), procedure picker (`GET /api/treatments`), and live available 30-minute time slots (`GET /api/availability/slots`).
   - Dispatches booking request to `POST /api/v1/patient-requests`.
4. **Existing Appointment Card (`ManageExistingAptCard`):**
   - Displays dentist, treatment, date, and time slot.
   - Status indicators: `CONFIRMED` (green), `PENDING` (yellow), `CANCELLED` (red).
   - Actions: **"Edit Details"** and **"Cancel Appointment"**.
5. **Patient Profile Update Card (`UpdatePatientCard`):**
   - Form allowing updates to name, phone number, age/DOB, and address.
   - Synchronizes directly with the backend via `PATCH /api/patients/{patient_id}`.
6. **Cancellation Card (`CancelAppointmentCard`):**
   - Prompts the patient for a cancellation reason (preset choices or custom text).
   - Shows warning that the reserved slot will be immediately made available to others.
   - Dual reference routing: calls `POST /api/v1/patient-requests/{id}/cancel` for `REQ-` requests or `POST /api/appointments/{id}/cancel` for `APT-` appointments.
   - Updates status badge to `CANCELLED` and displays a "Book a New Appointment" option.


---

## 5. Later WhatsApp Conversational UX (Phase 9)

In Phase 9, the WhatsApp Business integration will replace the simulator using a guided chatbot flow:

```text
Step 1: Welcome message & clinic identification.
Step 2: Check if new or returning patient (via phone number).
Step 3: Ask for preferred dentist or assign first available.
Step 4: Ask for preferred date & show available slot options.
Step 5: Patient selects slot number (e.g., reply "1" for 10:00 AM).
Step 6: Send official WhatsApp confirmation template.
Step 7: Provide "Talk to Receptionist" escalation option at every step.
```

---

## 6. Error States and Edge Cases

| Scenario | UI/UX Behavior |
|---|---|
| **Patient Phone Already Exists** | Show comparison modal with matching record and "Force Create" override button. |
| **Dentist on Leave** | Date picker greys out blocked dates with a "Dentist on Leave" tooltip. |
| **Slot Booked Concurrently** | Toast notification: "This slot was just booked by another user. Here are the latest available slots." Refreshes slots automatically. |
| **Excel File Locked** | Toast notification: "Clinic database is momentarily busy. Retrying..." Auto-retries transparently without losing entered form data. |
| **Network Disconnection** | Offline banner warning; prevents destructive actions until connection is restored. |

---

## 7. Visual Design Guidelines

- **Palette:** Clean, medical-grade aesthetic. Crisp whites, deep slate text (`#1e293b`), and trustworthy clinic blues (`#2563eb` primary, `#0284c7` accent).
- **Typography:** Modern, legible sans-serif (e.g., Inter or Outfit) with clear hierarchy and high contrast ratios conforming to WCAG AA.
- **Feedback:** Clear toast notifications and loading spinners for all asynchronous actions.
- **Accessibility:** Full keyboard navigability (`Tab`, `Enter`, `Esc` for modals), clear ARIA labels, and explicit focus rings.
