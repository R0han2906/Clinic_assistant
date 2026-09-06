# System Architecture

## 1. Architecture Decision

The system is a production-ready **dental clinic management platform** with:
1. **Next.js Frontend** (Staff Portal & Odontogram UI)
2. **FastAPI Modular Layered Backend** (MVC: routes → controllers → services → repositories)
3. **Supabase PostgreSQL Database** (17 tables, connection pooling, relational constraints)
4. **On-Demand CSV Export Engine** (Patient, appointment, sales, inventory, and purchase records)
5. **Patient Request Simulator** (WhatsApp Intake Simulator for patient-initiated booking workflows)

No Excel storage is used in production. All clinic operations (patients, appointments, odontograms, sales/invoicing, purchases, inventory, staff, treatment rates) persist directly to Supabase PostgreSQL.

---

## 2. System Architecture Diagram

```text
+-----------------------------------+            +---------------------------------+
|     Next.js Staff Frontend        |            |    Patient Request Simulator    |
|   (Port 3000 - App Router)        |            |   (Port 5173 - Intake Adapter)  |
+-----------------+-----------------+            +----------------+----------------+
                  |                                               |
                  | HTTP / REST (api-client.ts)                   | HTTP / REST
                  v                                               v
+----------------------------------------------------------------------------------+
|                              FastAPI Backend (Port 8000)                         |
|                                                                                  |
|  [ Dedicated Routes Layer (app/api/v1/routes/) ]                                 |
|  - /api/v1/patients       (Registration, Duplicate Check, Search, Profile)       |
|  - /api/v1/dentists       (Dentist Profile, Schedules, Leaves)                   |
|  - /api/v1/availability   (Slot Engine: Working Hours - Breaks - Bookings)       |
|  - /api/v1/appointments   (Book, Reschedule, Cancel, Complete, Payment)          |
|  - /api/v1/treatments     (Full CRUD for Procedures & Rates)                     |
|  - /api/v1/checkups       (Odontogram & 4-Step Clinical Checkup)                 |
|  - /api/v1/sales          (Billing, Invoices, Payment Methods, KPI Summary)      |
|  - /api/v1/purchases      (Supply Purchase Orders, Vendors, Receiving)           |
|  - /api/v1/inventory      (Stocks, Low-Stock Alerts, Quantity Adjustments)       |
|  - /api/v1/staff          (Clinic Staff, Assistants, Role Administration)        |
|  - /api/v1/export         (On-Demand CSV Reports: Patients, Sales, Stocks, etc.) |
|  - /api/v1/patient-requests(Simulator Intake & Staff Review Queue)               |
|                                                                                  |
|  [ Controllers Layer (app/controllers/) ]                                        |
|  - Thin orchestration translating HTTP params into domain calls                  |
|                                                                                  |
|  [ Domain Services Layer (app/services/) ]                                       |
|  - Patient, Booking, Availability, Sales, Purchase, Inventory, Staff Services    |
|                                                                                  |
|  [ Repositories Layer (app/repositories/) ]                                      |
|  - BaseClinicRepository (Abstract Interface)                                     |
|  - SupabaseClinicRepository (Primary: ThreadedConnectionPool + PostgreSQL)        |
|  - ExcelClinicRepository (Fallback/Pilot compatibility)                          |
+-----------------------------------------+----------------------------------------+
                                          |
                                          | psycopg2-binary / TLS
                                          v
+----------------------------------------------------------------------------------+
|                            Supabase PostgreSQL (17 Tables)                       |
|                                                                                  |
|  1. patients           2. dentists       3. visits          4. availability      |
|  5. leaves             6. appointments   7. treatments      8. medical_checkups  |
|  9. patient_requests  10. staff         11. audit_log      12. metadata          |
| 13. sales             14. vendors       15. purchases      16. inventory         |
| 17. payment_methods                                                              |
+----------------------------------------------------------------------------------+
```

---

## 3. Data Flow & Security

- **Direct Storage:** All transactions are committed directly to Supabase PostgreSQL with relational integrity, foreign keys, and indexes.
- **Sequential IDs:** Human-readable sequential primary keys (`PAT-000001`, `APT-000001`, `SAL-000001`, `INV-000001`, `PO-000001`, `STF-000001`) preserve clinic record consistency.
- **CORS Configuration:** Configured to accept requests from `localhost:3000` (staff frontend) and `localhost:5173` (patient simulator).
- **On-Demand Exports:** Staff can download current CSV dumps of any entity via `/api/v1/export/*` without writing files to disk.
