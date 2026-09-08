================================================================================
🎯 ANTIGRAVITY DIRECTIVE — ZENDENTA v4 SURGICAL UPGRADE & ROADMAP
================================================================================

ROLE:
You are an industrial full-stack engineer modifying an EXISTING, WORKING codebase.
Your #1 rule: DO NOT rewrite anything that already works.
Your #2 rule: Every new feature must be MODULAR and ISOLATED.
Your #3 rule: If two features touch the same file, use composition, not mutation.

CONTEXT:
Zendenta is an advanced dental clinic dashboard for RECEPTIONISTS and PATIENTS.
Existing working features:
  - Sidebar navigation (sliding, persisted)
  - Dashboard with KPIs, Up Next, Waiting Room
  - Reservations calendar with drag-and-drop RESCHEDULE (works perfectly)
  - Appointment lifecycle state machine (7 states)
  - Visit Summary panel (read-only)
  - Take Payment, Reschedule, Cancel dialogs
  - Walk-In intake system with patient autocomplete and doctor availability grid
  - WhatsApp simulator inbox
  - Full persistence layer (Supabase PostgreSQL primary + Excel fallback)

DO NOT TOUCH:
  ❌ Existing drag-and-drop reschedule logic
  ❌ Existing sidebar
  ❌ Existing calendar rendering scale & multi-track collision algorithm
  ❌ Existing visit summary
  ❌ Existing payment flow
  ❌ Working state machine transitions

ONLY ADD OR MODIFY what is explicitly listed below.

================================================================================
📐 ARCHITECTURAL PRINCIPLES (STRICTLY ENFORCED)
================================================================================

1. FEATURE ISOLATION
   Every feature lives in its own dedicated directory under `features/`:
     features/
       walk-in/           — Phase 1: In-clinic walk-in intake & scheduling
       whatsapp-agent/    — Phase 2: Remote WhatsApp bot simulation & intake
       cancellation/      — Phase 3: Drag-to-delete trash zone & central audit log
       auth/              — Phase 4: Supabase role-based authentication

   Each folder contains its own:
     - components/
     - hooks/
     - services/
     - store/ (if needed)
     - types.ts
     - index.ts (public barrel export)

   Feature folders NEVER import from each other directly.
   Communication between features occurs exclusively through:
     - Shared typed event bus (`lib/event-bus.ts`)
     - Shared types (`types/*`)
     - Shared API client (`lib/api-client.ts`)

2. EVENT BUS PATTERN (`lib/event-bus.ts`)
   Lightweight typed pub/sub for cross-feature communication:
     type AppEvents = {
       'appointment:created':       { appointment: any; source: 'manual' | 'whatsapp' | 'walk-in' };
       'appointment:cancelled':     { appointmentId: string; reason: string; cancelledBy: string };
       'appointment:rescheduled':   { appointmentId: string; oldSlot: any; newSlot: any };
       'walkin:added':              { walkIn: WalkInRecord };
       'walkin:assigned':           { walkInId: string; appointmentId: string };
       'whatsapp:message-received': { message: WhatsAppMessage };
       'whatsapp:booking-request':  { request: BookingRequest };
       'notification:new':          { notification: any };
       'auth:login':                { user: any };
       'auth:logout':               {};
     };

3. FEATURE FLAGS (`lib/feature-flags.ts`)
   Every feature is guarded behind a feature flag:
     export const featureFlags = {
       walkInV2: true,        // Phase 1: Live & Active
       whatsappAgent: true,   // Phase 2: Live & Active
       supabaseAuth: false,   // Staged for later auth upgrade
     };

4. SERVICE LAYER
   Every feature exposes a dedicated service file hiding storage & HTTP details:
     features/walk-in/services/walk-in.service.ts
     features/whatsapp-agent/services/whatsapp-bot.service.ts
     features/whatsapp-agent/services/booking-request.service.ts

================================================================================
================================================================================
🚶 PHASE 1: IN-CLINIC WALK-IN PATIENT INTAKE & CALENDAR MANAGEMENT
================================================================================
================================================================================

STATUS: COMPLETE & VERIFIED ✅
FOLDER: features/walk-in/

