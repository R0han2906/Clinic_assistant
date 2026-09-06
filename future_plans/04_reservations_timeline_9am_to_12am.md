# Implementation Plan: 04 — Extended Calendar Timeline (9:00 AM to 12:00 AM Midnight)

## 1. Overview & Objectives
Extend the operational timeline on the **Reservations Calendar Board (`/reservations`)** from the standard 8-hour window to a complete **15-Hour Clinical Schedule (9:00 AM to 12:00 AM / 24:00 Midnight)**. This accommodates late-evening emergency shifts, after-hours dental surgeries, on-call doctor rotations, and midnight walk-ins while maintaining responsive UI scrolling and crisp slot readability.

---

## 2. Timeline Grid Geometry & Slot Coordinates

### 2.1 Time Span Specification
- **Start Time**: `09:00 AM` (Hour `9.00`, Offset `0px`)
- **End Time**: `12:00 AM Midnight` / `24:00` (Hour `24.00`, Offset `15 * HOUR_HEIGHT`)
- **Total Duration**: `15 Continuous Operational Hours`
- **Slot Granularity**: 15-minute / 30-minute / 60-minute grid snap lines.

### 2.2 Height & Pixel Coordinate Calculation
```typescript
export const CALENDAR_START_HOUR = 9   // 09:00 AM
export const CALENDAR_END_HOUR = 24    // 12:00 AM Midnight (24:00)
export const TOTAL_HOURS = CALENDAR_END_HOUR - CALENDAR_START_HOUR // 15 Hours
export const HOUR_HEIGHT_PX = 80       // 80px per hour (total column height: 1200px)

/** Convert any time string (12h or 24h) to top pixel position */
export function timeToTopPx(timeStr: string): number {
  const decimalHour = parseTimeToHour(timeStr) // e.g. "11:30 PM" -> 23.5
  const clampedHour = Math.max(CALENDAR_START_HOUR, Math.min(CALENDAR_END_HOUR, decimalHour))
  return (clampedHour - CALENDAR_START_HOUR) * HOUR_HEIGHT_PX
}

/** Calculate appointment card height in pixels */
export function durationToHeightPx(durationMinutes: number): number {
  return Math.max(32, (durationMinutes / 60) * HOUR_HEIGHT_PX)
}
```

---

## 3. Hour Markers & Grid Visual Breakdown

```
Time Axis           Dr. Darrell Steward       Dr. Sarah Jenkins        Emergency Station
09:00 AM   ────────┬─────────────────────────┬────────────────────────┬───────────────────
10:00 AM   ────────┼─────────────────────────┼────────────────────────┼───────────────────
...                 │                         │                        │
01:00 PM (Lunch)  ░░▒▒ (Muted Break Zone) ▒▒░░│                        │
...                 │                         │                        │
06:00 PM (Evening) ──┼─────────────────────────┼────────────────────────┼───────────────────
09:00 PM (Night)   ──┼─────────────────────────┼────────────────────────┼───────────────────
11:00 PM (Late)    ──┼─────────────────────────┼────────────────────────┼───────────────────
12:00 AM (Close)   ──┴─────────────────────────┴────────────────────────┴───────────────────
```

---

## 4. Detailed Step-by-Step Implementation

### Step 1: Update Hours Array Generator
- **File**: `frontend/lib/constants.ts` or `frontend/components/reservations/CalendarBoard.tsx`
- Replace existing 9 AM - 5 PM array with the complete 15-hour sequence:
  ```typescript
  export const CALENDAR_HOURS = [
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM',
    '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM',
    '09:00 PM', '10:00 PM', '11:00 PM', '12:00 AM',
  ]
  ```

### Step 2: Update Time Parsing Helper for 24h / Midnight Boundaries
- **File**: `frontend/components/reservations/CalendarBoard.tsx`
- Support parsing `"12:00 AM"`, `"00:00"`, `"24:00"`, and late-night ranges:
  ```typescript
  function parseTimeToHour(timeStr: string): number {
    if (!timeStr) return 9
    // Handle midnight boundary specifically
    if (/12:00\s*am/i.test(timeStr) || timeStr.startsWith('24:00')) return 24
    if (/12:30\s*am/i.test(timeStr)) return 24.5

    // Standard 12-hour AM/PM and 24-hour parsing
    // ...
  }
  ```

### Step 3: Current Time Red Indicator Line & Auto-Scroll
- Render a live red timeline cursor (`CurrentTimeIndicator`) that updates every 60 seconds with current time badge (e.g. `● 08:42 PM`).
- Add an automatic `useEffect` scroll: when the receptionist loads the calendar, smoothly auto-scroll the grid to center the current hour in view.

### Step 4: Backend Availability & Booking Alignment
- **File**: `backend/app/services/availability_service.py`
- Ensure `CLINIC_START_TIME = "09:00"` and `CLINIC_END_TIME = "24:00"` allow generating evening/night appointment slots when doctor schedules are configured.

---

## 5. Verification & Testing Checklist
- [ ] Calendar vertical column smoothly scrolls through all 15 hours from 09:00 AM to 12:00 AM Midnight.
- [ ] An appointment booked at `10:30 PM` positions accurately at `(22.5 - 9) * 80px = 1080px` from the top.
- [ ] Drag-and-drop rescheduling cleanly drops and snaps cards into late evening slots (e.g. 9 PM, 10 PM, 11 PM).
- [ ] Booking modal dropdown offers all valid time slots across the full 9 AM - 12 AM span.
