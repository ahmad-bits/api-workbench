import base64
import hashlib
import logging
from typing import Optional
from cryptography.fernet import Fernet, InvalidToken
from app.core.config import settings

logger = logging.getLogger(__name__)


def _get_encryption_key() -> bytes:
    """
    Derive a deterministic 32-byte URL-safe base64-encoded key
    from the application's JWT_SECRET_KEY for Fernet AES-128-CBC encryption.
    """
    secret = settings.JWT_SECRET_KEY.encode("utf-8")
    key_digest = hashlib.sha256(secret).digest()
    return base64.urlsafe_b64encode(key_digest)


def encrypt_api_key(plain_key: Optional[str]) -> Optional[str]:
    """
    Encrypt a plaintext API key using AES authenticated encryption (Fernet).
    Returns None if input is empty or None.
    Never stores plain API keys in the database.
    """
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
    """
    Decrypt an encrypted API key back to its plaintext value.
    Returns None if the key is empty or corrupted.
    """
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
    """
    Mask an API key for safe presentation in user interfaces and summaries.
    Returns standard bullet mask e.g. '••••••••' or None if key is absent.
    """
    if not key or not str(key).strip():
        return None
    return "••••••••"
