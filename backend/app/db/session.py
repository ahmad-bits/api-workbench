import os
from pathlib import Path
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings

# Parse SQLite file path if applicable and ensure parent directory exists
db_url = settings.DATABASE_URL
if db_url.startswith("sqlite:///"):
    # Extract file path after sqlite:///
    raw_path = db_url.replace("sqlite:///", "")
    # Handle windows drive or posix paths
    db_file_path = Path(raw_path)
    db_dir = db_file_path.parent
    if not db_dir.exists():
        os.makedirs(db_dir, exist_ok=True)

# Create engine
engine = create_engine(
    db_url,
    connect_args={"check_same_thread": False} if db_url.startswith("sqlite") else {},
    echo=False,
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that yields a SQLAlchemy database session
    and ensures it is closed after request completion.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
