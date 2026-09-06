# Implementation Plan: 07 — Unified Inventory & Physical Assets Hub (Merged Stocks & Peripherals)

## 1. Overview & Objectives
Merge the separate `/stocks` and `/peripherals` routes into a unified, enterprise-grade **Clinic Inventory & Assets Hub (`/inventory`)**. 
This centralizes both **Clinical Consumables** (dental composite, gloves, anesthetics, sterilization pouches) and **Capital Medical Peripherals / Equipment** (dental operatory chairs, intraoral cameras, digital X-ray sensors, curing lights, autoclaves) into a single, high-efficiency management center.

---

## 2. Unified Inventory Architecture & Sub-Views

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│  📦 CLINIC INVENTORY & ASSETS                                           [+ New Item] [⬇ Export] │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐   │
│  │ Total Stock Items  │ │ Low Stock Alerts   │ │ Active Equipment   │ │ Pending Service    │   │
│  │ 184 SKUs           │ │ ⚠️ 6 Items Low     │ │ 32 Assets Active   │ │ 2 Under Maintenance│   │
│  └────────────────────┘ └────────────────────┘ └────────────────────┘ └────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│  [ Tab 1: Consumables & Stock ]  [ Tab 2: Medical Equipment & Peripherals ]  [ Tab 3: Suppliers ]│
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                 │
│  (Tab 1) Consumable Items Table (SKU, Category, Stock Level, Min Level, Batch, Expiry, Restock)  │
│  (Tab 2) Equipment Registry (Asset Tag, Serial #, Model, Operatory Room, Last Calibration, Status)│
│  (Tab 3) Approved Dental Suppliers & Requisitions (Linked to /purchases)                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Sub-View Specifications

### 3.1 Tab 1: Clinical Consumables & Stock (`ConsumablesTable.tsx`)
- **Real-Time Stock Tracking**:
  - SKU & Item Name (e.g. `Filtek Z250 Universal Composite A2`, `Lidocaine 2% with Epinephrine`).
  - Category: Restorative, Anesthetics, Endodontics, PPE / Infection Control, Ortho Supplies.
  - Quantity on Hand with color-coded stock health bar:
    - 🟢 Optimal (> 100% of minimum threshold)
    - 🟡 Warning (50% - 100% of minimum threshold)
    - 🔴 Critical Reorder Needed (< 50% of minimum threshold)
  - Expiry Date Tracker with proactive 30-day warning badges.
  - **1-Click Restock Action**: Quickly adds items to a draft purchase order.

### 3.2 Tab 2: Medical Equipment & Peripherals (`PeripheralsTable.tsx`)
- **Asset Lifecycle Management**:
  - **Asset Tag ID** (e.g. `EQP-000012`).
  - **Equipment Name & Manufacturer** (e.g. `Carestream CS 2200 Intraoral X-Ray`, `A-dec 500 Dental Chair`).
  - **Assigned Operatory / Room** (Operatory 1, Surgery Suite A, Sterilization Lab).
  - **Serial Number & Warranty Expiry**.
  - **Calibration & Maintenance Log**: Track last service date, next scheduled maintenance, and vendor service contract.
  - **Operational Status**: `Operational` (Green), `Needs Calibration` (Amber), `Out of Service / Repair` (Red).

### 3.3 Tab 3: Supplier Directory & Purchase Requisitions
- Direct linkage to vendor catalogs, contact representatives, lead times, and historical purchase orders.

---

## 4. Detailed Step-by-Step Implementation

### Step 1: Frontend Route Consolidation
- **Files**:
  - Create `frontend/app/inventory/page.tsx`
  - Create `frontend/components/inventory/InventoryHub.tsx`
  - Create `frontend/components/inventory/ConsumablesTab.tsx`
  - Create `frontend/components/inventory/EquipmentTab.tsx`
  - Create `frontend/components/inventory/AddInventoryModal.tsx`
  - Add backwards-compatible redirects in `frontend/app/stocks/page.tsx` and `frontend/app/peripherals/page.tsx`.

### Step 2: Backend API & Model Alignment
- **Files**:
  - `backend/app/api/v1/routes/inventory.py` (combines `/stocks` and `/peripherals`)
  - Expose `GET /api/v1/inventory/overview` returning unified stock metrics, low-stock warnings, and equipment service alerts in a single payload.

### Step 3: Sidebar Navigation Update
- **File**: `frontend/lib/constants.ts`
- Clean up the `PHYSICAL ASSET` section into a single unified entry:
  ```typescript
  {
    section: 'PHYSICAL ASSET',
    items: [
      { icon: 'Package', label: 'Inventory & Equipment', href: '/inventory', badge: '6 Low' },
      { icon: 'ShoppingCart', label: 'Purchases', href: '/purchases' },
    ],
  }
  ```

---

## 5. Verification & Testing Checklist
- [ ] Navigating to `/inventory` displays the unified dashboard with both Consumables and Equipment tabs.
- [ ] Legacy links (`/stocks` and `/peripherals`) smoothly redirect to `/inventory?tab=stocks` and `/inventory?tab=equipment`.
- [ ] Low-stock notification badges highlight items nearing depletion in real time.
- [ ] Adding new consumable or registering medical equipment persists accurately to Supabase / Excel backend.
