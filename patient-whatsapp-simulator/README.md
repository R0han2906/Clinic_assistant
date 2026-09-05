# Patient WhatsApp Simulator (`patient-whatsapp-simulator`)

A modern, responsive React + TypeScript + Vite web application that imitates the patient WhatsApp conversation and appointment management experience for **DentalFlow**.

Because no live business WhatsApp phone number is required during early clinic pilot validation, this simulator serves as the primary patient-facing channel, communicating directly with the FastAPI backend REST APIs (`/api/v1` and `/api`).

---

## 🌟 Key Capabilities & User Flows

1. **Phone-Based Identity Verification:**
   - Detects whether the patient is a returning patient with existing records (`PAT-XXXXXX`) or a new patient.
2. **Interactive New Patient Registration:**
   - Collects patient name, age/DOB, and contact information, registering them seamlessly in the clinic system.
3. **Dentist & Slot Selection:**
   - Fetches active clinic dentists (`GET /api/dentists`) and real-time available 30-minute slots (`GET /api/availability/slots`).
   - Allows selecting procedure/treatment reasons (`GET /api/treatments`).
   - Submits appointment requests to `POST /api/v1/patient-requests`.
4. **Existing Appointment & Profile Management:**
   - Displays current upcoming appointments with live status badges (`CONFIRMED`, `PENDING`, `CANCELLED`).
   - **Edit Patient Details Card (`UpdatePatientCard`):** Allows updating full name, phone, age, address, and emergency contact via `PATCH /api/patients/{patient_id}`.
   - **Cancel Appointment Card (`CancelAppointmentCard`):** Prompts for cancellation reason and dispatches cancellations cleanly:
     - Dispatches to `POST /api/v1/patient-requests/{id}/cancel` for simulator request IDs (`REQ-XXXXXX`).
     - Dispatches to `POST /api/appointments/{id}/cancel` for confirmed booking IDs (`APT-XXXXXX`).
     - Automatically updates UI status badge to red `CANCELLED` and offers "Book a New Appointment".

---

## 📁 Component Architecture

```text
src/
├── components/
│   ├── Header.tsx                 # WhatsApp-style chat header with clinic branding & online status
│   ├── ChatMessage.tsx            # WhatsApp chat bubbles (patient vs clinic bot)
│   ├── PhoneVerificationCard.tsx  # Initial phone number input & lookup
│   ├── NewPatientCard.tsx         # New patient registration form
│   ├── SlotSelectionCard.tsx      # Date, dentist, and slot picker
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
cd patient-whatsapp-simulator

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
| Patient Lookup | `GET /api/patients?query={phone_or_id}` |
| Register Patient | `POST /api/patients` |
| Update Patient | `PATCH /api/patients/{patient_id}` |
| Check Available Slots | `GET /api/availability/slots?date={date}&dentist_id={dentist_id}` |
| Submit Request | `POST /api/v1/patient-requests` |
| Cancel Simulator Request | `POST /api/v1/patient-requests/{request_id}/cancel` |
| Cancel Confirmed Booking | `POST /api/appointments/{appointment_id}/cancel` |
