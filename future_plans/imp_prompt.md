================================================================================
🎯 ANTIGRAVITY DIRECTIVE — ZENDENTA v4 SURGICAL UPGRADE
================================================================================

ROLE:
You are a senior engineer modifying an EXISTING, WORKING codebase.
Your #1 rule: DO NOT rewrite anything that already works.
Your #2 rule: Every new feature must be MODULAR and ISOLATED.
Your #3 rule: If two features touch the same file, use composition, not mutation.

CONTEXT:
Zendenta is a dental clinic dashboard for RECEPTIONISTS.
Existing working features:
  - Sidebar navigation (sliding, persisted)
  - Dashboard with KPIs, Up Next, Waiting Room
  - Reservations calendar with drag-and-drop RESCHEDULE (works perfectly)
  - Appointment lifecycle state machine (7 states)
  - Visit Summary panel (read-only)
  - Take Payment, Reschedule, Cancel dialogs
  - WhatsApp simulator (already exists in codebase — find it, don't rebuild it)
  - Mock data layer

DO NOT TOUCH:
  ❌ Existing drag-and-drop reschedule logic
  ❌ Existing sidebar
  ❌ Existing calendar rendering
  ❌ Existing visit summary
  ❌ Existing payment flow
  ❌ Working state machine transitions

ONLY ADD OR MODIFY what is explicitly listed below.

================================================================================
📐 ARCHITECTURAL PRINCIPLES (ENFORCE THESE)
================================================================================

1. FEATURE ISOLATION
   Every new feature gets its own folder under `features/`:
     features/
       auth/
       whatsapp-agent/
       walk-in/
       cancellation/
   
   Each folder contains its own:
     - components/
     - hooks/
     - services/
     - store/ (if needed)
     - types.ts
     - index.ts (public API — barrel export)
   
   Feature folders NEVER import from each other directly.
   They communicate via:
     - Shared events bus (lib/event-bus.ts)
     - Shared stores (store/*)
     - Shared types (types/*)

2. DEPENDENCY DIRECTION
   features/* → can import from → lib/*, components/ui/*, store/*, types/*
   features/* → CANNOT import from → other features/*
   app/*     → can import from → features/*, components/*, lib/*
   
   If feature A needs feature B's data, both read from the same store or 
   emit/listen to events. No direct coupling.

3. EVENT BUS PATTERN
   Create: lib/event-bus.ts
   
   Use a lightweight typed pub/sub for cross-feature communication:
   
     type AppEvents = {
       'appointment:created':    { appointment: Appointment; source: 'manual' | 'whatsapp' | 'walk-in' };
       'appointment:cancelled':  { appointmentId: string; reason: string; cancelledBy: string };
       'appointment:rescheduled': { appointmentId: string; oldSlot: Slot; newSlot: Slot };
       'walkin:added':           { walkIn: WalkIn };
       'walkin:assigned':        { walkInId: string; appointmentId: string };
       'whatsapp:message-received': { message: WhatsAppMessage };
       'whatsapp:booking-request': { request: WhatsAppBookingRequest };
       'notification:new':       { notification: Notification };
       'auth:login':             { user: User };
       'auth:logout':            {};
     };
     
     export const eventBus = createTypedEventBus<AppEvents>();
   
   Any feature can .emit() or .on() without knowing about the other.

4. FEATURE FLAGS
   Create: lib/feature-flags.ts
   
     export const flags = {
       whatsappAgent: true,
       walkInV2: true,
       supabaseAuth: true,
       // future flags here
     };
   
   Every new feature is behind a flag. Turning it off must not break the app.

5. SERVICE LAYER
   Every feature has a service file that hides implementation details:
     features/auth/services/auth.service.ts
       → login(), logout(), getSession(), etc.
     
   Components NEVER call supabase.auth.* directly.
   They call authService.login() — so we can swap providers later.

================================================================================
================================================================================
🔐 FEATURE 1: SUPABASE AUTHENTICATION
================================================================================
================================================================================

FOLDER: features/auth/

FILES TO CREATE:

  features/auth/
    ├── components/
    │   ├── LoginForm.tsx           ('use client')
    │   ├── SignupForm.tsx          ('use client')
    │   ├── ForgotPasswordForm.tsx  ('use client')
    │   ├── AuthGuard.tsx           ('use client') — wraps protected pages
    │   └── UserMenu.tsx            ('use client') — enhance existing user dropdown
    ├── hooks/
    │   ├── useAuth.ts              — returns { user, loading, login, logout }
    │   └── useSession.ts           — real-time session state
    ├── services/
    │   └── auth.service.ts         — supabase abstraction layer
    ├── store/
    │   └── auth.store.ts           — zustand store for current user
    ├── types.ts
    └── index.ts                    — barrel export

  lib/
    └── supabase/
        ├── client.ts               — browser client
        ├── server.ts               — server client (RSC-safe)
        └── middleware.ts           — session refresh middleware

  app/
    ├── (auth)/                     — route group for unauthed pages
    │   ├── layout.tsx              — centered card layout
    │   ├── login/page.tsx
    │   ├── signup/page.tsx
    │   └── forgot-password/page.tsx
    ├── (protected)/                — route group for authed pages
    │   ├── layout.tsx              — existing sidebar + header layout
    │   ├── dashboard/              — move existing dashboard here
    │   ├── reservations/           — move existing reservations here
    │   ├── patients/               — move existing patients here
    │   └── ...                     — move all other existing routes here
    └── middleware.ts               — protect (protected) routes

INSTALL:
  pnpm add @supabase/supabase-js @supabase/ssr

ENV VARS (add to .env.local):
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=  (server only, never expose)

DATABASE SCHEMA (add to migrations or Supabase SQL editor — provide as .sql file):

  -- Users table extends Supabase auth.users
  create table public.staff_profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text not null,
    role text not null check (role in ('receptionist', 'dentist', 'admin')),
    clinic_id uuid references public.clinics(id),
    avatar_url text,
    phone text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
  );
  
  create table public.clinics (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    address text,
    created_at timestamptz default now()
  );
  
  -- RLS policies
  alter table public.staff_profiles enable row level security;
  create policy "Users can read own profile" on staff_profiles
    for select using (auth.uid() = id);
  create policy "Users can update own profile" on staff_profiles
    for update using (auth.uid() = id);

LOGIN PAGE UI:
  - Centered card, max-w-md, rounded-2xl, shadow-lg
  - Zendenta logo at top
  - Heading: "Welcome back"
  - Subtext: "Sign in to your clinic dashboard"
  - Email input
  - Password input (with show/hide toggle)
  - [Sign in] primary button (full width)
  - "Forgot password?" link
  - Divider "or"
  - [Continue with Google] button (optional social login)
  - Footer: "New here? Contact your admin"

AUTH FLOW:
  1. Unauthed user visits ANY app route → redirect to /login
  2. On successful login:
     - Create session cookie (via @supabase/ssr)
     - Fetch staff_profiles row
     - Store user in auth.store.ts
     - Emit eventBus.emit('auth:login', { user })
     - Redirect to /dashboard
  3. Header UserMenu shows real user data (name, role, avatar)
  4. Logout: clear session, emit 'auth:logout', redirect to /login

MIDDLEWARE:
  app/middleware.ts
    - Runs on every request
    - If route is under (protected) and no session → redirect to /login
    - If route is under (auth) and has session → redirect to /dashboard
    - Refreshes session token

CRITICAL:
  - Existing pages must NOT break. Just move them under (protected) group.
  - The layout.tsx inside (protected) is the SAME sidebar+header shell.
  - Loading skeletons for auth state (never flash-of-unauthenticated-content).

MOCK MODE:
  If flags.supabaseAuth === false OR env vars are missing:
    - Skip real Supabase calls
    - Auto-login with hardcoded receptionist user
    - Log a console warning: "Auth mock mode active"
  This lets the codebase work locally without Supabase configured.

================================================================================
================================================================================
💬 FEATURE 2: WHATSAPP AGENT INTEGRATION
================================================================================
================================================================================

FOLDER: features/whatsapp-agent/

CONTEXT:
The codebase ALREADY has a WhatsApp simulator (find it — likely in 
app/whatsapp-simulator/ or components/whatsapp/). Do NOT rebuild it.
Instead, WIRE IT into the main receptionist system.

FLOW (receptionist perspective):

  1. Patient chats with WhatsApp bot (existing simulator)
  2. Bot collects: name, phone, treatment, preferred date/time
  3. Bot submits a "booking request" (not a confirmed appointment)
  4. Receptionist sees a NOTIFICATION in the main dashboard
  5. Receptionist reviews the request:
     - System suggests best available slot near patient's preference
     - Receptionist can APPROVE, MODIFY SLOT, or REJECT
  6. On APPROVE:
     - Appointment created in the calendar
     - WhatsApp bot sends confirmation to patient
     - Notification cleared
  7. On MODIFY:
     - Slot picker opens with alternatives
     - Approve after adjusting
  8. On REJECT:
     - Bot sends "unavailable" message with alternative suggestion

FILES TO CREATE:

  features/whatsapp-agent/
    ├── components/
    │   ├── BookingRequestBadge.tsx        — bell icon with count in header
    │   ├── BookingRequestPanel.tsx        — dropdown/sheet listing requests
    │   ├── BookingRequestCard.tsx         — single request with actions
    │   ├── SlotSuggestionPicker.tsx       — shows 3 best available slots
    │   └── WhatsAppMessagePreview.tsx     — mini-thread preview
    ├── hooks/
    │   ├── useBookingRequests.ts          — subscribes to request stream
    │   └── useSlotSuggestions.ts          — computes best slots for preference
    ├── services/
    │   ├── booking-request.service.ts     — CRUD for requests
    │   ├── slot-matcher.service.ts        — smart slot suggestion algorithm
    │   └── whatsapp-bridge.service.ts     — bridge between simulator and main system
    ├── store/
    │   └── whatsapp.store.ts              — pending requests, notification counts
    ├── types.ts
    │   ├── BookingRequest
    │   ├── SlotSuggestion
    │   └── WhatsAppMessage
    └── index.ts

DATA MODEL:

  type BookingRequest = {
    id: string;
    source: 'whatsapp';
    receivedAt: Date;
    status: 'pending' | 'approved' | 'rejected' | 'expired';
    patient: {
      name: string;
      phone: string;
      isExisting: boolean;      // matched to existing patient?
      existingPatientId?: string;
    };
    preferredTreatment: string;
    preferredDate: string;        // ISO date
    preferredTimeRange: 'morning' | 'afternoon' | 'evening' | 'any';
    preferredDentist?: string;    // optional
    notes?: string;
    conversationSnippet: WhatsAppMessage[];  // last 3-5 messages for context
    suggestedSlots?: SlotSuggestion[];       // computed by slot-matcher
    approvedAppointmentId?: string;          // set after approval
  };
  
  type SlotSuggestion = {
    dentistId: string;
    dentistName: string;
    date: string;
    startTime: string;
    endTime: string;
    matchScore: number;           // 0-100, how well it matches preference
    reason: string;               // "Exact match" | "30 min earlier" | etc.
  };

SLOT MATCHER ALGORITHM:
  Given a BookingRequest, return top 3 slots ranked by:
    1. Same day as preferred (weight: 50)
    2. Same time range as preferred (weight: 30)
    3. Preferred dentist available (weight: 20)
    4. Duration matches treatment (weight: bonus)
  
  Never suggest slots that:
    - Overlap existing appointments
    - Fall in break time
    - Are marked "not available"
    - Are in the past

HEADER INTEGRATION:
  Add BookingRequestBadge next to existing notification flag.
  When pending count > 0: red dot pulse animation.
  Click → opens BookingRequestPanel (right-side sheet).

DASHBOARD INTEGRATION:
  Add new card in dashboard grid (col-span-4):
    "WhatsApp Requests"
    - Count: "3 pending review"
    - Preview: latest request
    - CTA: [Review All]

BOOKING REQUEST CARD UI:
  ┌────────────────────────────────────────────┐
  │ 💬 WhatsApp · 2 min ago                    │
  │                                              │
  │ 👤 Sarah Kim  ·  +62 812-3456-7890          │
  │ ⚠️ New patient (not in system)              │
  │                                              │
  │ Treatment:  Tooth Extraction                 │
  │ Preferred:  Tomorrow morning                 │
  │ Dentist:    Any                              │
  │                                              │
  │ 💬 "Hi, my tooth is hurting badly, can I    │
  │    come tomorrow morning? Any dentist ok."  │
  │    [View full conversation]                  │
  │                                              │
  │ ─────────────────────────────────────────   │
  │ SUGGESTED SLOTS                              │
  │                                              │
  │ ● 9:00 AM · Drg Soap · 60min · Exact match  │
  │ ○ 10:30 AM · Drg Jerald · 60min · +1.5h    │
  │ ○ 11:00 AM · Drg Putri · 60min · +2h       │
  │                                              │
  │ [Reject]  [Modify Slot]  [Approve & Notify] │
  └────────────────────────────────────────────┘

WHATSAPP SIMULATOR BRIDGE:
  In the existing WhatsApp simulator, when the bot completes form filling:
    - Instead of creating an appointment directly
    - Call: whatsappBridgeService.submitBookingRequest(formData)
    - This creates a BookingRequest and emits:
        eventBus.emit('whatsapp:booking-request', { request })
  
  The main app's whatsapp store listens and updates the notification count.
  This way, the simulator stays untouched — only ONE function call is added.

APPROVAL FLOW:
  On [Approve & Notify]:
    1. Create appointment (status: 'scheduled', source: 'whatsapp')
    2. Update request.status = 'approved'
    3. Emit eventBus.emit('appointment:created', { appointment, source: 'whatsapp' })
    4. Simulate WhatsApp confirmation message back to patient
    5. Show toast: "Appointment confirmed for Sarah Kim"
    6. Calendar refreshes optimistically to show new appointment

MODIFY SLOT FLOW:
  Opens SlotSuggestionPicker with more options + manual date/time inputs.
  Same approve flow after selection.

REJECT FLOW:
  Show reason picker:
    - Fully booked that day
    - Dentist not available
    - Treatment not offered
    - Other (with text)
  On reject:
    - request.status = 'rejected'
    - Simulate WhatsApp message with alternatives
    - Toast: "Request rejected, patient notified"

EXPIRY LOGIC:
  Requests older than 24 hours without action → status: 'expired'
  Shown in a separate "Expired" tab of the panel.

================================================================================
================================================================================
🚶 FEATURE 3: DYNAMIC WALK-IN (Fix Existing Logic)
================================================================================
================================================================================

FOLDER: features/walk-in/

PROBLEM WITH CURRENT IMPLEMENTATION:
The existing walk-in flow needs correcting. It should:
  1. Immediately check availability across ALL dentists
  2. Show real-time queue position
  3. Auto-assign to first free dentist based on treatment type
  4. Handle overflow gracefully when clinic is full

FILES TO CREATE / MODIFY:

  features/walk-in/
    ├── components/
    │   ├── WalkInSheet.tsx              — main flow (replace existing if needed)
    │   ├── QueueStatusCard.tsx          — shows position + wait time
    │   ├── DentistAvailabilityGrid.tsx  — real-time dentist status
    │   └── OverflowHandler.tsx          — when clinic is fully booked
    ├── hooks/
    │   ├── useWalkInQueue.ts            — subscribes to queue state
    │   └── useAvailability.ts           — real-time availability
    ├── services/
    │   ├── walk-in.service.ts           — enqueue, assign, complete
    │   ├── availability.service.ts      — computes free slots NOW
    │   └── auto-assign.service.ts       — smart assignment logic
    ├── store/
    │   └── walk-in.store.ts             — queue state
    ├── types.ts
    └── index.ts

DATA MODEL:

  type WalkIn = {
    id: string;
    patient: { name: string; phone: string; isExisting: boolean; existingPatientId?: string };
    treatment: string;
    estimatedDuration: number;      // minutes
    arrivedAt: Date;
    status: 'waiting' | 'assigned' | 'in-progress' | 'completed' | 'left';
    queuePosition: number;
    assignedDentistId?: string;
    assignedAppointmentId?: string;
    estimatedWaitMinutes: number;
    priority: 'normal' | 'urgent' | 'emergency';
    notes?: string;
  };

AUTO-ASSIGN ALGORITHM:
  When a walk-in is added:
    1. Filter dentists who CAN perform the treatment
    2. For each eligible dentist:
       - Calculate their next free slot (after current appointment)
       - Compute estimated wait time
    3. Sort by shortest wait
    4. If wait < 30 min → auto-assign, notify dentist
    5. If wait 30-60 min → add to queue with position
    6. If wait > 60 min → suggest scheduled appointment instead
    7. If EMERGENCY priority → interrupt current schedule, notify all dentists

WALK-IN SHEET FLOW (4 steps):

  STEP 1: Patient
    - Search existing patient (autocomplete)
    - OR quick new patient form (name, phone, DOB)
    - Radio: Priority [Normal / Urgent / Emergency]

  STEP 2: Treatment
    - Chip list of common treatments
    - Estimated duration auto-fills
    - "Other" option with duration input

  STEP 3: Availability Preview
    - Real-time DentistAvailabilityGrid:
      ┌──────────────────────────────────────────┐
      │ Drg Soap Mactavish  · Busy until 11:30   │
      │ Wait: ~25 min · Queue position: 2         │
      ├──────────────────────────────────────────┤
      │ Drg Jerald O'Hara   · Free now ✓          │
      │ Can start immediately                     │
      ├──────────────────────────────────────────┤
      │ Drg Putri Larasati  · Off today          │
      │ Not available                             │
      └──────────────────────────────────────────┘
    - Recommended dentist highlighted with green ring
    - User can override selection

  STEP 4: Confirm
    - Summary: patient, treatment, assigned dentist, estimated start time
    - [Add to Queue] button
    - On confirm:
      * Create walk-in record
      * Emit eventBus.emit('walkin:added', { walkIn })
      * If auto-assigned: also emit eventBus.emit('walkin:assigned', ...)
      * Show queue position toast
      * Patient appears in dashboard Waiting Room card

DASHBOARD WAITING ROOM CARD UPGRADE:
  Show real queue with:
    - Position number (large)
    - Patient name
    - Assigned dentist (or "Awaiting assignment")
    - Wait time (color: green <15m, amber 15-30m, red >30m)
    - Actions: [Call to Reception] [Start Now] [Mark Left]

CALENDAR INTEGRATION:
  When a walk-in is assigned:
    - A new appointment appears on the calendar in the assigned slot
    - Card shows special badge: "🚶 Walk-in"
    - Card border-style: dashed instead of solid (visual distinction)

OVERFLOW HANDLER:
  If ALL dentists are booked and no slots for 2+ hours:
    - Show overflow modal:
      "Clinic is fully booked. Suggest patient:"
        • Book for later today (shows next available slot)
        • Book for tomorrow
        • Refer to nearest clinic (if configured)
        • Add to standby list (notify if cancellation)

================================================================================
================================================================================
❌ FEATURE 4: DRAG-TO-DELETE + LOG HISTORY
================================================================================
================================================================================

FOLDER: features/cancellation/

CRITICAL: EXISTING DRAG-AND-DROP RESCHEDULE MUST KEEP WORKING.
This feature ADDS a new drop target — the trash zone. It does not modify 
the existing dnd logic for time-slot drops.

FILES TO CREATE / MODIFY:

  features/cancellation/
    ├── components/
    │   ├── TrashDropZone.tsx            — floating trash zone that appears on drag
    │   ├── CancellationConfirmDialog.tsx — confirm + reason picker
    │   └── LogHistoryTable.tsx          — enhanced log history view
    ├── hooks/
    │   ├── useDragCancel.ts             — hooks into existing dnd context
    │   └── useCancellationLog.ts        — reads log entries
    ├── services/
    │   ├── cancellation.service.ts      — handles cancel + log write
    │   └── log-history.service.ts       — CRUD for log entries
    ├── store/
    │   └── log-history.store.ts         — cached log entries
    ├── types.ts
    └── index.ts

TRASH DROP ZONE UI:
  - Fixed position: bottom-center of viewport
  - Hidden by default
  - Appears with fade-in + slide-up when user starts dragging any appointment
  - Uses framer-motion (already in codebase)
  - Design:
      ┌────────────────────────────────┐
      │  🗑️  Drop here to cancel        │
      │  ────────────────────────────   │
      │  Cancellation will be logged    │
      └────────────────────────────────┘
  - When hovered during drag: scale up + red glow border
  - z-index above calendar

INTEGRATION WITH EXISTING DND:
  The existing @dnd-kit setup already has a DndContext. Do NOT create a new one.
  Instead:
    1. Add TrashDropZone as a new <Droppable id="trash-zone"> INSIDE the 
       existing DndContext
    2. In the existing onDragEnd handler, add a check:
         if (event.over?.id === 'trash-zone') {
           openCancellationConfirmDialog(event.active.data.current);
           return;  // early return, don't run reschedule logic
         }
         // ... existing reschedule logic unchanged
    3. TrashDropZone visibility is controlled by useDndMonitor() hook:
         const { active } = useDndMonitor({ ... });
         if (active) show; else hide;

CANCELLATION CONFIRM DIALOG:
  Reuses existing CancelDialog component if possible.
  If not, create new one with same design:
    ┌─────────────────────────────────────┐
    │ Cancel Appointment              [X] │
    ├─────────────────────────────────────┤
    │ ⚠️ Cancel appointment for            │
    │    Rafli Jainudin?                  │
    │    Fri 16 May · 09:00–10:00 AM      │
    │                                       │
    │ REASON *                              │
    │ ○ Patient requested                   │
    │ ○ Patient didn't show                 │
    │ ○ Dentist unavailable                 │
    │ ○ Emergency                           │
    │ ○ Duplicate booking                   │
    │ ○ Other                               │
    │                                       │
    │ NOTES (optional)                      │
    │ [                                 ]   │
    │                                       │
    │ ☑ Notify patient via SMS              │
    │ ☐ Offer to rebook                     │
    ├─────────────────────────────────────┤
    │ [Keep Appointment]  [Confirm Cancel] │
    └─────────────────────────────────────┘

ON CONFIRM CANCEL:
  1. Call cancellationService.cancel(appointmentId, { reason, notes, notify })
  2. Service does:
     a. Update appointment status → 'cancelled'
     b. Create log entry in log_history table (or mock store)
     c. If notify: trigger SMS (mock)
     d. Emit eventBus.emit('appointment:cancelled', { appointmentId, reason, cancelledBy })
  3. Toast: "Appointment cancelled and logged"
  4. Calendar removes the card with fade-out animation
  5. Dashboard KPIs update

LOG ENTRY MODEL:

  type LogEntry = {
    id: string;
    action: 'created' | 'rescheduled' | 'cancelled' | 'no-show' | 'checked-in' 
          | 'completed' | 'paid' | 'walk-in-added' | 'whatsapp-approved';
    entityType: 'appointment' | 'walk-in' | 'patient';
    entityId: string;
    performedBy: {
      userId: string;
      userName: string;
      role: string;
    };
    timestamp: Date;
    metadata: Record<string, any>;  // action-specific data
    description: string;             // human-readable summary
  };

  Example cancellation log:
  {
    action: 'cancelled',
    entityType: 'appointment',
    entityId: 'apt_123',
    performedBy: { userId: '...', userName: 'Darrell Steward', role: 'receptionist' },
    timestamp: new Date(),
    metadata: {
      patientName: 'Rafli Jainudin',
      originalSlot: { date: '2022-05-16', startTime: '09:00', endTime: '10:00' },
      dentistName: 'Drg Soap Mactavish',
      reason: 'Patient requested',
      notes: 'Patient sick',
      notified: true,
      cancelMethod: 'drag-to-trash'  // or 'menu-action'
    },
    description: 'Cancelled appointment for Rafli Jainudin (originally Fri 16 May 09:00–10:00 with Drg Soap Mactavish). Reason: Patient requested.'
  }

LOG HISTORY TAB (upgrade existing "Log History" tab in Reservations):

  Enhanced UI:
    - Filter bar: [Action ▼] [Date range] [Performed by ▼] [Search]
    - Table columns:
      Time | Action | Entity | Details | Performed by | Actions
    - Row hover: subtle bg
    - Click row: expands to show full metadata
    - Actions column: [↶ Restore] (only for cancelled → creates new appointment 
      from log data)
    - Export button: download as CSV

CENTRAL LOGGING (log EVERYTHING, not just cancellations):
  The log-history.service.ts should also log:
    - Appointments created (manual, walk-in, whatsapp)
    - Appointments rescheduled (existing dnd should call log)
    - Check-ins, completions, payments
    - Walk-ins added
    - WhatsApp requests approved/rejected
  
  Do this via eventBus listeners in a single central logger:
    features/cancellation/services/log-history.service.ts
      → subscribes to ALL relevant events
      → writes log entries automatically
  
  This is where "features don't touch each other" pays off — the logger 
  passively listens and none of the other features know it exists.

================================================================================
================================================================================
🧩 CROSS-FEATURE WIRING (Read Carefully)
================================================================================
================================================================================

The four features connect ONLY through the event bus. No direct imports.

FLOW EXAMPLES:

  1. WhatsApp booking approved:
     [whatsapp-agent] emits 'appointment:created' with source: 'whatsapp'
        ↓
     [cancellation logger] listens → writes log entry
        ↓
     [calendar UI] listens → re-renders with new appointment
        ↓
     [dashboard KPIs] listen → increment count

  2. Walk-in assigned to slot:
     [walk-in] emits 'walkin:assigned' + 'appointment:created' with source: 'walk-in'
        ↓
     [cancellation logger] listens → writes log entry
        ↓
     [calendar UI] listens → shows appointment with walk-in badge
        ↓
     [dashboard waiting room] listens → updates queue

  3. Drag-to-cancel:
     [cancellation] emits 'appointment:cancelled'
        ↓
     [cancellation logger] writes log entry (same feature, but decoupled)
        ↓
     [calendar UI] removes card
        ↓
     [dashboard KPIs] update

  4. User logs in:
     [auth] emits 'auth:login'
        ↓
     [whatsapp-agent] listens → starts polling for requests for this user's clinic
        ↓
     [walk-in] listens → loads queue for this user's clinic
        ↓
     [log history] listens → filters logs to this clinic

This means: you can turn OFF any feature via feature flag, and the others 
keep working. The event bus emits, no one listens, nothing breaks.

================================================================================
🚫 ANTI-PATTERNS TO AVOID
================================================================================

❌ Direct feature-to-feature imports:
   // BAD
   import { walkInStore } from '@/features/walk-in/store/walk-in.store';
   // in features/whatsapp-agent/some-file.ts

✅ Use event bus:
   // GOOD
   eventBus.emit('appointment:created', {...});

❌ Modifying existing dnd logic:
   // BAD
   Rewriting the onDragEnd in CalendarBoard.tsx

✅ Extend via composition:
   // GOOD
   Add trash zone as new droppable, add ONE if-check in existing handler.

❌ Removing/renaming existing exports:
   // BAD
   export const WalkInSheet renamed to WalkInModal

✅ Add new files, deprecate old:
   // GOOD
   Keep old WalkInSheet, create WalkInSheetV2, gradually migrate.

❌ Global state mutations:
   // BAD
   const globalState = { ...updated }; // mutates outer state

✅ Immutable updates in dedicated stores:
   // GOOD
   set((state) => ({ items: [...state.items, newItem] }))

================================================================================
📋 EXECUTION CHECKLIST (Do In Order)
================================================================================

PHASE 1: Foundation (do these first)
  ☐ Create lib/event-bus.ts (typed pub/sub)
  ☐ Create lib/feature-flags.ts
  ☐ Create features/ folder structure
  ☐ Move existing pages under app/(protected)/ route group
  ☐ Create app/(auth)/ route group with placeholder pages

PHASE 2: Supabase Auth
  ☐ Install @supabase/supabase-js and @supabase/ssr
  ☐ Create lib/supabase/ clients
  ☐ Create features/auth/ with all files
  ☐ Build LoginForm, SignupForm, ForgotPasswordForm
  ☐ Implement middleware.ts for route protection
  ☐ Update existing UserMenu with real user data
  ☐ Add mock mode fallback
  ☐ Test: login → dashboard, logout → login, protected routes redirect

PHASE 3: Cancellation + Log History
  ☐ Create features/cancellation/ structure
  ☐ Build TrashDropZone component
  ☐ Wire into existing DndContext (add ONE droppable, ONE if-check)
  ☐ Create central log-history.service with event bus subscriptions
  ☐ Enhance Log History tab UI
  ☐ Test: drag existing appointment to trash → dialog → confirm → gone + logged
  ☐ Test: existing reschedule drag still works perfectly

PHASE 4: Walk-in Fix
  ☐ Create features/walk-in/ structure
  ☐ Build availability + auto-assign services
  ☐ Rebuild WalkInSheet with 4-step flow
  ☐ Update dashboard Waiting Room card
  ☐ Add walk-in badge to calendar appointment cards
  ☐ Wire event bus emissions
  ☐ Test: emergency walk-in interrupts schedule, normal walks queue properly

PHASE 5: WhatsApp Agent
  ☐ Locate existing WhatsApp simulator
  ☐ Create features/whatsapp-agent/ structure
  ☐ Build slot-matcher algorithm
  ☐ Build BookingRequestPanel + Card + SlotSuggestionPicker
  ☐ Add BookingRequestBadge to header
  ☐ Add WhatsApp Requests card to dashboard
  ☐ Bridge simulator submissions to bookingRequestService (ONE function call)
  ☐ Test: fill form in simulator → notification in main app → approve → 
     appointment appears in calendar

PHASE 6: Verification
  ☐ Every feature works with others turned OFF via feature flags
  ☐ Existing reschedule dnd still works
  ☐ No console errors on any page
  ☐ Every route has loading skeleton
  ☐ Lighthouse ≥ 95 on dashboard and reservations
  ☐ Zero `any` types in new code
  ☐ Log history captures every state change

================================================================================
✅ ACCEPTANCE CRITERIA
================================================================================

AUTHENTICATION:
  ☐ Real Supabase login works (with env vars)
  ☐ Mock mode works (without env vars) — auto-login as receptionist
  ☐ Middleware protects (protected) routes
  ☐ Session persists across page reloads
  ☐ Logout clears session and redirects
  ☐ No flash-of-unauthenticated-content

WHATSAPP AGENT:
  ☐ Bot form submission creates BookingRequest (not appointment)
  ☐ Receptionist sees badge with count in header
  ☐ Panel shows request with conversation snippet
  ☐ Slot suggestions are ranked by preference match
  ☐ Approve creates real appointment on calendar
  ☐ Reject sends alternative message
  ☐ Expired requests handled

WALK-IN:
  ☐ 4-step flow completes end-to-end
  ☐ Auto-assign picks best dentist based on availability
  ☐ Emergency priority interrupts scheduling
  ☐ Overflow modal appears when clinic is full
  ☐ Waiting room card shows real queue with wait times
  ☐ Calendar shows walk-in appointments with distinct badge

DRAG-TO-CANCEL:
  ☐ Trash zone appears only during drag
  ☐ Existing reschedule drag still works perfectly (regression test)
  ☐ Drop on trash opens confirm dialog
  ☐ Confirmed cancellation is logged with full metadata
  ☐ Log history table shows all cancellations
  ☐ Log has action="cancelled" and cancelMethod="drag-to-trash"

ARCHITECTURE:
  ☐ Each feature folder is self-contained
  ☐ No feature imports from another feature
  ☐ All cross-feature comms via event bus
  ☐ Feature flags can disable any feature without breakage
  ☐ Service layer hides Supabase implementation

================================================================================
🏁 FINAL RULES
================================================================================

1. If unsure whether to modify existing code, DON'T. Add a new file.
2. If two things could be one file, make them two files.
3. Every new feature is behind a flag.
4. Every side effect is an emitted event.
5. Every event has typed payload.
6. Every store is scoped to a feature.
7. Every service is testable in isolation.
8. Existing code paths MUST continue working.

Read this entire document. Confirm you understand. Then execute phases in order.
Report progress after each phase completes.

GO. 🚀