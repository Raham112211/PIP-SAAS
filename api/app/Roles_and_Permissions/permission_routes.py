from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, CurrentUser
from app.core.ws_manager import ws_manager
from app.Roles_and_Permissions.services import PermissionService
from app.Roles_and_Permissions.schemas import PermissionResponse, ModulePermissionsGroup, RolePermissionsUpdate

router = APIRouter(tags=["Permission Management"])


@router.get("/permissions", response_model=List[PermissionResponse])
def list_permissions(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    return PermissionService.get_all_permissions(db=db)


@router.get("/permissions/modules", response_model=List[ModulePermissionsGroup])
def list_permissions_by_module(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    return PermissionService.get_permissions_grouped_by_module(db=db)


@router.get("/roles/{role_id}/permissions", response_model=List[PermissionResponse])
def get_role_permissions(
    role_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    return PermissionService.get_role_permissions(
        db=db,
        role_id=role_id,
        organization_id=current_user.organization_id
    )


@router.put("/roles/{role_id}/permissions", response_model=List[PermissionResponse])
def update_role_permissions(
    role_id: str,
    perms_in: RolePermissionsUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    res = PermissionService.update_role_permissions(
        db=db,
        role_id=role_id,
        permission_ids=perms_in.permission_ids,
        organization_id=current_user.organization_id
    )
    ws_manager.trigger_event(
        current_user.organization_id,
        "PERMISSIONS_UPDATED",
        {
            "role_id": role_id,
            "permissions": [p.model_dump(mode="json") for p in res]
        }
    )
    return res
