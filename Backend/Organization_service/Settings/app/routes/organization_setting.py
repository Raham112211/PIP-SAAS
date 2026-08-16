from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_organization_access, CurrentUser
from app.schemas.organization_setting import (
    SettingsResponse,
    SettingItemResponse,
    SettingsUpdateRequest,
    SingleSettingUpdateRequest,
    SettingsUpdateResponse,
    SingleSettingUpdateResponse,
)
from app.services.organization_setting import OrganizationSettingService

router = APIRouter(
    prefix="/organizations",
    tags=["Organization Settings"]
)


@router.get(
    "/{organization_id}/settings",
    response_model=SettingsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Organization Settings",
    description="Retrieve all configuration settings for the specified organization."
)
def get_organization_settings(
    organization_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(verify_organization_access)
) -> SettingsResponse:
    return OrganizationSettingService.get_organization_settings(db, organization_id)


@router.get(
    "/{organization_id}/settings/{key}",
    response_model=SettingItemResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Specific Setting",
    description="Retrieve a single configuration setting value by key."
)
def get_organization_setting(
    organization_id: str,
    key: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(verify_organization_access)
) -> SettingItemResponse:
    return OrganizationSettingService.get_organization_setting(db, organization_id, key)


@router.put(
    "/{organization_id}/settings",
    response_model=SettingsUpdateResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Settings",
    description="Update or set multiple configuration settings for the organization."
)
def update_organization_settings(
    organization_id: str,
    request: SettingsUpdateRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(verify_organization_access)
) -> SettingsUpdateResponse:
    return OrganizationSettingService.update_organization_settings(
        db, organization_id, request.settings
    )


@router.patch(
    "/{organization_id}/settings/{key}",
    response_model=SingleSettingUpdateResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Specific Setting",
    description="Update a single configuration setting value by key."
)
def update_organization_setting(
    organization_id: str,
    key: str,
    request: SingleSettingUpdateRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(verify_organization_access)
) -> SingleSettingUpdateResponse:
    return OrganizationSettingService.update_organization_setting(
        db, organization_id, key, request.value
    )
