import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

Base = declarative_base()


def init_engine():
    connect_args = {}
    if settings.DATABASE_URL.startswith("sqlite"):
        connect_args = {"check_same_thread": False}
    
    try:
        eng = create_engine(
            settings.DATABASE_URL,
            connect_args=connect_args,
            pool_pre_ping=True,
        )
        # Apply safe schema column additions if requested
        if os.environ.get("RUN_MIGRATIONS") == "1":
            from sqlalchemy import text
            with eng.connect() as conn:
                if not settings.DATABASE_URL.startswith("sqlite"):
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
        print(f"[Database] Successfully connected to configured database: {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else settings.DATABASE_URL}")
        return eng
    except Exception as exc:
        sqlite_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "kisansetu.db")
        sqlite_url = f"sqlite:///{sqlite_path}"
        print(f"[Database Warning] PostgreSQL connection failed ({exc}). Falling back to local SQLite: {sqlite_url}")
        eng = create_engine(
            sqlite_url,
            connect_args={"check_same_thread": False},
            pool_pre_ping=True,
        )
        return eng


engine = init_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """FastAPI Dependency for database session lifecycle."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
