from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
from sqlalchemy import Integer, String, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User


def utc_now() -> datetime:
    """Return UTC datetime for SQLAlchemy DateTime column."""
    return datetime.now(timezone.utc)


class MockEndpoint(Base):
    __tablename__ = "mock_endpoints"
    __table_args__ = (
        UniqueConstraint("user_id", "method", "path", name="uq_user_mock_method_path"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    method: Mapped[str] = mapped_column(String(10), nullable=False, default="GET")
    path: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    status_code: Mapped[int] = mapped_column(Integer, nullable=False, default=200)
    response_headers: Mapped[str] = mapped_column(
        Text, nullable=False, default='{"Content-Type": "application/json"}'
    )
    response_body: Mapped[str] = mapped_column(Text, nullable=False, default="")
    response_type: Mapped[str] = mapped_column(String(20), nullable=False, default="json")
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Authentication fields ('none', 'api_key', 'bearer')
    auth_type: Mapped[str] = mapped_column(String(20), nullable=False, default="none")
    auth_header_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, default="X-API-Key")
    auth_header_value: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, default="")
    auth_token: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, default="")

    # Custom Response Delay in milliseconds (>= 0)
    delay_ms: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    call_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=utc_now, onupdate=utc_now, nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="mocks")

    def __repr__(self) -> str:
        return f"<MockEndpoint id={self.id!r} user_id={self.user_id} method={self.method!r} path={self.path!r}>"