### CORE OBJECTIVE & USER EXPERIENCE:
The patient literally walks into the clinic in person. The receptionist receives
them at the front desk, collects their details firsthand, and allots an appointment slot
based on real-time doctor availability.

### 1. PATIENT IDENTIFICATION & FIRSTHAND SUGGESTIONS:
- When the receptionist starts typing the patient's name or phone number:
  - System performs a live query to `GET /api/v1/patients`.
  - If patient data exists, an instant **Autocomplete Suggestions Dropdown** appears,
    displaying: Patient Name, Phone Number, Patient ID (`PAT-XXXXXX`), and Age.
  - Clicking an existing patient suggestion auto-populates their entire profile firsthand:
    Full Name, Phone, Age/DOB, Gender, Allergies, and Medical Conditions.
  - Receptionist does NOT need to manually re-type existing patient details.
- If the patient is brand new:
  - Receptionist fills in the fields.
  - Submitting registers the patient in the database (`POST /api/v1/patients`) with
    `force_create: true` so no duplicate warnings block intake.

### 2. 2-STEP INTAKE WORKFLOW:
- **Step 1: Patient Selection & Registration**
  - Choose between searching existing patient suggestions OR entering new patient details.
  - Sets clinical triage priority: `Normal`, `Urgent`, or `Emergency`.
  - Navigation: `Next: Doctor & Slot →`.
- **Step 2: Doctor Selection, Slot Allotment & Custom Time**
  - Displays `DentistAvailabilityGrid` with all active clinic doctors:
    - Dr. Sarah Wilson (`DEN-000001`)
    - Dr. Michael Chen (`DEN-000002`)
    - ROHAN (`DEN-000003`)
  - Live doctor schedule calculation:
    - Active doctors default to operational clinic hours (09:00 - 17:00, Mon-Sat) if custom
      availability rows are not yet configured.
    - Shows today's booked queue count and schedule breakdown.
  - Allotment options:
    - **Preset Slots:** Click any open interval badge.
    - **Custom Time Picker:** Exact `<input type="time" />` allowing the receptionist to
      specify any operational start time.
    - **Schedule Conflict Prevention:** Checks against existing bookings for that doctor;
      warns if a conflict or overlap exists.

### 3. DATABASE PERSISTENCE & CANONICAL ID NORMALIZATION:
- `walkInService.processWalkIn`:
  - Preserves selected `dentistId` (`DEN-000001`, `DEN-000002`, `DEN-000003`).
  - Backend `supabase_repository.py` resolves canonical dentist ID bidirectionally
    (`DEN-` and `DOC-` prefixes, `d1`, `1`) to satisfy PostgreSQL foreign keys.
  - `POST /api/v1/appointments` succeeds with HTTP 201 Created.

### 4. CALENDAR BOARD REFLECTION & AUDIT LOGGING:
- **Instant Grid Reflection (`CalendarBoard.tsx`):**
  - New appointment immediately renders under the assigned doctor's column on `/reservations`.
  - Decorated with dashed amber border and `🚶 Walk-in` badge.
- **Drag-and-Drop Reschedule:**
  - Receptionist can drag the walk-in card to another time or doctor.
  - Optimistic UI updates and persists via `POST /api/v1/appointments/{id}/reschedule`.
- **Cancelled / Deleted Appointments:**
  - When cancelled, the appointment vanishes from the active calendar view (`status !== 'cancelled'`).
  - The appointment is preserved in the audit database and viewable in the Log History tab.

================================================================================
================================================================================
💬 PHASE 2: WHATSAPP BOT SIMULATION & REMOTE PATIENT BOOKING
================================================================================
================================================================================

STATUS: NEXT TO EXECUTE (UPON USER TRIGGER)
FOLDER: features/whatsapp-agent/

### CORE OBJECTIVE & USER EXPERIENCE:
The patient is at home on their smartphone. Using a simulated WhatsApp chat interface,
the patient fills details, selects an appointment, and interacts conversationally.
The bot dynamically checks live clinic conditions (slot filled, doctor unavailable,
breaks) and responds with informative guidance. Confirmed appointments reflect
directly on the clinic calendar.

