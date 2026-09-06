# Implementation Plan: 06 — Streamlining Payment Methods Configuration

## 1. Overview & Objectives
Eliminate the isolated, redundant **Payment Methods (`/payment-methods`)** page from the main clinic sidebar. Rather than occupying dedicated top-level navigation, payment methods (Cash, POS Cards, UPI QR, Insurance, Bank Transfer) will be streamlined into:
1. **The Take Payment Checkout Drawer**: Dynamic, contextual payment mode selector during patient checkout.
2. **The Financials Settings Tab**: Clinic payment gateway keys, surcharge rules, and enabled payment rails configuration inside `/financials`.

---

## 2. Rationale & Clutter Reduction

### 2.1 The Problem with Standalone `/payment-methods`
- A clinic receptionist does not manage payment gateway configurations on an hourly or daily basis.
- Having `/payment-methods` alongside Core Clinical tools creates navigational noise and clutters the sidebar.

### 2.2 The Solution
- **Contextual Checkout**: When clicking **"Take Payment"** on any appointment or visit summary, the receptionist selects the exact payment mode from a streamlined modal pill selector:
  ```
  [ 💵 Cash (Drawer) ]   [ 💳 Credit/Debit Card ]   [ 📱 UPI / Dynamic QR ]   [ 🛡️ Insurance ]
  ```
- **Administrative Settings**: Managing payment accounts or toggling active payment modes is moved inside the **Financials Hub (`/financials?tab=settings`)** or **Clinic Settings**.

---

## 3. Detailed Step-by-Step Implementation

### Step 1: Remove `/payment-methods` from Global Navigation
- **File**: `frontend/lib/constants.ts`
- Remove the following item from `navConfig`:
  ```typescript
  // DELETE: { icon: 'CreditCard', label: 'Payment Method', href: '/payment-methods' }
  ```

### Step 2: Add Route Redirect for Backwards Compatibility
- **File**: `frontend/app/payment-methods/page.tsx`
- Replace standalone page with a redirect to `/financials`:
  ```tsx
  import { redirect } from 'next/navigation'

  export default function PaymentMethodsRedirect() {
    redirect('/financials?tab=accounts')
  }
  ```

### Step 3: Enhance `TakePaymentDialog.tsx` Payment Method Selector
- **File**: `frontend/components/dashboard/TakePaymentDialog.tsx`
- Ensure the modal supports:
  - Quick Cash input with automatic change calculation ("Paid: $100, Due: $85, Change: $15").
  - Card terminal transaction ID input.
  - Dynamic QR code generation for instant patient smartphone scan.
  - Split-payment capability (e.g. $50 Cash + $100 Card).

---

## 4. Verification & Testing Checklist
- [ ] Sidebar no longer displays the redundant `Payment Method` link.
- [ ] Direct navigation to `/payment-methods` seamlessly redirects to `/financials`.
- [ ] Taking payments on the Reservations and Lobby Waiting Room pages remains smooth, error-free, and supports all payment rails.
