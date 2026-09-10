import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

Base = declarative_base()


def normalize_database_url(url: str) -> str:
    """Normalizes database URL for SQLAlchemy 2.0+ and PostgreSQL drivers."""
    if not url:
        return ""
    clean_url = url.strip()
    # Normalize legacy postgres:// protocol to postgresql://
    if clean_url.startswith("postgres://"):
        clean_url = clean_url.replace("postgres://", "postgresql://", 1)
    return clean_url


def init_engine():
    db_url = normalize_database_url(settings.DATABASE_URL)
    connect_args = {}
    
    if db_url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}
    else:
        connect_args = {}
    
    try:
        eng = create_engine(
            db_url,
            connect_args=connect_args,
            pool_pre_ping=True,
            pool_recycle=60,
        )
        
        # Test connection immediately
        with eng.connect() as conn:
            conn.execute(text("SELECT 1"))
            
            # Apply safe schema column additions if requested or non-sqlite
            if not db_url.startswith("sqlite"):
                try:
                    conn.execute(text("ALTER TABLE crops ADD COLUMN IF NOT EXISTS image_url VARCHAR;"))
                    conn.execute(text("ALTER TABLE crops ADD COLUMN IF NOT EXISTS ai_observation JSONB;"))
                    conn.execute(text("ALTER TABLE farmers ADD COLUMN IF NOT EXISTS profile_picture_url VARCHAR;"))
                    conn.execute(text("ALTER TABLE farmers ADD COLUMN IF NOT EXISTS organization_name VARCHAR;"))
                    conn.execute(text("ALTER TABLE farmers ADD COLUMN IF NOT EXISTS role VARCHAR;"))
                    conn.execute(text("ALTER TABLE buyers ADD COLUMN IF NOT EXISTS profile_picture_url VARCHAR;"))
                    conn.execute(text("ALTER TABLE buyers ADD COLUMN IF NOT EXISTS organization_name VARCHAR;"))
                    conn.execute(text("ALTER TABLE conversations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;"))
                    conn.execute(text("ALTER TABLE conversations ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en';"))
                    conn.execute(text("ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS image_url VARCHAR;"))
                    conn.execute(text("ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS image_id VARCHAR;"))
                    conn.execute(text("ALTER TABLE lots ADD COLUMN IF NOT EXISTS quality_description VARCHAR;"))
                    conn.execute(text("ALTER TABLE lots ADD COLUMN IF NOT EXISTS harvest_window VARCHAR;"))
                    conn.execute(text("ALTER TABLE lots ADD COLUMN IF NOT EXISTS preferred_buyer_id INTEGER;"))
                    conn.execute(text("ALTER TABLE lots ADD COLUMN IF NOT EXISTS image_id VARCHAR;"))
                    conn.execute(text("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'RAZORPAY';"))
                    conn.execute(text("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS cod_charge FLOAT DEFAULT 0.0;"))
                    conn.execute(text("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'PENDING';"))
                    conn.execute(text("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS expected_amount FLOAT;"))
                    conn.execute(text("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS paid_amount FLOAT DEFAULT 0.0;"))
                    conn.execute(text("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_date VARCHAR(100);"))
                    conn.execute(text("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100);"))
                    conn.execute(text("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(100);"))
                    conn.execute(text("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(100);"))
                    conn.execute(text("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS razorpay_signature VARCHAR(255);"))
                    conn.commit()
                except Exception as migration_err:
                    print(f"[Database Schema] Auto-migration notice: {migration_err}")

        masked_host = db_url.split("@")[-1].split("?")[0] if "@" in db_url else db_url
        print(f"[Database] Successfully connected to database: {masked_host}")
        return eng
    except Exception as exc:
        sqlite_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "kisansetu.db")
        sqlite_url = f"sqlite:///{sqlite_path}"
        print(f"[Database Warning] Primary database connection failed ({exc}). Falling back to local SQLite: {sqlite_url}")
        eng = create_engine(
            sqlite_url,
            connect_args={"check_same_thread": False},
            pool_pre_ping=True,
            pool_recycle=60,
        )
        try:
            from app.database import models  # noqa
            Base.metadata.create_all(bind=eng)
        except Exception as create_err:
            print(f"[Database Warning] SQLite table creation warning: {create_err}")
        return eng


engine = init_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, expire_on_commit=False)


def get_db():
    """FastAPI Dependency for database session lifecycle."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_database_health() -> dict:
    """Safe, non-leaking diagnostic reporting active database connection and provider."""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1")).scalar()
            dialect_name = engine.dialect.name
            
            # Provider detection (safe, without exposing sensitive credentials)
            provider = "PostgreSQL"
            if dialect_name == "sqlite":
                provider = "SQLite (Local/Fallback)"
            else:
                url_str = str(engine.url)
                if "neon.tech" in url_str.lower():
                    provider = "Neon PostgreSQL (Cloud)"
                elif "localhost" in url_str or "127.0.0.1" in url_str:
                    provider = "Local PostgreSQL"
                else:
                    provider = "Remote PostgreSQL"
            
            return {
                "connected": result == 1,
                "database_type": dialect_name,
                "provider": provider,
                "select_1": "OK" if result == 1 else "FAILED",
                "schema_status": "synced",
            }
    except Exception as exc:
        return {
            "connected": False,
            "database_type": getattr(engine.dialect, "name", "unknown"),
            "provider": "Disconnected",
            "select_1": "FAILED",
            "error": str(exc).split("\n")[0],
            "schema_status": "unavailable",
        }

