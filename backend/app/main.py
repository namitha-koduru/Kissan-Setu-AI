import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import settings
from app.database.connection import engine, Base, SessionLocal
from app.database import models
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
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables exist
    Base.metadata.create_all(bind=engine)
    # Auto-seed if database is empty
    from app.database.seed import seed_database_if_empty
    db = SessionLocal()
    try:
        seed_database_if_empty(db)
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

# Configure CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health Check
@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "ok",
        "service": "KissanSetuAI",
        "database": "connected",
        "version": "1.0.0",
    }


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


@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to KissanSetuAI Backend API",
        "docs": "/docs",
        "health": "/api/health",
    }
