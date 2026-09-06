# Implementation Plan: 01 — Clinic Branding, Dynamic Logo & Address Metadata

## 1. Overview & Objectives
Establish a unified, high-definition **Brand Identity & Clinic Metadata System** across the entire Clinix (Zendenta) platform. The clinic's logo, primary wordmark, physical location address, contact numbers, and accreditation details will be rendered dynamically from a centralized configuration source across the UI header, sidebar, patient visit summaries, receipts, and invoices.

---

## 2. Branding & Metadata Design Specifications

### 2.1 Logo & Wordmark Visual Elements
- **Icon Mark**: Modern geometric dental crest — dual-tone cyan (`#0284C7`) and electric emerald (`#10B981`) tooth silhouette with medical cross negative space.
- **Wordmark Typography**: **Outfit / Inter** bold display text with `Clinix` in dark obsidian slate (`#0F172A`) and `Dental` in primary sapphire (`#0284C7`), paired with an uppercase subtitle badge: `SPECIALTY CLINIC & SURGERY`.
- **Favicon & App Icons**: Multi-resolution SVG and PNG icons configured in `app/layout.tsx`.

### 2.2 Clinic Address & Operational Metadata Model
```typescript
export interface ClinicMetadata {
  id: string
  name: string
  legalName: string
  tagline: string
  logoUrl: string
  address: {
    street: string
    suite: string
    city: string
    state: string
    postalCode: string
    country: string
    coordinates?: { lat: number; lng: number }
  }
  contact: {
    phone: string
    emergencyPhone: string
    email: string
    website: string
    whatsapp: string
  }
  registration: {
    taxId: string
    licenseNumber: string
    director: string
  }
  timings: {
    weekdays: string
    weekends: string
  }
}
```

---

## 3. Detailed Step-by-Step Implementation

### Step 1: Centralized Clinic Configuration Store
- **File**: `frontend/lib/clinic-config.ts`
- Define default clinic properties with fallback values:
  - **Name**: `Clinix Dental Care & Surgery`
  - **Address**: `Suite 402, Medical Arts Tower, 847 Healthcare Blvd, Metro City, NY 10001`
  - **Phone**: `+1 (555) 234-5678` | **Emergency**: `+1 (555) 999-DENT`
  - **Email**: `care@clinixdental.com`
- Expose an API hook `useClinicMetadata()` that queries `/api/v1/system/clinic-info` with client-side caching.

### Step 2: Dynamic Branding Components
- **Component**: `frontend/components/brand/ClinicLogo.tsx`
  - Supports multiple display variants:
    - `full`: Icon + Wordmark + Subtitle (Used in Sidebar header).
    - `compact`: Scaled icon + Bold title (Used in collapsed sidebar & Mobile navigation).
    - `icon-only`: 36x36 rounded squircle icon (Used in browser tabs & minimal headers).
    - `monochrome`: For black-and-white thermal receipts and PDF invoice footers.

### Step 3: Global Header Address & Location Badge
- **File**: `frontend/components/layout/Header.tsx`
- Add an elegant **Location & Status Capsule**:
  - Displays a subtle pin icon (`MapPin`), clinic branch name (`Main Care Center`), and real-time operational status badge (`● Open · 9:00 AM - 12:00 AM`).
  - Clicking the badge opens a quick popup with the full address, contact numbers, and one-click Google Maps link.

### Step 4: Visit Summary & Invoice Header Integration
- **Files**:
  - `frontend/components/reservations/VisitSummaryPanel.tsx`
  - `frontend/components/dashboard/TakePaymentDialog.tsx`
  - `frontend/app/reports/page.tsx`
- Ensure all patient-facing exports (PDF visit summaries, prescription slips, payment receipts) feature the official Clinic Logo, Registered Address, License Number, and Doctor Signature block.

---

## 4. Verification & Testing Checklist
- [ ] Sidebar dynamically displays the vector `ClinicLogo` with crisp scaling across both expanded (236px) and collapsed (76px) states.
- [ ] Location capsule in the top header correctly renders the clinic address and open/closed indicator.
- [ ] Patient payment receipt modal prints the correct clinic legal name, address, and tax ID.
- [ ] Responsive testing on Mobile (375px), Tablet (768px), and Desktop (1440px) shows clean, unclipped logo and text layouts.
