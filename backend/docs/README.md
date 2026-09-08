# Zendenta Clinic Backend — Documentation Hub

This directory contains in-depth technical documentation for the **Zendenta Dental Clinic FastAPI Backend**.

---

## 📚 Documentation Index

1. [Architecture & Storage Boundary (`ARCHITECTURE.md`)](./ARCHITECTURE.md)
   - Layered architecture (Routes → Controllers → Services → Repositories → Models)
   - Dual-storage engine: **Supabase PostgreSQL (17 normalized tables)** & **OpenPyXL Excel Engine (12 sheets)**
   - Concurrency, connection pooling, and OS-level file locking (`lock-once-delegate` pattern)
   - Single-workbook storage invariant without backup file sprawl

2. [Complete API Specification (`API_DOCUMENTATION.md`)](./API_DOCUMENTATION.md)
   - Detailed endpoint documentation across all 13 modules
   - Query filters (`status`, `patient_phone`, `patient_id`) with digit-matching
   - 7-state canonical appointment lifecycle & transition guards
   - Next.js reverse proxy integration and zero-CORS browser support
   - Strict 24-hour time format standard (`HH:mm`)

3. [Patient WhatsApp Intake & Review Lifecycle (`PATIENT_REQUESTS_WORKFLOW.md`)](./PATIENT_REQUESTS_WORKFLOW.md)
   - End-to-end flow from the Patient WhatsApp Simulator to Receptionist Review
   - Real-time staff approval (`/approve`), rejection (`/reject`), and cancellation (`/cancel`)
   - Auto-appointment creation (`source: 'WHATSAPP'`) and calendar sync
   - Immediate cancellation from Confirmation Card and multi-booking phone lookups

---

## 🚀 Quick Reference

- **Interactive Swagger Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- **Health Check**: [http://127.0.0.1:8000/api/v1/system/health](http://127.0.0.1:8000/api/v1/system/health)
- **Test Suite**: Run `pytest tests/` in the `backend/` directory.
