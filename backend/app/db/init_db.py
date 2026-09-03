import os
import logging
from pathlib import Path
from sqlalchemy import text
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
from app.models.user import User
from app.models.mock import MockEndpoint, MockRequestHistory
from app.models.pending_registration import PendingRegistration
from app.models.saved_api import SavedApi
from app.models.password_reset import PasswordResetOtp

logger = logging.getLogger(__name__)


def migrate_sqlite_schema() -> None:
    try:
        with engine.connect() as conn:
            res = conn.execute(text("PRAGMA table_info(users)"))
            cols = [row[1] for row in res.fetchall()]
            if cols:
                if "username" not in cols:
                    logger.info("Migrating SQLite schema: Adding missing 'username' column to 'users' table...")
                    conn.execute(text("ALTER TABLE users ADD COLUMN username VARCHAR(60)"))
                    conn.execute(
                        text(
                            "UPDATE users SET username = lower(substr(email, 1, instr(email, '@') - 1)) "
                            "WHERE username IS NULL OR username = ''"
                        )
                    )
                    conn.commit()
                    logger.info("Successfully added and backfilled 'username' column in 'users' table.")

            # Check if users table has AUTOINCREMENT keyword in DDL
            res_sql = conn.execute(text("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'")).fetchone()
            if res_sql and res_sql[0]:
                sql_def = res_sql[0].upper()
                if "AUTOINCREMENT" not in sql_def:
                    logger.info("Migrating SQLite schema: Converting 'users' table to use AUTOINCREMENT...")
                    conn.execute(text("PRAGMA foreign_keys = OFF"))
                    conn.execute(text("""
                        CREATE TABLE users_autoincrement_migration (
                            id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                            name VARCHAR(120) NOT NULL,
                            email VARCHAR(255) NOT NULL,
                            hashed_password VARCHAR(255) NOT NULL,
                            is_active BOOLEAN NOT NULL,
                            created_at DATETIME NOT NULL,
                            updated_at DATETIME NOT NULL,
                            username VARCHAR(60)
                        )
                    """))
                    conn.execute(text("""
                        INSERT INTO users_autoincrement_migration (id, name, email, hashed_password, is_active, created_at, updated_at, username)
                        SELECT id, name, email, hashed_password, is_active, created_at, updated_at, username FROM users
                    """))
                    conn.execute(text("DROP TABLE users"))
                    conn.execute(text("ALTER TABLE users_autoincrement_migration RENAME TO users"))
                    conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_email ON users (email)"))
                    conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_username ON users (username)"))
                    conn.execute(text("CREATE INDEX IF NOT EXISTS ix_users_id ON users (id)"))
                    conn.execute(text("PRAGMA foreign_keys = ON"))
                    conn.commit()
                    logger.info("Successfully converted 'users' table to AUTOINCREMENT.")

            res_saved = conn.execute(text("PRAGMA table_info(saved_apis)"))
            saved_cols = [row[1] for row in res_saved.fetchall()]
            if saved_cols and "category" not in saved_cols:
                logger.info("Migrating SQLite schema: Adding missing 'category' column to 'saved_apis' table...")
                conn.execute(text("ALTER TABLE saved_apis ADD COLUMN category VARCHAR(120) DEFAULT 'General'"))
                conn.commit()
                logger.info("Successfully added 'category' column in 'saved_apis' table.")

            res_mocks = conn.execute(text("PRAGMA table_info(mock_endpoints)"))
            mock_cols = [row[1] for row in res_mocks.fetchall()]
            if mock_cols:
                if "auth_type" not in mock_cols:
                    logger.info("Migrating SQLite schema: Adding missing 'auth_type' column to 'mock_endpoints' table...")
                    conn.execute(text("ALTER TABLE mock_endpoints ADD COLUMN auth_type VARCHAR(20) DEFAULT 'none'"))
                    conn.commit()
                if "auth_header_name" not in mock_cols:
                    logger.info("Migrating SQLite schema: Adding missing 'auth_header_name' column to 'mock_endpoints' table...")
                    conn.execute(text("ALTER TABLE mock_endpoints ADD COLUMN auth_header_name VARCHAR(100) DEFAULT 'X-API-Key'"))
                    conn.commit()
                if "auth_header_value" not in mock_cols:
                    logger.info("Migrating SQLite schema: Adding missing 'auth_header_value' column to 'mock_endpoints' table...")
                    conn.execute(text("ALTER TABLE mock_endpoints ADD COLUMN auth_header_value VARCHAR(255) DEFAULT ''"))
                    conn.commit()
                if "auth_token" not in mock_cols:
                    logger.info("Migrating SQLite schema: Adding missing 'auth_token' column to 'mock_endpoints' table...")
                    conn.execute(text("ALTER TABLE mock_endpoints ADD COLUMN auth_token VARCHAR(255) DEFAULT ''"))
                    conn.commit()
                if "delay_ms" not in mock_cols:
                    logger.info("Migrating SQLite schema: Adding missing 'delay_ms' column to 'mock_endpoints' table...")
                    conn.execute(text("ALTER TABLE mock_endpoints ADD COLUMN delay_ms INTEGER DEFAULT 0"))
                    conn.commit()
                if "initial_resource_data" not in mock_cols:
                    logger.info("Migrating SQLite schema: Adding missing 'initial_resource_data' column to 'mock_endpoints' table...")
                    conn.execute(text("ALTER TABLE mock_endpoints ADD COLUMN initial_resource_data TEXT DEFAULT NULL"))
                    conn.commit()
                if "current_resource_data" not in mock_cols:
                    logger.info("Migrating SQLite schema: Adding missing 'current_resource_data' column to 'mock_endpoints' table...")
                    conn.execute(text("ALTER TABLE mock_endpoints ADD COLUMN current_resource_data TEXT DEFAULT NULL"))
                    conn.commit()
                logger.info("Successfully verified/updated 'mock_endpoints' schema.")

            res_history = conn.execute(text("PRAGMA table_info(mock_request_history)"))
            history_cols = [row[1] for row in res_history.fetchall()]
            if history_cols and ("method" in history_cols or "status_code" in history_cols or "headers" in history_cols):
                logger.info("Migrating SQLite schema: Updating 'mock_request_history' table to simplified schema...")
                conn.execute(text("PRAGMA foreign_keys = OFF"))
                conn.execute(text("""
                    CREATE TABLE mock_request_history_migrated (
                        id VARCHAR(36) NOT NULL PRIMARY KEY,
                        mock_id VARCHAR(36) NOT NULL,
                        body TEXT NOT NULL DEFAULT '',
                        created_at DATETIME NOT NULL,
                        FOREIGN KEY(mock_id) REFERENCES mock_endpoints(id) ON DELETE CASCADE
                    )
                """))
                conn.execute(text("""
                    INSERT INTO mock_request_history_migrated (id, mock_id, body, created_at)
                    SELECT id, mock_id, body, created_at FROM mock_request_history
                """))
                conn.execute(text("DROP TABLE mock_request_history"))
                conn.execute(text("ALTER TABLE mock_request_history_migrated RENAME TO mock_request_history"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_mock_request_history_id ON mock_request_history (id)"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_mock_request_history_mock_id ON mock_request_history (mock_id)"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_mock_request_history_created_at ON mock_request_history (created_at)"))
                conn.execute(text("PRAGMA foreign_keys = ON"))
                conn.commit()
                logger.info("Successfully migrated 'mock_request_history' to simplified schema.")
    except Exception as exc:
        logger.warning("Schema migration notice: %s", exc)


def init_db() -> None:
    db_url = settings.DATABASE_URL
    if db_url and db_url.startswith("sqlite:///"):
        raw_path = db_url.replace("sqlite:///", "")
        db_file_path = Path(raw_path)
        db_dir = db_file_path.parent
        if not db_dir.exists():
            os.makedirs(db_dir, exist_ok=True)
            logger.info("Created SQLite database directory: %s", db_dir)

    Base.metadata.create_all(bind=engine)
    logger.info("Database tables verified/created successfully.")

    migrate_sqlite_schema()
