from fastapi import APIRouter
from app.api.v1.router import v1_router
from app.api.v1.routes.health_routes import router as health_router

root_api_router = APIRouter()

# Versioned API: /api/v1/...
root_api_router.include_router(v1_router, prefix="/api/v1")

# Backward Compatibility: mount same routes directly under /api/... so all existing
# tests, frontend requests, and docs (/api/patients, /api/appointments, etc.) work identically.
root_api_router.include_router(v1_router, prefix="/api")

# Mount root-level /health
root_api_router.include_router(health_router)
