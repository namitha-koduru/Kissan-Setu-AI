import os
import sys

# Ensure local SQLite fallback database is used during automated test runs
if "DATABASE_URL" not in os.environ or "neon.tech" in os.environ.get("DATABASE_URL", ""):
    os.environ["DATABASE_URL"] = "sqlite:///kisansetu.db"

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from app.database.connection import engine, Base, SessionLocal
from app.database.seed import seed_database_if_empty

@pytest.fixture(scope="session", autouse=True)
def prepare_test_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database_if_empty(db)
    finally:
        db.close()
