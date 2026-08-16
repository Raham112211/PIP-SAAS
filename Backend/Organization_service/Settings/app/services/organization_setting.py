from typing import Any, Dict
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.organization_setting import OrganizationSettingRepository
from app.schemas.organization_setting import (
    SettingsResponse,
    SettingItemResponse,
    SettingsUpdateResponse,
    SingleSettingUpdateResponse,
)


class OrganizationSettingService:
    @staticmethod
    def _ensure_organization_exists(db: Session, organization_id: str) -> None:
        if not OrganizationSettingRepository.organization_exists(db, organization_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Organization with id '{organization_id}' not found"
            )

    @classmethod
    def get_organization_settings(cls, db: Session, organization_id: str) -> SettingsResponse:
        cls._ensure_organization_exists(db, organization_id)
        settings = OrganizationSettingRepository.get_settings(db, organization_id)
        settings_dict = {setting.key: setting.value for setting in settings}
        return SettingsResponse(settings=settings_dict)

    @classmethod
    def get_organization_setting(cls, db: Session, organization_id: str, key: str) -> SettingItemResponse:
        cls._ensure_organization_exists(db, organization_id)
        clean_key = key.strip()
        setting = OrganizationSettingRepository.get_setting(db, organization_id, clean_key)
        if not setting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Setting '{clean_key}' not found for organization '{organization_id}'"
            )
        return SettingItemResponse(key=setting.key, value=setting.value)

    @classmethod
    def update_organization_settings(
        cls,
        db: Session,
        organization_id: str,
        settings_dict: Dict[str, Any]
    ) -> SettingsUpdateResponse:
        cls._ensure_organization_exists(db, organization_id)
        if not settings_dict:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Settings update dictionary cannot be empty"
            )
        
        # Clean keys
        cleaned_dict = {k.strip(): v for k, v in settings_dict.items() if k and k.strip()}
        if not cleaned_dict:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Settings keys must be non-empty strings"
            )

        updated_settings = OrganizationSettingRepository.update_settings(db, organization_id, cleaned_dict)
        result_dict = {setting.key: setting.value for setting in updated_settings}
        return SettingsUpdateResponse(
            message="Settings updated successfully",
            settings=result_dict
        )

    @classmethod
    def update_organization_setting(
        cls,
        db: Session,
        organization_id: str,
        key: str,
        value: Any
    ) -> SingleSettingUpdateResponse:
        cls._ensure_organization_exists(db, organization_id)
        clean_key = key.strip()
        if not clean_key:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Setting key cannot be empty"
            )

        setting = OrganizationSettingRepository.update_setting(db, organization_id, clean_key, value)
        return SingleSettingUpdateResponse(
            message="Setting updated successfully",
            key=setting.key,
            value=setting.value
        )
