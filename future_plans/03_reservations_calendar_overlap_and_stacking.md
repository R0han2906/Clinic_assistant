# Implementation Plan: 03 — Reservations Calendar Collision Layout & Card Stacking

## 1. Overview & Objectives
Solve appointment card collisions, overlaps, and stacking on the **Reservations Calendar Board (`/reservations`)**. When multiple appointments occur at the same time (e.g. walk-ins added during scheduled slots, overlapping emergency visits, reassigned doctors, or cancelled slot remnants), the calendar must dynamically compute multi-track column subdivisions, cascading offsets, and distinct visual treatments so every card remains 100% legible, accessible, and clickable.

---

## 2. Collision Layout Algorithm & Visual Strategy

```
Standard Single Card:
┌──────────────────────────────────────────────┐
│ [09:00 - 10:00] Arthur Taylor (Scaling)       │ (width: 100%, left: 0%)
└──────────────────────────────────────────────┘

Overlapping Simultaneous Cards (e.g. 2 Bookings at 10:00):
┌───────────────────────┬──────────────────────┐
│ [10:00] Sarah Connor  │ [10:00] Walk-In      │ (width: calc(50% - 4px))
│ Root Canal (Active)   │ Emergency Toothache  │ (track 0 & track 1 side-by-side)
└───────────────────────┴──────────────────────┘

Active Slot over Cancelled Slot:
┌ - - - - - - - - - - - - - - - - - - - - - - -┐  <- Cancelled (translucent, 
│ [11:00] [CANCELLED] John Doe                 │     dashed border, z-index: 1)
├──────────────────────────────────────────────┤
│ 🟢 [11:00] [NEW] Michael Chang (Confirmed)    │  <- Active Reassignment
│ Extraction · Dr. Darrell                     │     (solid, elevated, z-index: 10)
└──────────────────────────────────────────────┘
```

---

## 3. Algorithm: Multi-Track Graph Partitioning

### 3.1 Interval Conflict Graph Computation
For each dentist column on the selected date:
1. **Sort Appointments**: Sort all appointments ascending by `start_time`, and descending by `duration`.
2. **Cluster Overlaps**: Group appointments into continuous "conflict clusters" where `next.start_time < current.end_time`.
3. **Track Assignment (Greedy Coloring)**:
   - For each appointment in a cluster, assign the lowest available track index `k` (`0, 1, 2, ... K-1`) such that no earlier overlapping appointment in the same cluster shares track `k`.
4. **CSS Geometry Calculation**:
   - `totalTracks = max(cluster.tracks) + 1`
   - `widthPercent = (100 / totalTracks)`
   - `leftPercent = trackIndex * widthPercent`
   - `cardStyle = { left: 'calc(${leftPercent}% + 2px)', width: 'calc(${widthPercent}% - 4px)', top: '${topPx}px', height: '${heightPx}px' }`

---

## 4. Visual State Differentiation & Hierarchy

| Appointment State | Visual Treatment | Stacking Priority (`z-index`) |
|---|---|---|
| **Active / Confirmed (`scheduled`, `checked-in`)** | Solid vibrant background, sharp border, high shadow elevation (`shadow-md`). | `z-index: 10` |
| **In-Progress (`in-progress`)** | Pulsing cyan outline, active timer pill, highlighted background. | `z-index: 20` |
| **Completed / Paid** | Crisp emerald border, muted status checkmark badge. | `z-index: 10` |
| **Cancelled (`cancelled`)** | **Translucent background (opacity 0.45)**, diagonal watermark stripes, dashed red/slate border, strikethrough patient title. If an active appointment replaces this time, the cancelled card snaps to a compact ghost capsule or sits behind the active card. | `z-index: 1` |
| **Reassigned / Conflict** | Amber warning indicator badge (`Reassigned from Dr. X`), clickable to view reassignment history log. | `z-index: 15` |

---

## 5. Detailed Step-by-Step Implementation

### Step 1: Collision Engine Utility
- **File**: `frontend/lib/calendar-collision.ts`
- Implement pure helper functions:
  - `computeCalendarLayout(appointments: Appointment[]): PositionedAppointment[]`
  - `calculateTimeSpan(startStr: string, endStr: string): { topPx: number, heightPx: number }`

### Step 2: Update `CalendarBoard.tsx` Render Loop
- **File**: `frontend/components/reservations/CalendarBoard.tsx`
- Replace naive full-width placement with layout-engine coordinates:
  ```tsx
  const positionedList = useMemo(() => {
    return computeCalendarLayout(dentistAppointments)
  }, [dentistAppointments])
  ```
- Apply calculated `style={{ top, height, left, width, zIndex }}` to each appointment card.

### Step 3: Interactive Ghost & Stacked Card Hover
- When hovering over overlapping or stacked cards:
  - Elevate the hovered card to `z-index: 50` with a smooth scale transition (`scale-[1.02]`).
  - Render an interactive tooltip showing conflicting appointment details and quick resolve actions ("Reassign Doctor", "Reschedule Slot", "View Notes").

---

## 6. Verification & Edge Cases
1. **Triple Simultaneous Booking**: 3 overlapping walk-ins/appointments at 10:00 AM render cleanly in 3 equal columns (33.3% width each) with zero clipped text.
2. **Cancelled Replacement**: When appointment A is cancelled and appointment B is booked in the same slot, B is prominently visible and selectable without A blocking clicks.
3. **Drag and Drop on Overlapped Slots**: Dragging an appointment onto a partially occupied hour snaps cleanly to the target time and validates availability in real time.
