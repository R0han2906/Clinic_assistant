# Implementation Plan: 05 — Unified Financials & Accounting Hub (Merged Sales & Accounts)

## 1. Overview & Objectives
Merge the separate `/sales` and `/accounts` routes into a unified, best-in-class **Clinic Financials & Accounting Hub (`/financials` or `/accounts`)**. 
This consolidates daily cash register balancing, appointment sales billing, outstanding receivables, account balances (Operating Bank, Petty Cash, Merchant Stripe/UPI), and revenue analytics into a single, cohesive, and executive dashboard for clinic managers and receptionists.

---

## 2. Integrated Financial Architecture & Sub-Views

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│  💰 CLINIC FINANCIALS & ACCOUNTING                                      [📅 This Month ▾] [⬇ Export] │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐   │
│  │ Gross Revenue      │ │ Collected Today    │ │ Outstanding AR     │ │ Bank Total Balance │   │
│  │ $48,250.00 (+12%)  │ │ $3,420.00 (28 Tx)  │ │ $1,850.00 (4 Pts)  │ │ $92,400.00         │   │
│  └────────────────────┘ └────────────────────┘ └────────────────────┘ └────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│  [ Tab 1: Overview & Cashflow ]  [ Tab 2: Sales & Invoices ]  [ Tab 3: Accounts & Banking ]     │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                 │
│  (Tab 1) Real-time Cashflow Waterfall & Payment Method Breakdown (Cash: 42%, Card: 38%, UPI: 20%)│
│  (Tab 2) Itemized Invoices Table (Invoice ID, Patient, Treatment, Doctor, Total, Status, Action) │
│  (Tab 3) Account Ledgers (Chase Operating $65k, Petty Cash $2.4k, Merchant Terminal $25k)       │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Sub-View Specifications

### 3.1 Tab 1: Financial Overview & Real-Time Cashflow
- **KPI Summary Cards**:
  - **Gross Billing**: Total clinical services invoiced this period.
  - **Net Realized Cash**: Total cash/card/digital payments settled.
  - **Unpaid / Pending Balances**: Accounts Receivable breakdown with 1-click patient payment reminder actions.
  - **Today's Register Reconciliation**: Receptionist shift collection total (Cash in drawer vs POS card transactions).
- **Payment Distribution Donut Chart**: Breakdown across Cash, Credit/Debit Card, UPI/QR Code, Insurance, and Bank Transfer.
- **Top Performing Procedures**: Revenue contribution by treatment category (Implants, Orthodontics, Prophylaxis, Whitening).

### 3.2 Tab 2: Sales & Invoices Ledger (`SalesLedger.tsx`)
- **Filterable Invoices Table**:
  - Columns: `Invoice ID` (e.g. `INV-2026-0042`), `Date & Time`, `Patient Name & Phone`, `Doctor`, `Treatments Provided`, `Subtotal`, `Discount`, `Total Paid`, `Payment Method Badge`, `Status` (`Paid`, `Partial`, `Unpaid`, `Refunded`), `Actions` (View Receipt, Print PDF, Resend WhatsApp Receipt).
- **Instant Status Filter**: All / Paid / Partial / Pending / Refunded.
- **Search**: Fast fuzzy search across Invoice ID, Patient Name, and Doctor.

### 3.3 Tab 3: Accounts & Bank Reconciliation (`AccountsLedger.tsx`)
- **Clinic Accounts Cards**:
  - `Chase Operating Account (**** 4892)`: Balance, incoming deposits, payroll allocations.
  - `Reception Petty Cash Drawer`: Physical cash counted at shift open/close.
  - `Digital Merchant / POS Gateway`: Stripe / UPI pending clearance.
  - `Insurance Receivables Pool`: Pending insurance claims under adjudication.
- **Transaction History**: Comprehensive double-entry ledger with deposit/withdrawal tags and receipt attachments.
- **New Transaction Modal**: Record clinical expenses (lab fees, consumable purchases, utility bills, staff stipends).

---

## 4. Detailed Step-by-Step Implementation

### Step 1: Frontend Route Consolidation
- **Files**:
  - Create unified `frontend/app/financials/page.tsx` (with backwards-compatible redirect from `/sales` and `/accounts`).
  - Create `frontend/components/financials/FinancialsDashboard.tsx`
  - Create `frontend/components/financials/SalesInvoicesTab.tsx`
  - Create `frontend/components/financials/AccountsBankingTab.tsx`
  - Create `frontend/components/financials/CreateTransactionModal.tsx`

### Step 2: Backend API Aggregation
- **File**: `backend/app/api/v1/routes/financials.py` (or `sales.py` & `accounts.py`)
- Provide high-performance summary endpoint `GET /api/v1/financials/summary?period=month` returning:
  ```json
  {
    "kpis": {
      "gross_revenue": 48250.00,
      "collected_today": 3420.00,
      "outstanding_receivables": 1850.00,
      "total_bank_balance": 92400.00
    },
    "payment_method_breakdown": {
      "Cash": 20265.00,
      "Card": 18335.00,
      "UPI / Digital": 9650.00
    },
    "recent_sales": [...],
    "accounts": [...]
  }
  ```

### Step 3: Sidebar & Navigation Update
- **File**: `frontend/lib/constants.ts`
- Replace separate `{ href: '/sales' }` and `{ href: '/accounts' }` sidebar entries with a single, prominent entry:
  ```typescript
  { icon: 'Wallet', label: 'Financials & Accounts', href: '/financials' }
  ```

---

## 5. Verification & Testing Checklist
- [ ] Navigating to `/financials` renders the comprehensive executive financial dashboard with zero layout shifting.
- [ ] Legacy links (`/sales` and `/accounts`) automatically redirect to `/financials?tab=sales` or `/financials?tab=accounts`.
- [ ] Switching between Tabs (Overview, Sales, Accounts) is instant with zero network stutter.
- [ ] Export button downloads a clean, multi-sheet CSV with Sales Invoices and Account Ledgers.
