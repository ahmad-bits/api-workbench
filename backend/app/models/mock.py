from datetime import datetime, timezone
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import Integer, String, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User


def utc_now() -> datetime:
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
    
    auth_type: Mapped[str] = mapped_column(String(20), nullable=False, default="none")
    auth_header_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, default="X-API-Key")
    auth_header_value: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, default="")
    auth_token: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, default="")

    delay_ms: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    initial_resource_data: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default=None)
    current_resource_data: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default=None)

    call_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=utc_now, onupdate=utc_now, nullable=False
    )

    user: Mapped["User"] = relationship("User", back_populates="mocks")
    request_history: Mapped[List["MockRequestHistory"]] = relationship(
        "MockRequestHistory",
        back_populates="mock",
        cascade="all, delete-orphan",
        order_by="desc(MockRequestHistory.created_at)",
    )

    def __repr__(self) -> str:
        return f"<MockEndpoint id={self.id!r} user_id={self.user_id} method={self.method!r} path={self.path!r}>"


class MockRequestHistory(Base):
    __tablename__ = "mock_request_history"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True)
    mock_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("mock_endpoints.id", ondelete="CASCADE"), nullable=False, index=True
    )
    body: Mapped[str] = mapped_column(Text, nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, nullable=False, index=True)

    mock: Mapped["MockEndpoint"] = relationship("MockEndpoint", back_populates="request_history")

    def __repr__(self) -> str:
        return f"<MockRequestHistory id={self.id!r} mock_id={self.mock_id!r} created_at={self.created_at}>"
