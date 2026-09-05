# DentalFlow (Clinic Assistant)

**DentalFlow** is an administrative product for dental clinic front-desk staff to register patients, log structured previous visit summaries, manage dentist availability, and book appointment ranges.

---

## 📁 Repository Structure

- [`docs/`](file:///docs/): Core specifications, design guidelines, and operating rules.
  - [`Agent.md`](file:///docs/Agent.md) — Agent operating manual & principles.
  - [`Project Rules.md`](file:///docs/Project%20Rules.md) — Non-negotiable engineering & safety rules.
  - [`Product Requirements Document.md`](file:///docs/Product%20Requirements%20Document.md) — Product baseline and MVP scope.
  - [`System Architecture.md`](file:///docs/System%20Architecture.md) — Technical architecture & Excel pilot storage model.
  - [`Product Design Specification.md`](file:///docs/Product%20Design%20Specification.md) — Receptionist UX & screen workflows.
  - [`Implementation Phases.md`](file:///docs/Implementation%20Phases.md) — Strict delivery phases and exit gates.
  - [`Project Memory.md`](file:///docs/Project%20Memory.md) — Durable context, decisions & current stage.
- [`backend/`](file:///backend/): FastAPI MVC backend with Excel pilot storage (`openpyxl`), atomic locking, domain services, controllers, and tests.

---

## 🚀 Quick Start (Backend)

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

- **Interactive API Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Health Check:** [http://127.0.0.1:8000/api/system/health](http://127.0.0.1:8000/api/system/health)
