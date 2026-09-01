import os
import logging
from pathlib import Path
from sqlalchemy import text
from app.core.config import settings
from app.core.security import get_password_hash
from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.models.user import User  # noqa: F401
from app.models.mock import MockEndpoint  # noqa: F401
from app.models.pending_registration import PendingRegistration  # noqa: F401
from app.models.saved_api import SavedApi  # noqa: F401


logger = logging.getLogger(__name__)


def migrate_sqlite_schema() -> None:
    """
    Check and migrate SQLite table schemas to ensure newly added model columns exist.
    """
    try:
        with engine.connect() as conn:
            # Check users table columns
            res = conn.execute(text("PRAGMA table_info(users)"))
            cols = [row[1] for row in res.fetchall()]
            if cols:
                if "username" not in cols:
                    logger.info("Migrating SQLite schema: Adding missing 'username' column to 'users' table...")
                    conn.execute(text("ALTER TABLE users ADD COLUMN username VARCHAR(60)"))
                    # Backfill username from email prefix for existing rows
                    conn.execute(
                        text(
                            "UPDATE users SET username = lower(substr(email, 1, instr(email, '@') - 1)) "
                            "WHERE username IS NULL OR username = ''"
                        )
                    )
                    conn.commit()
                    logger.info("Successfully added and backfilled 'username' column in 'users' table.")

            # Check saved_apis table columns
            res_saved = conn.execute(text("PRAGMA table_info(saved_apis)"))
            saved_cols = [row[1] for row in res_saved.fetchall()]
            if saved_cols and "category" not in saved_cols:
                logger.info("Migrating SQLite schema: Adding missing 'category' column to 'saved_apis' table...")
                conn.execute(text("ALTER TABLE saved_apis ADD COLUMN category VARCHAR(120) DEFAULT 'General'"))
                conn.commit()
                logger.info("Successfully added 'category' column in 'saved_apis' table.")
    except Exception as exc:
        logger.warning("Schema migration notice: %s", exc)


def seed_default_users() -> None:
    """Seed demo accounts if they do not already exist in the database."""
    try:
        with SessionLocal() as db:
            # 1. Ahmad Demo Account
            ahmad_user = db.query(User).filter(
                (User.username == "ahmad") | (User.email == "ahmad@workbench.dev")
            ).first()
            if not ahmad_user:
                ahmad_user = User(
                    name="Ahmad Developer",
                    username="ahmad",
                    email="ahmad@workbench.dev",
                    hashed_password=get_password_hash("Password123!"),
                    is_active=True,
                )
                db.add(ahmad_user)
                logger.info("Seeded demo user: ahmad (Password123!)")

            # 2. Demo Developer Account
            demo_user = db.query(User).filter(
                (User.username == "demo.developer") | (User.email == "demo.developer@apiworkbench.io")
            ).first()
            if not demo_user:
                demo_user = User(
                    name="Demo Developer",
                    username="demo.developer",
                    email="demo.developer@apiworkbench.io",
                    hashed_password=get_password_hash("DemoWorkbench123!"),
                    is_active=True,
                )
                db.add(demo_user)
                logger.info("Seeded demo user: demo.developer (DemoWorkbench123!)")

            db.commit()
    except Exception as exc:
        logger.warning("Seeding demo users notice: %s", exc)


def init_db() -> None:
    """
    Ensure the database directory and tables are created.
    Called automatically on application startup.
    """
    db_url = settings.DATABASE_URL
    if db_url and db_url.startswith("sqlite:///"):
        raw_path = db_url.replace("sqlite:///", "")
        db_file_path = Path(raw_path)
        db_dir = db_file_path.parent
        if not db_dir.exists():
            os.makedirs(db_dir, exist_ok=True)
            logger.info("Created SQLite database directory: %s", db_dir)

    # Create tables if they do not exist
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables verified/created successfully.")

    # Migrate any missing columns in existing SQLite tables
    migrate_sqlite_schema()

    # Seed default user accounts
    seed_default_users()
