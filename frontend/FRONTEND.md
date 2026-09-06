# Zendenta Frontend — Architecture, Context & Component Guide

> **Project:** Zendenta — Receptionist-First Dental Clinic Management System  
> **Target User:** Clinic receptionists (scheduling, check-ins, queue management, billing)  
> **Architecture:** Next.js 16 App Router (Turbopack) + Tailwind CSS v4 + TypeScript  
> **Status:** Zendenta v3 Receptionist-First Upgrade Complete  
> **Last Updated:** September 2026

---

## 1. Executive Summary & Zendenta v3 Upgrade

Zendenta v3 aligns the clinic management dashboard with the **Clinic Receptionist** persona. The receptionist is the front-desk orchestrator responsible for intake, scheduling, queue monitoring, and billing. Clinical examinations and medical checkup modifications are separated from the receptionist's permissions.

### Core Upgrades in Zendenta v3:
1. **Next.js 16 Server vs. Client Component Discipline**:
   - `app/reservations/page.tsx` and `app/patients/page.tsx` are static **Server Components** rendering interactive Client Component shells (`CalendarBoard.tsx` and `PatientsDirectory.tsx`).
   - Extracted `PatientRow.tsx` and `PatientAvatar.tsx` as Client Components to prevent Server Component `<img onError>` runtime errors.
2. **7-State Appointment Lifecycle Engine** (`lib/appointment-lifecycle.ts`):
   - Strict state transitions: `scheduled` → `checked-in` → `in-progress` → `completed` → `paid` (plus `cancelled` & `no-show` rebook paths).
   - Receptionist actions mapped directly to appointment status.
3. **Receptionist Role Permissions**:
   - Replaced dentist-only *"Edit Medical Checkup"* with read-only *"View Visit Summary"* (`VisitSummaryPanel.tsx`), *"Receptionist Admin Notes"*, and *"View Medical Records"*.
   - User profile badge in header identifies user as `Darrell Steward · Receptionist`.
   - Reports partitioned into accessible Operational Reports and restricted `[Admin Only]` Financial Reports.
4. **Interactive Dialogs (`next/dynamic` with `{ ssr: false }`)**:
   - **Take Payment Dialog** (`TakePaymentDialog.tsx`): 480px modal for recording payments and transitioning status to `paid`.
   - **Visit Summary Panel** (`VisitSummaryPanel.tsx`): Read-only chief complaint, diagnosis, prescriptions, and billing.
   - **Reschedule Dialog** (`RescheduleDialog.tsx`): Slot chips and date picker.
   - **Cancel Dialog** (`CancelDialog.tsx`): Cancellation reasons and rebook triggers.
   - **Walk-In Intake Drawer** (`WalkInSheet.tsx`): 4-step intake drawer feeding into lobby queue.
5. **Dashboard Enhancements**:
   - Status-aware Up Next card (displays *"Notify Dentist"* once checked in).
   - Waiting Room lobby queue with color-coded wait durations (amber at ≥ 10 min, red at ≥ 20 min).
   - Greeting header `+ Walk-In Intake` button and Quick Actions tiles.
6. **Zero-Mock Real Data Policy**:
   - 100% elimination of mock datasets across all routes (`reservations`, `dashboard`, `patients`, `staff`, `sales`, `stocks`, `purchases`, `accounts`, `payment-methods`, `treatments`).
   - Components initialize to empty arrays and render live backend data (`PAT-XXXXXX`, `APT-XXXXXX`, `DOC-XXXXXX`) or responsive empty states.
7. **Interactive Drag-and-Drop Rescheduling**:
   - Built-in HTML5 drag-and-drop on `CalendarBoard.tsx`.
   - Cards are draggable with duration preservation; dentist hour slots serve as drop targets with highlighted dropzones (`bg-primary/20 border-dashed`).
   - Persists automatically via `POST /api/v1/appointments/{id}/reschedule` with optimistic updates and conflict rollback.

---

## 2. Tech Stack & Standards

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Framework | Next.js (App Router) | 16.3.3 | Hybrid Server/Client rendering, Turbopack dev server |
| Language | TypeScript | 5.7.3 | Strict end-to-end typing |
| Styling | Tailwind CSS v4 | ^4.3.3 | Modern CSS-first engine using `oklch()` design tokens |
| Component Base | shadcn/ui (`@base-ui/react`) | ^4.11.0 | Accessible primitive components |
| Icons | Lucide React | ^1.16.0 | Semantic iconography across all modules |
| State | Zustand | ^5.0.15 | UI sidebar and layout state |
| Animation | Framer Motion | ^13.2.0 | Layout transitions and modal backdrops |
| Package Manager | pnpm | ^9.0.0 | Fast, deterministic package management |

