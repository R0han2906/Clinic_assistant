# Clinix / Zendenta — Future Architectural & Feature Roadmap

This directory contains comprehensive, step-by-step implementation plans and architectural designs for the upcoming feature upgrades across the **Clinix (Zendenta)** Dental Clinic Management System.

> [!NOTE]
> **Authentication Status**: Auth & Login walls are intentionally **deferred**. The application operates in direct-access clinical receptionist mode for zero-friction daily operations and pilot testing.

---

## 📑 Feature Specifications & Plans (Auth-Free Clinical Suite)

| # | Module / Feature | Specification Document | Target Areas |
|---|---|---|---|
| **01** | **Clinic Branding, Logo & Address Metadata** | [`01_clinic_branding_logo_address.md`](./01_clinic_branding_logo_address.md) | Brand identity, Dynamic Logo SVGs, Clinic contact banner, Invoices & Printouts |
| **02** | **Navbar & Header Simplification (Staff Hub)** | [`02_navbar_and_header_simplification.md`](./02_navbar_and_header_simplification.md) | `Header.tsx`, `Sidebar.tsx`, My Account station/staff switcher, Clutter removal |
| **03** | **Calendar Card Overlap & Collision Stacking** | [`03_reservations_calendar_overlap_and_stacking.md`](./03_reservations_calendar_overlap_and_stacking.md) | `CalendarBoard.tsx`, Multi-track layout math, Cancelled/Reassigned visual hierarchy |
| **04** | **Expanded Timeline: 9:00 AM to 12:00 AM** | [`04_reservations_timeline_9am_to_12am.md`](./04_reservations_timeline_9am_to_12am.md) | 15-Hour grid engine, Slot resolution, Midnight time parser, Drag-drop bounds |
| **05** | **Merged Financials & Accounts Hub** | [`05_merged_financials_and_accounts_hub.md`](./05_merged_financials_and_accounts_hub.md) | Unification of `/sales` & `/accounts` -> `/financials`, Cashflow KPIs, Ledgers |
| **06** | **Streamlined Payment Methods** | [`06_payment_methods_streamlining.md`](./06_payment_methods_streamlining.md) | Removal of standalone `/payment-methods` route; embed in Checkout & Accounts |
| **07** | **Unified Inventory & Physical Assets Hub** | [`07_unified_inventory_and_equipment_hub.md`](./07_unified_inventory_and_equipment_hub.md) | Unification of `/stocks` & `/peripherals` -> `/inventory`, Equipment tracking |
| **08** | **Master Implementation & Migration Schedule** | [`08_master_implementation_schedule.md`](./08_master_implementation_schedule.md) | 3-Phase rollout roadmap, Zero-regression redirects, Component refactoring |

---

## 🎯 Architectural Principles & Invariants

1. **Direct-Access Receptionist Workflow**: No login friction, token expiration, or password lockouts during clinical operations.
2. **Next.js 16 App Router Discipline**: Maintain strict separation between Server Components (data fetching) and Client Components (`'use client'` for interactive panels, drag-and-drop, and filters).
3. **Dual-Repository Backend Integrity**: All domain models and storage layers remain compatible across both **Supabase PostgreSQL** and **OpenPyXL Excel** engines.
4. **Zero-Loss Data Model**: Merging routes (e.g. Sales + Accounts or Stocks + Peripherals) consolidates the frontend user interface while retaining backward-compatible REST API endpoints.
5. **Visual Excellence**: Curated HSL color palettes, modern typography, glassmorphism card surfaces, and accessible contrast for all clinical states.
