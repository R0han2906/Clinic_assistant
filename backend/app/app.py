from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.exceptions import DentalFlowError
from app.shared.middleware import RequestIdMiddleware
from app.api.router import root_api_router

def create_app() -> FastAPI:
    """
    Application factory for DentalFlow backend.
    Configures middleware, exception handlers, and mounts versioned API routers.
    """
    app = FastAPI(
        title=f"{settings.PROJECT_NAME} API",
        description="Modular layered backend for dentist-clinic operations with structured Excel pilot storage.",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc"
    )

    # 1. Attach Request-ID tracing middleware
    app.add_middleware(RequestIdMiddleware)

    # 2. Attach CORS Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # 3. Standardized Domain Exception Handler
    @app.exception_handler(DentalFlowError)
    async def dentalflow_error_handler(request: Request, exc: DentalFlowError):
        request_id = getattr(request.state, "request_id", None)
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "detail": exc.message,
                "error_code": exc.error_code,
                "error_type": exc.__class__.__name__,
                "request_id": request_id
            }
        )

    # 4. Mount API Routers (/api/v1 and backward-compatible /api)
    app.include_router(root_api_router)

    # 5. Root Info Endpoint
    @app.get("/", tags=["Root"])
    def root():
        return {
            "project": settings.PROJECT_NAME,
            "clinic": settings.CLINIC_NAME,
            "status": "online",
            "docs_url": "/docs",
            "api_v1": "/api/v1",
            "health_check": "/api/v1/system/health"
        }

    return app
