# Patient WhatsApp Bot Frontend Simulation (`simulator/`)

## 1. Role & Status

**Status:** **COMPLETED & OPERATIONAL** (Built in `simulator/` with React + TypeScript + Vite, running on Port 5173).

The Patient WhatsApp Bot Simulator provides a realistic mobile messaging experience that validates patient-side workflows—booking requests, multi-appointment rescheduling, and direct cancellations—without requiring an active WhatsApp Business API account or phone carrier verification.

---

## 2. Architecture & Backend Integration

Unlike an isolated static mockup, the simulator is fully wired to the live FastAPI backend:
1. **Intake Creation:** Submits new requests to `POST /api/v1/patient-requests`, generating persistent `REQ-XXXXXX` IDs with `status: 'pending'`.
2. **Direct Cancellation:** The Confirmation Card features an immediate "Cancel Request" action calling `PATCH /api/v1/patient-requests/{id}` with `status: 'cancelled'`.
3. **Multi-Booking Reschedule:** When a patient initiates a reschedule flow, the bot queries `GET /api/v1/patient-requests?patient_phone=...` (with trailing 10-digit matching), displays all upcoming appointments for that phone, and allows the patient to select which booking to reschedule via `POST /api/v1/appointments/{id}/reschedule`.
4. **Strict 24-Hour Time Standard (`HH:mm`):** All time chips (e.g., `09:30`, `11:00`, `14:30`) enforce 24-hour notation (`hour12: false`).
5. **Staff Review & Approval:** Requests submitted by the simulator appear instantly in the staff frontend's Inbound Request Drawer (`features/whatsapp-agent`), where 1-click staff approvals convert them into confirmed calendar appointments tagged with `source: 'WHATSAPP'`.

---

## 3. Implemented User Flows

```text
Welcome Screen
  ├── 1. Book an Appointment
  │     ├── Phone verification (Returning vs. New patient)
  │     ├── Dentist & Treatment Selection
  │     ├── Available 24h Slot Picker (HH:mm)
  │     ├── Review & Submission (Generates REQ-XXXXXX)
  │     └── Confirmation Card with [ Direct Cancel ] Action
  ├── 2. Change / Reschedule an Appointment
  │     ├── Phone verification
  │     ├── Multi-Booking Selection (Lists all upcoming appointments)
  │     ├── New Date & 24h Slot Selection
  │     └── Atomic Reschedule Update (POST /api/v1/appointments/{id}/reschedule)
  ├── 3. Cancel an Appointment
  │     ├── Immediate cancellation from Confirmation Card
  │     └── Or cancellation by Request/Appointment ID
  └── 4. Human Staff Handoff
```

---

## 4. Component Structure (`simulator/src/`)

```text
simulator/src/
├── App.tsx                    # Main chat frame & sticky bottom input
├── components/
│   ├── ChatHeader.tsx         # Dental clinic branding, status indicator
│   ├── MessageBubble.tsx      # Sender/receiver chat bubbles with 24h timestamps
│   ├── PhoneVerificationCard.tsx # Patient identification with digit normalization
│   ├── NewPatientCard.tsx     # Demographics & registration fields
│   ├── SlotSelectionCard.tsx  # Dynamic dentist, procedure, and 24h slot selector
│   ├── ConfirmationCard.tsx   # Assigned REQ-XXXXXX ticket with direct cancel button
│   ├── ReschedulePickerCard.tsx # Multi-appointment selection for rescheduling
│   └── CancelAppointmentCard.tsx # Cancellation confirmation and slot release
└── services/
    └── api.ts                 # Typed fetch client communicating with backend (Port 8000)
```

---

## 5. Universal 24-Hour Time Standard (`HH:mm`)

In alignment with the entire platform:
- All slot chips display as `09:00`, `10:30`, `14:00`, `16:30`, etc.
- No `AM` or `PM` suffixes are rendered.
- Chat message timestamps follow military time `HH:mm`.

---

## 6. How to Run Locally

```bash
# In c:\Users\Dhruv Dube\Desktop\hackathons\Projects\Clinic_assistant\simulator
npm install
npm run dev
# Running on http://localhost:5173
```
