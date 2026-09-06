# Implementation Plan: 02 — Header Clutter Removal & Staff "My Account" Hub

## 1. Overview & Objectives
Streamline the global **Top Navigation Header** by stripping out redundant, distracting icons (Activity, CircleHelp, Settings) and consolidating staff tools into a single, high-polish **"My Account" Profile & Action Menu**. 

> [!NOTE]
> **No Login Required**: The "My Account" menu acts as a direct-access staff switchboard (switching between receptionists, active doctor stations, operatory rooms, and dark/light mode) without requiring passwords or login sessions.

---

## 2. Before & After Header Architecture

### 2.1 Current Cluttered Header
```
[Sidebar Toggle] [Page Title] | [Search Bar] [+] [?] [Activity] [Settings] | [Avatar + Name]
                                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ (Cluttered & Redundant)
```

### 2.2 New Minimalist & Elegant Header
```
[Sidebar Toggle] [Page Title] [Branch/Status Badge]  ---------->  [Quick Walk-In +] [My Account ▾]
```

---

## 3. "My Account" Staff Menu Structure

```
┌─────────────────────────────────────────────────────────┐
│  👤 Darrell Steward (Front-Desk Lead)                  │
│     Active Station: Reception Desk 1                    │
│     ID: STF-000001 · Main Clinical Center               │
├─────────────────────────────────────────────────────────┤
│  🔄  Switch Active Staff Member / Receptionist          │
│  🩺  Switch Assigned Doctor / Operatory Room            │
│  🏢  Clinic Profile & Operating Hours                   │
│  🌓  Theme Switcher (Light / Dark / System)             │
├─────────────────────────────────────────────────────────┤
│  📖  Keyboard Shortcuts Guide (Ctrl+B, Ctrl+K)          │
│  ⚡  Quick Demo Data Reset                              │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Detailed Step-by-Step Implementation

### Step 1: Clean Up Header Icon Clutter
- **File**: `frontend/components/layout/Header.tsx`
- Remove the following distracting buttons:
  - `<button aria-label="Help">` (`<CircleHelp />`)
  - `<button aria-label="Activity">` (`<Activity />`)
  - `<button aria-label="Settings">` (`<Settings />`)
  - Floating static search bar.

### Step 2: Build the Comprehensive `MyAccountMenu.tsx` Component
- **File**: `frontend/components/layout/MyAccountMenu.tsx`
- Features:
  - **Active Staff Identity**: High-contrast avatar initials, staff role pill (`Lead Receptionist`, `Associate Dentist`, `Admin`), and current branch.
  - **Quick Staff Switcher**: 1-click dropdown to toggle between staff profiles (e.g. Darrell Steward, Sarah Jenkins, Naman) for audit logs without password prompts.
  - **Dark / Light Mode Toggle**: Immediate theme switching with smooth CSS transitions.
  - **Operatory Station Selector**: Select which operatory chair or reception station the current browser represents.
- Built using Radix UI dropdown primitives with full keyboard accessibility.

### Step 3: Streamline Left Sidebar Navigation
- **File**: `frontend/lib/constants.ts` & `frontend/components/layout/Sidebar.tsx`
- Clean up the sidebar sections into modern, high-value clinical groups:
  1. **CLINICAL**: `Dashboard`, `Reservations`, `Patients`, `Treatments`, `Staff List`
  2. **MANAGEMENT**: `Financials` *(Merged Sales & Accounts)*, `Inventory` *(Merged Stocks & Peripherals)*, `Purchases`
  3. **INSIGHTS**: `Reports & Analytics`

---

## 5. Verification & Testing Checklist
- [ ] Header has zero redundant icons; only the clean Page Title, Clinic status indicator, Walk-in CTA, and "My Account" trigger remain.
- [ ] Clicking "My Account" opens a clean, animated dropdown menu.
- [ ] Switching active staff updates the state and stamps subsequent appointments/sales with the selected staff member.
- [ ] Dark mode toggle inside "My Account" instantly updates theme classes across the entire application without page reload.
