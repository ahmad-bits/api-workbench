from datetime import datetime, timezone
import uuid
from typing import Optional, TYPE_CHECKING
from sqlalchemy import Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User


def utc_now() -> datetime:
    """Return timezone-aware or naive UTC datetime for SQLAlchemy DateTime column."""
    return datetime.now(timezone.utc)


def generate_uuid() -> str:
    """Generate unique UUID4 string for primary key."""
    return str(uuid.uuid4())


class SavedApi(Base):
    __tablename__ = "saved_apis"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=generate_uuid, index=True
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    url: Mapped[str] = mapped_column(String(1000), nullable=False)
    category: Mapped[Optional[str]] = mapped_column(String(120), nullable=True, default="General")
    encrypted_api_key: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=utc_now, onupdate=utc_now, nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="saved_apis")

    def __repr__(self) -> str:
        return f"<SavedApi id={self.id!r} user_id={self.user_id} name={self.name!r} url={self.url!r}>"
