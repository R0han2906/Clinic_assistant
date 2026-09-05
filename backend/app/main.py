from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.exceptions import (
    DentalFlowError, WorkbookLockedError, SlotConflictError,
    ResourceNotFoundError, WorkbookWriteError
)
from app.controllers import (
    patient_router,
    dentist_router,
    appointment_router,
    system_router
)

app = FastAPI(
    title=f"{settings.PROJECT_NAME} API",
    description="Backend API for DentalFlow clinic staff website with structured Excel pilot storage.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception Handlers
@app.exception_handler(DentalFlowError)
async def dentalflow_error_handler(request: Request, exc: DentalFlowError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message, "error_type": exc.__class__.__name__}
    )

# Include Routers
app.include_router(patient_router, prefix=settings.API_V1_PREFIX)
app.include_router(dentist_router, prefix=settings.API_V1_PREFIX)
app.include_router(appointment_router, prefix=settings.API_V1_PREFIX)
app.include_router(system_router, prefix=settings.API_V1_PREFIX)

@app.get("/", tags=["Root"])
def root():
    return {
        "project": settings.PROJECT_NAME,
        "clinic": settings.CLINIC_NAME,
        "status": "online",
        "docs_url": "/docs",
        "health_check": f"{settings.API_V1_PREFIX}/system/health"
    }

@app.get("/health", tags=["Root"])
def health():
    return {"status": "ok"}
