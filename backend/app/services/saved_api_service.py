import logging
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.core.crypto import encrypt_api_key, decrypt_api_key, mask_api_key
from app.models.saved_api import SavedApi
from app.models.user import User
from app.schemas.saved_api import (
    SavedApiCreate,
    SavedApiUpdate,
    SavedApiResponse,
    SavedApiOpenResponse,
)

logger = logging.getLogger(__name__)


def _to_response_schema(saved: SavedApi) -> SavedApiResponse:
    has_key = bool(saved.encrypted_api_key and saved.encrypted_api_key.strip())
    return SavedApiResponse(
        id=saved.id,
        user_id=saved.user_id,
        name=saved.name,
        url=saved.url,
        category=saved.category or "General",
        has_api_key=has_key,
        api_key_masked=mask_api_key(saved.encrypted_api_key) if has_key else None,
        created_at=saved.created_at.isoformat() if saved.created_at else "",
        updated_at=saved.updated_at.isoformat() if saved.updated_at else "",
    )


class SavedApiService:
    def list_user_saved_apis(self, db: Session, user: User) -> List[SavedApiResponse]:
        records = (
            db.query(SavedApi)
            .filter(SavedApi.user_id == user.id)
            .order_by(SavedApi.created_at.desc())
            .all()
        )
        return [_to_response_schema(item) for item in records]

    def create_saved_api(
        self, db: Session, user: User, api_in: SavedApiCreate
    ) -> SavedApiResponse:
        encrypted_key: Optional[str] = None
        if api_in.api_key and api_in.api_key.strip():
            encrypted_key = encrypt_api_key(api_in.api_key.strip())

        new_saved_api = SavedApi(
            user_id=user.id,
            name=api_in.name.strip(),
            url=api_in.url.strip(),
            category=api_in.category.strip() if api_in.category else "General",
            encrypted_api_key=encrypted_key,
        )
        db.add(new_saved_api)
        db.commit()
        db.refresh(new_saved_api)

        logger.info(f"User '{user.username}' saved API '{new_saved_api.name}' (id: {new_saved_api.id})")
        return _to_response_schema(new_saved_api)

    def get_saved_api(self, db: Session, user: User, api_id: str) -> SavedApiResponse:
        saved = (
            db.query(SavedApi)
            .filter(SavedApi.id == api_id, SavedApi.user_id == user.id)
            .first()
        )
        if not saved:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Saved API with ID '{api_id}' not found.",
            )
        return _to_response_schema(saved)

    def get_saved_api_for_open(
        self, db: Session, user: User, api_id: str
    ) -> SavedApiOpenResponse:
        saved = (
            db.query(SavedApi)
            .filter(SavedApi.id == api_id, SavedApi.user_id == user.id)
            .first()
        )
        if not saved:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Saved API with ID '{api_id}' not found.",
            )

        decrypted_key: Optional[str] = None
        if saved.encrypted_api_key:
            decrypted_key = decrypt_api_key(saved.encrypted_api_key)

        return SavedApiOpenResponse(
            id=saved.id,
            name=saved.name,
            url=saved.url,
            category=saved.category or "General",
            api_key=decrypted_key,
            has_api_key=bool(decrypted_key),
        )

    def update_saved_api(
        self, db: Session, user: User, api_id: str, api_in: SavedApiUpdate
    ) -> SavedApiResponse:
        saved = (
            db.query(SavedApi)
            .filter(SavedApi.id == api_id, SavedApi.user_id == user.id)
            .first()
        )
        if not saved:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Saved API with ID '{api_id}' not found.",
            )

        if api_in.name is not None:
            saved.name = api_in.name.strip()

        if api_in.url is not None:
            saved.url = api_in.url.strip()

        if api_in.category is not None:
            saved.category = api_in.category.strip() if api_in.category else "General"

        if api_in.api_key is not None:
            if not api_in.api_key.strip():
                saved.encrypted_api_key = None
            else:
                saved.encrypted_api_key = encrypt_api_key(api_in.api_key.strip())

        saved.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(saved)

        logger.info(f"User '{user.username}' updated saved API '{saved.name}' (id: {saved.id})")
        return _to_response_schema(saved)

    def delete_saved_api(self, db: Session, user: User, api_id: str) -> bool:
        saved = (
            db.query(SavedApi)
            .filter(SavedApi.id == api_id, SavedApi.user_id == user.id)
            .first()
        )
        if not saved:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Saved API with ID '{api_id}' not found.",
            )

        api_name = saved.name
        db.delete(saved)
        db.commit()

        logger.info(f"User '{user.username}' deleted saved API '{api_name}' (id: {api_id})")
        return True

    def delete_saved_apis_by_workspace(
        self, db: Session, user: User, workspace_name: str
    ) -> int:
        clean_name = workspace_name.strip().lower()
        records = (
            db.query(SavedApi)
            .filter(
                SavedApi.user_id == user.id,
                func.lower(SavedApi.category) == clean_name,
            )
            .all()
        )
        count = len(records)
        for item in records:
            db.delete(item)
        if count > 0:
            db.commit()

        logger.info(
            f"User '{user.username}' deleted {count} saved API endpoints from workspace '{workspace_name}'"
        )
        return count


saved_api_service = SavedApiService()