---

## 3. Project Directory Structure

```text
frontend/
├── app/
│   ├── layout.tsx                    # Root layout wrapping all pages in <LayoutShell>
│   ├── page.tsx                      # Server redirect: / → /dashboard
│   ├── loading.tsx                   # Global root loading skeleton
│   ├── globals.css                   # Tailwind v4 tokens & color variables
│   ├── dashboard/
│   │   └── page.tsx                  # Dashboard with Up Next, Waiting Room, KPIs, Walk-In trigger
│   ├── reservations/
│   │   ├── page.tsx                  # Server Component shell for calendar
│   │   └── loading.tsx               # Calendar loading skeleton
│   ├── patients/
│   │   ├── page.tsx                  # Server Component shell for patient directory
│   │   ├── loading.tsx               # Patients list loading skeleton
│   │   └── [id]/page.tsx             # Patient profile & visit history
│   ├── treatments/
│   │   ├── page.tsx                  # 3-column procedure catalog with category border-tops
│   │   └── loading.tsx               # Treatments loading skeleton
│   ├── staff/
│   │   ├── page.tsx                  # Staff directory & status badges
│   │   └── loading.tsx               # Staff loading skeleton
│   ├── reports/page.tsx              # Role-partitioned operational vs restricted financial reports
│   ├── sales/page.tsx                # Billing records & revenue breakdown
│   ├── purchases/page.tsx            # Supply orders & vendor management
│   ├── stocks/page.tsx               # Inventory tracking & low-stock alerts
│   ├── payment-methods/page.tsx      # Payment methods configuration
│   ├── accounts/page.tsx             # Financial accounts overview
│   ├── peripherals/page.tsx          # Physical clinic hardware assets
│   └── support/page.tsx              # Clinic support contacts & tickets
│
├── components/
│   ├── appointments/
│   │   ├── CancelDialog.tsx          # Modal for cancelling appointments with reasons
│   │   ├── RescheduleDialog.tsx      # Modal for rebooking time slots
│   │   ├── ReservationDrawer.tsx     # Status-driven appointment detail drawer
│   │   ├── VisitSummaryPanel.tsx     # Read-only post-appointment clinical report
│   │   └── WalkInSheet.tsx           # 4-step walk-in intake drawer
│   ├── dashboard/
│   │   └── DashboardQuickActions.tsx # Quick actions tiles (Intake, Appointment, Pay, Reports)
│   ├── layout/
│   │   ├── Header.tsx                # Dynamic header with Receptionist user badge & search
│   │   ├── LayoutShell.tsx           # Collapsible sidebar & responsive layout shell
│   │   └── Sidebar.tsx               # Navigation with section headings & active highlighting
│   ├── patients/
│   │   ├── PatientAvatar.tsx         # Client avatar with safe onError initials fallback
│   │   ├── PatientRow.tsx            # Client patient row component
│   │   └── PatientsDirectory.tsx     # Client patient directory with search & filters
│   ├── payments/
│   │   └── TakePaymentDialog.tsx     # 480px payment intake modal
│   └── reservations/
│       └── CalendarBoard.tsx         # Client calendar board & deduplicated hourly grid
│
├── lib/
│   ├── api-client.ts                 # Type-safe API client with graceful offline fallbacks
│   ├── appointment-lifecycle.ts      # 7-state machine, allowed transitions & action mapper
│   ├── constants.ts                  # Navigation configs & keyboard shortcuts
│   ├── formatters.ts                 # Currency and duration formatters
│   ├── mock-data.ts                  # Authoritative dataset for offline reliability
│   └── utils.ts                      # ClassName merger (clsx + tailwind-merge)
└── types/
    ├── api.ts                        # Backend DTOs & response schemas
    └── index.ts                      # Internal domain interfaces
```

---

## 4. Server vs. Client Component Boundaries

Next.js 16 strictly forbids DOM event handlers (`onClick`, `onError`, `onChange`) in Server Components. Zendenta uses a **Server Component Data Provider + Client Component Interactive Shell** architecture:

