import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import settings
from app.database.connection import engine, Base, SessionLocal
from app.database import models

logger = logging.getLogger("kissan_main")

from app.routers import (
    auth_router,
    farmers_router,
    crops_router,
    market_router,
    buyers_router,
    lots_router,
    offers_router,
    transactions_router,
    weather_router,
    recommendations_router,
    chat_router,
    images_router,
    soil_router,
    farm_intelligence_router,
    market_intelligence_router,
    voice_router,
    knowledge_router,
    payments_router,
    negotiations_router,
    inventory_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables exist
    Base.metadata.create_all(bind=engine)
    # Auto-seed if database is empty
    from app.database.seed import seed_database_if_empty
    from app.services.knowledge_service import knowledge_service
    db = SessionLocal()
    try:
        seed_database_if_empty(db)
        # Seed verified knowledge if empty
        await knowledge_service.seed_knowledge_base(db, force=False)
    except Exception as e:
        print(f"[Startup Warning] Seeding failed or already initialized: {e}")
    finally:
        db.close()
    yield
    # Shutdown logic if any


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Multilingual AI-Powered Agricultural Decision Engine & Mandi Gateway for Indian Farmers",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS for Vite frontend (supports exact domain & Vercel deployment URLs)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Centralized Exception Handlers (Safe, Structured User-Facing Errors)
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        loc = " -> ".join([str(l) for l in err.get("loc", [])])
        msg = err.get("msg", "Invalid value")
        errors.append(f"{loc}: {msg}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Input validation error. Please check submitted fields.",
            "errors": errors
        },
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"[Unhandled Error] {request.method} {request.url.path}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An internal advisory server error occurred. Please try again in a moment."
        },
    )


# Health & Diagnostics Checks
@app.get("/api/health", tags=["Health"])
def health_check():
    from app.database.connection import check_database_health
    from app.services.payment_service import payment_service
    db_health = check_database_health()
    payment_diag = payment_service.get_diagnostics()
    
    return {
        "status": "ok" if db_health.get("connected") else "degraded",
        "service": "KissanSetuAI",
        "version": settings.VERSION,
        "database": "connected" if db_health.get("connected") else "disconnected",
        "database_connected": db_health.get("connected", False),
        "database_type": db_health.get("database_type", "unknown"),
        "database_provider": db_health.get("provider", "unknown"),
        "select_1": db_health.get("select_1", "FAILED"),
        "schema_status": db_health.get("schema_status", "unknown"),
        "payments": payment_diag,
    }


@app.get("/health", tags=["Health"])
def root_health_check():
    return health_check()



# Ensure uploads directory exists and mount for local dev storage
uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")


# Include REST Routers under /api
app.include_router(auth_router, prefix="/api")
app.include_router(farmers_router, prefix="/api")
app.include_router(crops_router, prefix="/api")
app.include_router(market_router, prefix="/api")
app.include_router(buyers_router, prefix="/api")
app.include_router(lots_router, prefix="/api")
app.include_router(offers_router, prefix="/api")
app.include_router(transactions_router, prefix="/api")
app.include_router(weather_router, prefix="/api")
app.include_router(recommendations_router, prefix="/api")
app.include_router(chat_router, prefix="/api")
app.include_router(images_router, prefix="/api")
app.include_router(soil_router, prefix="/api")
app.include_router(farm_intelligence_router, prefix="/api")
app.include_router(market_intelligence_router, prefix="/api")
app.include_router(voice_router, prefix="/api")
app.include_router(knowledge_router, prefix="/api")
app.include_router(payments_router, prefix="/api")
app.include_router(negotiations_router, prefix="/api")
app.include_router(inventory_router, prefix="/api")



@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to KissanSetuAI Backend API",
        "docs": "/docs",
        "health": "/api/health",
    }