### 1. PATIENT IDENTITY RECOGNITION (AT-HOME CONTEXT):
- Patient opens WhatsApp simulator chat and sends a message (e.g., *"Hi, I want to book an appointment"*).
- Bot prompts for the patient's phone number (or name).
- **Database Lookup (`GET /api/v1/patients?phone=...`):**
  - **Existing Patient Found:**
    - Bot recognizes them firsthand: *"Welcome back, [Name]! Great to have you back at Zendenta Dental."*
    - Automatically pulls their existing patient ID, past treatments, and contact info.
    - The patient does NOT have to re-enter personal details from scratch.
  - **New Patient:**
    - Bot prompts for: Full Name, Age/DOB, Gender, and Treatment needed.
    - Drafts a new patient record.

### 2. REAL-TIME CONDITION & DOCTOR AVAILABILITY CHECK:
- The patient specifies:
  - Treatment: (e.g., Tooth Extraction, Scaling & Cleaning, General Checkup).
  - Preferred Date: (e.g., Today, Tomorrow, `2026-09-09`).
  - Preferred Doctor / Time: (e.g., Dr. Sarah Wilson, 11:00 AM).
- **Live Database Availability Validation:**
  - The bot queries `AvailabilityService` and `BookingService` in real time:
    1. Checks if the requested doctor is working on that date.
    2. Checks if the doctor is on approved leave.
    3. Checks for conflicting booked appointments.
    4. Checks operating hours (09:00 - 17:00) and break intervals (12:00 - 13:00).
- **Condition-Based Conversational Flow:**
  - **CASE A: Slot is Filled / Doctor Unavailable:**
    - Bot immediately responds that the appointment **cannot be taken at that time**:
      > *"Sorry, Dr. Sarah Wilson is already fully booked at 11:00 AM on 2026-09-09 (or not available at that time)."*
    - The bot calculates and proposes the **top 3 closest alternative available slots**:
      > *"Here are the closest available slots you can book instead:*
      > *1. 11:30 AM - 12:00 PM with Dr. Sarah Wilson*
      > *2. 11:00 AM - 11:30 AM with Dr. Michael Chen*
      > *3. 02:00 PM - 02:30 PM with Dr. Sarah Wilson*
      > *Please reply with 1, 2, or 3, or propose another time."*
  - **CASE B: Slot is Available:**
    - Bot confirms the reservation:
      > *"Great! We have reserved 11:30 AM on 2026-09-09 with Dr. Sarah Wilson for Tooth Extraction."*
      > *"Please reply CONFIRM to finalize your booking."*

### 3. DIRECT CALENDAR REFLECTION & CLINIC SYNCHRONIZATION:
- Upon confirmation:
  - Appointment is created in the database (`POST /api/v1/appointments` with `source: 'WHATSAPP'`).
  - The appointment **immediately reflects on the Calendar Board (`/reservations`)**:
    - Tagged with `💬 WhatsApp` source badge.
    - Linked to recognized existing patient or newly registered patient.
- **Receptionist Dashboard Integration:**
  - Header displays `BookingRequestBadge` showing live count of WhatsApp bookings.
  - Clicking badge opens slide-out `BookingRequestPanel` allowing the receptionist to:
    - View the WhatsApp conversation snippet.
    - See the patient status (🏷️ Existing vs. ⚠️ New).
    - Review or adjust appointment slot if clinical emergency arises.
    - If modified or rejected, bot simulates sending an updated WhatsApp message to the patient.

### 4. SMART SLOT MATCHER ALGORITHM:
Given a patient's booking preference, compute top 3 slots ranked by:
  1. Same date as preference (Weight: 50)
  2. Same time-of-day range (Morning/Afternoon/Evening) (Weight: 30)
  3. Preferred doctor available (Weight: 20)
  4. Duration matches procedure (Weight: bonus)
Never suggest slots that:
  - Overlap existing appointments
  - Fall in break times (12:00 - 13:00)
  - Are marked non-working day
  - Are in the past

