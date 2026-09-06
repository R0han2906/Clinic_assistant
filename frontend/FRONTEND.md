# Zendenta Frontend — Work Progress & Context

> **Project:** Zendenta — Dental Clinic Management SaaS  
> **Target User:** Clinic receptionists (appointment booking, check-ins, billing, daily schedule)  
> **Status:** UI Prototype complete · No real backend (all data is mock)  
> **Last Updated:** September 2026

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Pages & Routes](#4-pages--routes)
5. [Architecture & Key Decisions](#5-architecture--key-decisions)
6. [Data Layer (Mock)](#6-data-layer-mock)
7. [State Management (Zustand)](#7-state-management-zustand)
8. [Layout System](#8-layout-system)
9. [Design System & Styling](#9-design-system--styling)
10. [Keyboard Shortcuts](#10-keyboard-shortcuts)
11. [Running Locally](#11-running-locally)
12. [What's Next / TODO](#12-whats-next--todo)

---

## 1. Project Overview

Zendenta is a **multi-page dental clinic management dashboard** built as a high-fidelity UI prototype. It covers:

- 📅 **Reservations** — Interactive daily calendar view with 3 dentist columns, appointment drawer, and a multi-step Medical Checkup wizard
- 🏠 **Dashboard** — Real-time KPIs, "Up Next" queue, schedule timeline, dentist status, activity feed, and action items
- 👥 **Patients** — Searchable patient list and individual patient detail pages
- 🦷 **Treatments** — Service catalog with pricing and duration
- 👔 **Staff** — Team member directory
- 💰 **Finance** — Accounts, Sales, Purchases, Payment Methods
- 📦 **Assets** — Stocks (inventory), Peripherals (equipment)
- 📊 **Reports** — Report category navigator
- 🎧 **Support** — Ticket submission + contact channels

All interactions, routing, and UI states are **fully functional** — there is no real backend, but every page renders real mock data and all modals/drawers/wizards work end-to-end.

---

## 2. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.3.3 |
| Language | TypeScript | 5.7.3 |
| Styling | Tailwind CSS v4 | ^4.3.3 |
| Component base | shadcn/ui (base-nova style via `@base-ui/react`) | ^4.11.0 |
| Icons | lucide-react | ^1.16.0 |
| State | Zustand | ^5.0.15 |
| Animation | Framer Motion | ^13.2.0 |
| Date utilities | date-fns | ^4.4.0 |
| Analytics | @vercel/analytics | 1.6.1 |
| Package manager | pnpm (workspace) | — |

> **Important:** Tailwind v4 does NOT use `tailwind.config.ts`. All tokens/colors are defined in `app/globals.css` using CSS custom properties with `oklch()` color space.

---

## 3. Project Structure

```
frontend/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout — wraps ALL pages in <LayoutShell>
│   ├── page.tsx                  # Redirects / → /dashboard
│   ├── loading.tsx               # Root loading skeleton
│   ├── globals.css               # Design tokens (CSS variables, oklch colors)
│   ├── dashboard/
│   │   ├── page.tsx              # Dashboard home (Server Component)
│   │   └── loading.tsx           # Dashboard skeleton
│   ├── reservations/
│   │   ├── page.tsx              # Calendar + drawer + wizard (Client Component)
│   │   └── loading.tsx           # Calendar skeleton
│   ├── patients/
│   │   ├── page.tsx              # Patient list (Server Component)
│   │   ├── loading.tsx           # Patient list skeleton
│   │   └── [id]/
│   │       └── page.tsx          # Patient detail (Server Component + generateStaticParams)
│   ├── treatments/page.tsx       # Treatment catalog (Server Component)
│   ├── staff/page.tsx            # Staff directory (Server Component)
│   ├── accounts/page.tsx         # Financial accounts (Server Component)
│   ├── sales/page.tsx            # Sales + revenue chart (Server Component)
│   ├── purchases/page.tsx        # Purchase orders (Server Component)
│   ├── payment-methods/page.tsx  # Payment method toggles (Server Component)
│   ├── stocks/page.tsx           # Inventory + low stock alerts (Server Component)
│   ├── peripherals/page.tsx      # Equipment asset cards (Server Component)
│   ├── reports/page.tsx          # Report navigator (Server Component)
│   └── support/page.tsx          # Support contacts + ticket form (Server Component)
│
├── components/
│   ├── layout/
│   │   ├── LayoutShell.tsx       # Client wrapper: Sidebar + Header + children
│   │   ├── Sidebar.tsx           # Collapsible sidebar, active-route highlighting,
│   │   │                         # mobile drawer, clinic card
│   │   └── Header.tsx            # Dynamic page title, search, user profile,
│   │                             # keyboard shortcut listeners
│   ├── ui/
│   │   └── button.tsx            # shadcn Button (uses @base-ui/react)
│   └── reservations-app.tsx      # [LEGACY] Original monolithic v1 prototype —
│                                 #   kept for reference, no longer rendered
│
├── lib/
│   ├── mock-data.ts              # ALL mock data (see §6)
│   ├── constants.ts              # Nav config, color maps, keyboard shortcuts
│   ├── formatters.ts             # Utility formatters (currency, date, time, age…)
│   └── utils.ts                  # cn() utility (clsx + tailwind-merge)
│
├── store/
│   ├── sidebar.store.ts          # Zustand: sidebar collapse + mobile open state
│   └── modal.store.ts            # Zustand: Medical Checkup wizard step state
│
├── types/
│   └── index.ts                  # All TypeScript interfaces and type aliases
│
├── public/                       # Static assets (icons, images)
├── components.json               # shadcn config (base-nova style, @base-ui/react)
├── next.config.mjs               # Next.js config
├── tsconfig.json                 # TypeScript config (paths: @/ → ./*)
└── package.json                  # Dependencies
```

---

## 4. Pages & Routes

| Route | File | Render | Description |
|---|---|---|---|
| `/` | `app/page.tsx` | Server | Instant redirect to `/dashboard` |
| `/dashboard` | `app/dashboard/page.tsx` | Server (static) | KPIs, Up Next queue, schedule timeline, alerts |
| `/reservations` | `app/reservations/page.tsx` | **Client** | Daily calendar, appointment drawer, medical wizard |
| `/patients` | `app/patients/page.tsx` | Server (static) | Searchable/filterable patient table (24 patients) |
| `/patients/[id]` | `app/patients/[id]/page.tsx` | Server (static) | Patient detail, contact info, appointment history |
| `/treatments` | `app/treatments/page.tsx` | Server (static) | Treatment cards with category, price, duration |
| `/staff` | `app/staff/page.tsx` | Server (static) | Staff member cards with role and contact |
| `/accounts` | `app/accounts/page.tsx` | Server (static) | Financial account cards + total balance |
| `/sales` | `app/sales/page.tsx` | Server (static) | Revenue KPIs, CSS bar chart, sales table |
| `/purchases` | `app/purchases/page.tsx` | Server (static) | Purchase orders table with status |
| `/payment-methods` | `app/payment-methods/page.tsx` | Server (static) | Method cards with toggle UI |
| `/stocks` | `app/stocks/page.tsx` | Server (static) | Inventory table with low-stock warning banner |
| `/peripherals` | `app/peripherals/page.tsx` | Server (static) | Equipment asset cards |
| `/reports` | `app/reports/page.tsx` | Server (static) | Report category cards + export buttons |
| `/support` | `app/support/page.tsx` | Server (static) | Contact channels + ticket form |

> All server pages use `export const dynamic = 'force-static'` for instant load times.

---

## 5. Architecture & Key Decisions

### Server Components First
Every page except `/reservations` is a React Server Component. Only components with interactivity (`'use client'` directive) are:
- `LayoutShell.tsx` — reads zustand stores, renders `<Sidebar>` + `<Header>`
- `Sidebar.tsx` — uses `usePathname()` and `useSidebarStore()`
- `Header.tsx` — uses `usePathname()`, keyboard event listeners
- `app/reservations/page.tsx` — calendar drag interactions, modal states

### Persistent Layout Shell
The root `app/layout.tsx` wraps `{children}` in `<LayoutShell>`. This means:
- The sidebar and header **never unmount** between navigations (instant navigation feel)
- The active sidebar link automatically highlights based on `usePathname()`

### Static Params for Dynamic Routes
`/patients/[id]` uses `generateStaticParams()` to pre-render all 24 patient detail pages at build time.

### No Real Backend
All data is imported directly from `lib/mock-data.ts`. When connecting a real API:
1. Replace imports from `lib/mock-data.ts` with `fetch()` calls in Server Components
2. Add `cache: 'no-store'` or `revalidate` as needed per page
3. Zustand stores only hold UI state — no data fetching logic to migrate

---

## 6. Data Layer (Mock)

Everything lives in [`lib/mock-data.ts`](./lib/mock-data.ts):

| Export | Type | Count |
|---|---|---|
| `appointments` | `Appointment[]` | 16 today (across 3 dentists) |
| `dentists` | `Dentist[]` | 3 |
| `patients` | `Patient[]` | 24 |
| `treatments` | `Treatment[]` | 15 |
| `staff` | `StaffMember[]` | 10 |
| `activities` | `Activity[]` | 12 (with relative timestamps) |
| `alerts` | `Alert[]` | 6 action items |
| `inventory` | `InventoryItem[]` | 20 (some below min-stock) |
| `paymentMethods` | `PaymentMethod[]` | 8 |
| `salesRecords` | `SaleRecord[]` | 15 |
| `purchaseOrders` | `PurchaseOrder[]` | 8 |
| `kpiData` | `KpiData[]` | 4 dashboard KPIs |
| `currentUser` | `object` | Darrell Steward / Super admin |

All types are in [`types/index.ts`](./types/index.ts).

---

## 7. State Management (Zustand)

### `store/sidebar.store.ts` — `useSidebarStore`
```ts
{
  isCollapsed: boolean       // persisted to localStorage as 'zendenta-sidebar'
  isMobileOpen: boolean      // mobile drawer state (not persisted)
  toggle()                   // flip isCollapsed
  setCollapsed(v: boolean)
  openMobile()
  closeMobile()
}
```

### `store/modal.store.ts` — `useModalStore`
```ts
{
  isOpen: boolean
  step: 0 | 1 | 2 | 3      // Medical Checkup wizard step
  appointmentId: string | null
  open(appointmentId?)
  close()
  setStep(step)
  nextStep()
  prevStep()
}
```

---

## 8. Layout System

### Shell Layout

```
┌─ body ──────────────────────────────────────────────────────────────────┐
│  ┌─ LayoutShell (flex h-screen overflow-hidden) ────────────────────────┤
│  │  ┌─ Sidebar ──┐  ┌─ <main> (flex-1 flex-col min-w-0) ─────────────┐ │
│  │  │ 76px–236px │  │  ┌─ Header (h-[82px]) ──────────────────────┐  │ │
│  │  │ collapsible│  │  └──────────────────────────────────────────┘  │ │
│  │  │            │  │  ┌─ Page Content (flex-1 overflow-auto) ──────┐ │ │
│  │  │            │  │  │   {children}                               │ │ │
│  │  │            │  │  └────────────────────────────────────────────┘ │ │
│  │  └────────────┘  └───────────────────────────────────────────────── │ │
```

### Sidebar width states
- **Expanded:** `w-[236px]` — shows logo text, nav labels, clinic card, badge counts
- **Collapsed:** `w-[76px]` — shows only icons, tooltip titles on hover
- **Mobile:** Off-canvas drawer overlay (`fixed inset-0 z-30`)

### Header dynamic title
The `Header` reads `usePathname()`, matches against `navConfig` in `lib/constants.ts`, and renders the active page label as `<h1>`.

---

## 9. Design System & Styling

### Color System (`app/globals.css`)
Tailwind v4 uses `@theme inline {}` with `oklch()` colors — **no `tailwind.config.ts`**.

Key CSS variables (light mode):
```css
--primary: oklch(...)          /* Primary brand color (blue-ish purple) */
--background: oklch(...)       /* Page background (near-white) */
--card: oklch(...)             /* Card surface */
--muted: oklch(...)            /* Secondary surfaces */
--muted-foreground: oklch(...) /* Subdued text */
--border: oklch(...)           /* Subtle borders */
--radius: 0.5rem               /* Base border radius */
```

### shadcn Configuration (`components.json`)
```json
{
  "style": "base-nova",
  "baseColor": "neutral",
  "ui": "@base-ui/react"        ← uses Base UI, NOT Radix UI
}
```

> **⚠️ Important for contributors:** shadcn components here use `@base-ui/react` primitives, not the more common `@radix-ui/react-*`. When adding new shadcn components, always verify the import source.

### Color Utility Maps (`lib/constants.ts`)
These maps are used throughout for consistent badge/card coloring:
- `APPOINTMENT_COLOR_CLASSES` — 5 appointment colors (rose, sage, sky, amber, purple)
- `STATUS_BADGE_CLASSES` — Appointment status badge colors
- `PATIENT_STATUS_CLASSES` — Patient status badge colors
- `STAFF_STATUS_CLASSES` — Staff status badge colors
- `SALE_STATUS_CLASSES` — Sale status badge colors
- `PURCHASE_STATUS_CLASSES` — Purchase order status badge colors

### Typography
Uses system font stack from Tailwind. Inter/Geist will be added when brand is finalised.

### Spacing Pattern
- Page content padding: `p-6 md:p-8`
- Card border radius: `rounded-2xl`
- Card shadow: `shadow-[0_1px_2px_rgba(0,0,0,0.04)]` (default) → `shadow-[0_4px_16px_rgba(0,0,0,0.08)]` (hover)
- Section headers: `text-2xl font-bold tracking-tight`

---

## 10. Keyboard Shortcuts

| Keys | Action |
|---|---|
| `Cmd/Ctrl + B` | Toggle sidebar collapse |
| `/` | Focus header search bar |
| `Esc` | Close any open modal or drawer |

These are registered in `Header.tsx` via `window.addEventListener('keydown', ...)` inside a `useEffect`.

---

## 11. Running Locally

```bash
# From the repo root or the frontend folder:
cd frontend
pnpm dev
```

Visit: **http://localhost:3000** — redirects automatically to `/dashboard`.

### Prerequisites
- Node.js 20+
- pnpm 9+

### Build check (TypeScript)
```bash
pnpm tsc --noEmit
# Should exit with 0 errors
```

### Production build
```bash
pnpm build
pnpm start
```

---

## 12. What's Next / TODO

### Backend Integration
- [ ] Replace `lib/mock-data.ts` imports with real API `fetch()` calls per page
- [ ] Add auth layer (login page, session management, protected routes)
- [ ] Wire up appointment booking form (currently UI-only)
- [ ] Connect patient registration form
- [ ] Implement payment recording flow

### UI Enhancements
- [ ] `app/reservations/page.tsx` — Add `+` button to create new appointment in empty calendar slots
- [ ] `app/reservations/page.tsx` — Week view (multi-day calendar)
- [ ] `app/patients/page.tsx` — Make search/filter interactive (currently static HTML)
- [ ] `app/patients/page.tsx` — Sort by column (name, last visit, status)
- [ ] `app/dashboard/page.tsx` — Hook up real date to greeting ("Good morning/afternoon/evening")
- [ ] `app/payment-methods/page.tsx` — Make toggle buttons actually fire state changes
- [ ] Add `framer-motion` page transitions (package already installed)
- [ ] `Cmd+K` global command palette (currently listed as a shortcut but not implemented)
- [ ] Notification bell with dropdown
- [ ] Dark mode (CSS variables are already set up, just needs `.dark` class toggle)

### Missing Pages
- [ ] `/accounts/[id]` — Individual account ledger detail
- [ ] `/staff/[id]` — Staff member detail / schedule
- [ ] `/treatments/[id]` — Treatment detail and edit form
- [ ] `/settings` — Clinic settings (name, hours, SMS templates)

### Performance / Quality
- [ ] Add `<Suspense>` boundaries for finer loading UX
- [ ] Add `error.tsx` boundaries per route segment
- [ ] Write Playwright or Cypress E2E tests for critical flows (check-in, payment)
- [ ] Add proper meta tags per page (currently only root layout has metadata)

### Legacy Cleanup
- [ ] Remove or archive `components/reservations-app.tsx` (v1 monolithic prototype, kept for reference)

---

## Contribution Notes

### Adding a new page
1. Create `app/<route>/page.tsx`
2. Add the route to `navConfig` in `lib/constants.ts` (pick a `lucide-react` icon name)
3. Add the icon import to `iconMap` in `components/layout/Sidebar.tsx`
4. Add `loading.tsx` in the same folder for skeleton UX

### Adding mock data
Edit `lib/mock-data.ts` and add the corresponding type to `types/index.ts`.

### Adding a new status badge color
Add the mapping to the relevant `*_CLASSES` object in `lib/constants.ts`.

### Connecting a real API
In a Server Component page:
```ts
// Replace:
import { patients } from '@/lib/mock-data'

// With:
const patients = await fetch('https://api.zendenta.com/patients', {
  next: { revalidate: 60 }
}).then(r => r.json())
```

No store changes needed — Zustand only holds UI state.
