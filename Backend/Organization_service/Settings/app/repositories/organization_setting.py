from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.organization import Organization
from app.models.organization_setting import OrganizationSetting


class OrganizationSettingRepository:
    @staticmethod
    def organization_exists(db: Session, organization_id: str) -> bool:
        stmt = select(Organization.id).where(Organization.id == organization_id)
        return db.execute(stmt).scalar_one_or_none() is not None

    @staticmethod
    def get_settings(db: Session, organization_id: str) -> List[OrganizationSetting]:
        stmt = (
            select(OrganizationSetting)
            .where(OrganizationSetting.organization_id == organization_id)
            .order_by(OrganizationSetting.key)
        )
        return list(db.execute(stmt).scalars().all())

    @staticmethod
    def get_setting(db: Session, organization_id: str, key: str) -> Optional[OrganizationSetting]:
        stmt = select(OrganizationSetting).where(
            OrganizationSetting.organization_id == organization_id,
            OrganizationSetting.key == key
        )
        return db.execute(stmt).scalars().first()

    @staticmethod
    def update_setting(db: Session, organization_id: str, key: str, value: Any) -> OrganizationSetting:
        setting = OrganizationSettingRepository.get_setting(db, organization_id, key)
        if setting:
            setting.value = value
        else:
            setting = OrganizationSetting(
                organization_id=organization_id,
                key=key,
                value=value
            )
            db.add(setting)
        
        db.commit()
        db.refresh(setting)
        return setting

    @staticmethod
    def update_settings(db: Session, organization_id: str, settings_dict: Dict[str, Any]) -> List[OrganizationSetting]:
        updated_settings: List[OrganizationSetting] = []
        for key, value in settings_dict.items():
            setting = OrganizationSettingRepository.get_setting(db, organization_id, key)
            if setting:
                setting.value = value
            else:
                setting = OrganizationSetting(
                    organization_id=organization_id,
                    key=key,
                    value=value
                )
                db.add(setting)
            updated_settings.append(setting)
        
        db.commit()
        for setting in updated_settings:
            db.refresh(setting)
        return updated_settings