### 5. FILES TO CREATE FOR PHASE 2:
```
frontend/features/whatsapp-agent/
├── components/
│   ├── WhatsAppSimulatorModal.tsx     # Floating patient smartphone WhatsApp simulator
│   ├── BookingRequestBadge.tsx        # Header notification badge with pulse count
│   ├── BookingRequestPanel.tsx        # Slide-over receptionist review drawer
│   ├── BookingRequestCard.tsx         # Inbound request card with Approve / Modify / Reject
│   ├── SlotSuggestionPicker.tsx       # 3 alternative slot recommendation chips
│   └── WhatsAppMessagePreview.tsx     # Chat bubble thread preview
├── hooks/
│   ├── useWhatsAppBot.ts              # Conversational state & message engine
│   ├── useBookingRequests.ts          # Subscribes to live inbound requests
│   └── useSlotMatcher.ts              # Computes top 3 available alternative slots
├── services/
│   ├── whatsapp-bot.service.ts        # Intent parsing, patient lookup & slot validation
│   ├── booking-request.service.ts     # CRUD for patient requests
│   └── whatsapp-bridge.service.ts     # Bridges bot bookings to Calendar & Event Bus
├── store/
│   └── whatsapp.store.ts              # Zustand store for active requests & badges
├── types.ts                           # Data models: BookingRequest, SlotSuggestion, WhatsAppMessage
└── index.ts                           # Public barrel export
```

================================================================================
================================================================================
❌ PHASE 3: DRAG-TO-CANCEL + LOG HISTORY (STAGED)
================================================================================
================================================================================

FOLDER: features/cancellation/
- Floating trash zone droppable appearing during appointment drag.
- Dropping on trash opens confirmation modal with cancellation reason.
- Cancellation removes appointment from calendar grid and logs to audit history.
- Preserves existing drag-and-drop reschedule without regressions.

================================================================================
================================================================================
🔐 PHASE 4: SUPABASE AUTHENTICATION (STAGED)
================================================================================
================================================================================

FOLDER: features/auth/
- Receptionist / Dentist / Admin role profiles.
- Protected route groups: `app/(auth)/` and `app/(protected)/`.
- Supabase SSR cookie session management with mock mode fallback.

================================================================================
📋 SEQUENTIAL EXECUTION CHECKLIST
================================================================================

[x] PHASE 1: Walk-In Intake & Calendar Management (COMPLETED & VERIFIED)
    [x] Patient autocomplete suggestions with existing patient lookup.
    [x] New patient quick-intake with database registration (`force_create: true`).
    [x] 2-step flow: Step 1 (Patient Data) → Step 2 (Doctor & Slot Allotment).
    [x] Real-time Doctor Availability Grid with booked queue breakdown.
    [x] Custom time picker for all doctors.
    [x] Prebooked schedule conflict check.
    [x] Fix terminal 404 error (canonical dentist ID resolution for `DEN-` and `DOC-`).
    [x] Instant reflection on Calendar Board with `🚶 Walk-in` badge.
    [x] Cancelled appointments removed from calendar grid and retained in log history.
    [x] Drag-and-drop reschedule across doctors and times.

[x] PHASE 2: WhatsApp Bot Simulation & Remote Booking (COMPLETED & VERIFIED ✅)
    [x] Create `features/whatsapp-agent/` directory structure.
    [x] Build `WhatsAppSimulatorModal.tsx` simulating patient's mobile WhatsApp chat from home.
    [x] Implement firsthand existing patient detection by phone number with auto-fetched profile.
    [x] Implement new patient detail intake conversational flow.
    [x] Implement live slot & doctor availability check (condition validation).
    [x] Implement bot responses: slot filled / doctor unavailable message + 3 alternative slots.
    [x] Implement direct Calendar Board reflection with `💬 WhatsApp` source badge.
    [x] Implement receptionist `BookingRequestBadge` and `BookingRequestPanel`.
    [x] End-to-end verification and testing.

================================================================================
🏁 FINAL COMMITMENTS
================================================================================
1. DO NOT rewrite working calendar dnd, state machine, or layout shell.
2. Every feature is isolated under `features/`.
3. Cross-feature communication only via `lib/event-bus.ts`.
4. Staged execution: Phase 1 complete and verified; Phase 2 executes upon user confirmation.