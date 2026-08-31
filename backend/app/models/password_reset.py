from datetime import datetime, timezone
from sqlalchemy import Integer, String, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


def utc_now() -> datetime:
    """Return timezone-naive UTC datetime for SQLite compatibility."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class PasswordResetOtp(Base):
    """
    Stores temporary password reset requests with HMAC-hashed OTPs and verification tokens.
    """
    __tablename__ = "password_reset_otps"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    otp_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    reset_token_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    attempts_left: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    resend_available_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=utc_now, onupdate=utc_now, nullable=False
    )

    def __repr__(self) -> str:
        return f"<PasswordResetOtp id={self.id} email={self.email!r} verified={self.is_verified}>"
