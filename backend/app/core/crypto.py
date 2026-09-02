import base64
import hashlib
import logging
from typing import Optional
from cryptography.fernet import Fernet, InvalidToken
from app.core.config import settings

logger = logging.getLogger(__name__)


def _get_encryption_key() -> bytes:
    secret = settings.JWT_SECRET_KEY.encode("utf-8")
    key_digest = hashlib.sha256(secret).digest()
    return base64.urlsafe_b64encode(key_digest)


def encrypt_api_key(plain_key: Optional[str]) -> Optional[str]:
    if not plain_key or not plain_key.strip():
        return None

    try:
        f = Fernet(_get_encryption_key())
        encrypted_bytes = f.encrypt(plain_key.strip().encode("utf-8"))
        return encrypted_bytes.decode("utf-8")
    except Exception as exc:
        logger.error(f"Failed to encrypt API key: {exc}")
        raise RuntimeError("Cryptographic error encrypting API key.") from exc


def decrypt_api_key(encrypted_key: Optional[str]) -> Optional[str]:
    if not encrypted_key or not encrypted_key.strip():
        return None

    try:
        f = Fernet(_get_encryption_key())
        decrypted_bytes = f.decrypt(encrypted_key.strip().encode("utf-8"))
        return decrypted_bytes.decode("utf-8")
    except InvalidToken:
        logger.warning("Decryption failed: Invalid token or corrupted key ciphertext.")
        return None
    except Exception as exc:
        logger.error(f"Decryption error: {exc}")
        return None


def mask_api_key(key: Optional[str]) -> Optional[str]:
    if not key or not str(key).strip():
        return None
    return "••••••••"
