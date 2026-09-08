# Patient WhatsApp Simulator (`simulator/`)

A modern, responsive React + TypeScript + Vite web application that imitates the patient WhatsApp conversation and appointment management experience for **DentalFlow**.

Because no live business WhatsApp phone number is required during early clinic pilot validation, this simulator serves as the primary patient-facing channel, communicating directly with the FastAPI backend REST APIs.

---

## 🌟 Key Capabilities & User Flows

1. **Phone-Based Identity Verification & Digit Matching:**
   - Detects whether the patient is a returning patient with existing records (`PAT-XXXXXX`) or a new patient.
   - Backend digit-matching seamlessly harmonizes `+91` international prefixes with local 10-digit formats.
2. **Interactive New Patient Registration:**
   - Collects patient name, age/DOB, and contact information, registering them seamlessly in the clinic system.
3. **Dentist & 24-Hour Slot Selection:**
   - Fetches active clinic dentists (`GET /api/dentists`) and real-time available slots (`GET /api/availability/slots`).
   - Strict **24-hour military time standard** (`HH:mm`, e.g., `09:30`, `11:00`, `14:30`) across all slot buttons and message chips.
   - Allows selecting procedure/treatment reasons (`GET /api/treatments`).
   - Submits appointment requests to `POST /api/v1/patient-requests` generating `REQ-XXXXXX` IDs.
4. **Direct Cancellation from Confirmation Card:**
   - When a booking request is submitted, the generated Confirmation Card provides an immediate **"Cancel Request"** button.
   - Dispatches a cancellation directly to `PATCH /api/v1/patient-requests/{id}` (or `POST /api/v1/patient-requests/{id}/cancel`), instantly updating request state to `cancelled`.
5. **Multi-Booking Rescheduling Flow:**
   - When a patient selects "Change an appointment", the bot queries `GET /api/v1/patient-requests?patient_phone=...` to retrieve all upcoming bookings for that phone number.
   - Displays a multi-booking picker allowing the patient to choose which specific appointment to modify.
   - Dispatches the new time slot to `POST /api/v1/appointments/{id}/reschedule`.
6. **Existing Appointment & Profile Management:**
   - Displays current upcoming appointments with live status badges (`CONFIRMED`, `PENDING`, `CANCELLED`).
   - **Edit Patient Details Card (`UpdatePatientCard`):** Allows updating full name, phone, age, address, and emergency contact via `PATCH /api/patients/{patient_id}`.

---

## 📁 Component Architecture

```text
src/
├── components/
│   ├── Header.tsx                 # WhatsApp-style chat header with clinic branding & online status
│   ├── ChatMessage.tsx            # WhatsApp chat bubbles (patient vs clinic bot) with 24h timestamps
│   ├── PhoneVerificationCard.tsx  # Initial phone number input & lookup
│   ├── NewPatientCard.tsx         # New patient registration form
│   ├── SlotSelectionCard.tsx      # Date, dentist, and 24h slot picker
│   ├── ConfirmationCard.tsx       # Booking confirmation card with direct [ Cancel Request ] action
│   ├── ManageExistingAptCard.tsx  # Upcoming appointment overview & actions
│   ├── UpdatePatientCard.tsx      # Form modal to update patient profile & contact info
│   └── CancelAppointmentCard.tsx  # Interactive cancellation confirmation with reason selector
├── apiClient.ts                   # Typed API client interfacing with FastAPI backend
├── types.ts                       # Shared TypeScript interfaces & step state machine
├── App.tsx                        # Core conversational state machine and orchestrator
├── App.css                        # WhatsApp UI themes, chat layouts, and interactive cards
└── main.tsx                       # React application bootstrap
```

---

## 🚀 Running the Simulator Locally

### Prerequisites
- Node.js >= 18
- DentalFlow backend running on `http://127.0.0.1:8000`

### Installation & Startup
```bash
# Navigate to the simulator directory
cd simulator

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

The simulator will launch on `http://localhost:5173/`.

---

## 🔗 Backend API Integration

| Simulator Action | Backend Endpoint |
|---|---|
| Health Check | `GET /api/system/health` |
| List Dentists | `GET /api/dentists` |
| List Treatments | `GET /api/treatments` |
| Patient Lookup | `GET /api/v1/patients/lookup?q={phone_or_name}` |
| Register Patient | `POST /api/patients` |
| Update Patient | `PATCH /api/patients/{patient_id}` |
| Check Available Slots (24h) | `GET /api/availability/slots?date={date}&dentist_id={dentist_id}` |
| Submit Booking Request | `POST /api/v1/patient-requests` |
| List Patient Requests (by phone) | `GET /api/v1/patient-requests?patient_phone={phone}` |
| Cancel Booking Request | `PATCH /api/v1/patient-requests/{request_id}` or `POST /api/v1/patient-requests/{id}/cancel` |
| Reschedule Appointment | `POST /api/v1/appointments/{appointment_id}/reschedule` |
| Cancel Confirmed Booking | `POST /api/appointments/{appointment_id}/cancel` |