```
[app/reservations/page.tsx (Server Component)]
    │
    └── <CalendarBoard (Client Component 'use client')>
            ├── <ReservationDrawer (dynamic)>
            ├── <VisitSummaryPanel (dynamic)>
            ├── <TakePaymentDialog (dynamic)>
            ├── <RescheduleDialog (dynamic)>
            └── <CancelDialog (dynamic)>

[app/patients/page.tsx (Server Component)]
    │
    └── <PatientsDirectory (Client Component 'use client')>
            └── <PatientRow (Client Component 'use client')>
                    └── <PatientAvatar (Client Component 'use client')>
```

### Key Architectural Invariants:
1. **Zero Event Handlers in Server Components**: Every component with an interactive event handler or state hook contains `'use client'` at the very top.
2. **Lazy Dialog Loading**: Heavy modals are imported via `dynamic(() => import(...), { ssr: false })` to optimize First Contentful Paint (FCP) and Lighthouse performance.
3. **Guaranteed Unique Keys**: All mapped appointment elements in the calendar grid enforce composite unique keys: `cal-${docId}-${appt.id || appt.appointment_id || 'apt'}-${idx}`.

---

## 5. Appointment Lifecycle State Machine

Defined in `lib/appointment-lifecycle.ts`:

### 7 Canonical States
1. `scheduled` — Booked for future slot.
2. `checked-in` — Patient has arrived in the clinic lobby.
3. `in-progress` — Patient is currently in the dental operatory with the dentist.
4. `completed` — Dental procedure finished; visit summary recorded; awaiting payment.
5. `paid` — Bill settled in full; receipt issued.
6. `cancelled` — Appointment cancelled prior to procedure.
7. `no-show` — Patient failed to arrive for scheduled time.

### Valid Receptionist Actions per Status
- **`scheduled`**: Check In, Reschedule, Cancel, Call Patient, Send Reminder SMS.
- **`checked-in`**: Notify Dentist, Mark No-Show, Cancel.
- **`in-progress`**: View Only (disabled during procedure).
- **`completed`**: Take Payment, View Visit Summary, Book Follow-up, Print Receipt.
- **`paid`**: Send Thank-You, Book Follow-up, View Summary.
- **`cancelled`**: Rebook, Contact Patient.
- **`no-show`**: Follow-Up Call, Rebook, Flag Patient for Attendance Policy.

---

## 6. Offline-First & API Resilience

The frontend communicates with the FastAPI backend at `http://localhost:8000`. Every API call in `lib/api-client.ts` is wrapped in safe error-catching handlers. If the backend server is temporarily offline:
- The UI seamlessly falls back to the curated mock dataset in `lib/mock-data.ts`.
- The terminal remains clean without unhandled network exception dumps.
- Receptionists can continue testing workflows (taking payments, rescheduling, walk-in intakes) with optimistic local state updates.

---

## 7. Full-Stack Backend API Wiring

Zendenta v3 features end-to-end integration between frontend actions and backend REST endpoints:

| Frontend User Action | Component | Backend Endpoint | Request Payload |
|---|---|---|---|
| Status transition (Check In, Start, Complete, Cancel) | `CalendarBoard.tsx`, `ReservationDrawer.tsx` | `PATCH /api/v1/appointments/{id}/status` | `{ "status": "checked-in", "notes": "..." }` |
| View clinical summary | `VisitSummaryPanel.tsx` | `GET /api/v1/appointments/{id}/visit-summary` | (None) |
| Save clinical summary | `VisitSummaryPanel.tsx` | `POST /api/v1/appointments/{id}/visit-summary` | `{ "diagnosis": "...", "prescriptions": [...] }` |
| Take payment | `TakePaymentDialog.tsx` | `PATCH /api/v1/appointments/{id}/payment` | `{ "payment_status": "PAID", "bill_number": "..." }` |
| Walk-in intake | `WalkInSheet.tsx` | `POST /api/v1/patients`<br>`POST /api/v1/appointments` | Patient data + `{ "source": "WALK_IN", "status": "checked-in" }` |
| Reschedule appointment | `RescheduleDialog.tsx` | `POST /api/v1/appointments/{id}/reschedule` | `{ "new_date": "...", "new_start_time": "..." }` |
| Cancel appointment | `CancelDialog.tsx` | `POST /api/v1/appointments/{id}/cancel` | `{ "reason": "Patient requested" }` |
| Patient Directory search | `PatientsDirectory.tsx` | `GET /api/v1/patients?query=...` | (Query param) |
| On-demand CSV export | `PatientsDirectory.tsx` | `GET /api/v1/export/patients.csv` | Direct download stream |

