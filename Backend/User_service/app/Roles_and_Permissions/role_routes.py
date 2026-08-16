from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, CurrentUser
from app.core.ws_manager import ws_manager
from app.Roles_and_Permissions.services import RoleService
from app.Roles_and_Permissions.schemas import RoleCreate, RoleUpdate, RoleResponse, RoleDetailResponse

router = APIRouter(prefix="/roles", tags=["Role Management"])


@router.get("", response_model=List[RoleResponse])
def list_roles(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    return RoleService.get_roles(db=db, organization_id=current_user.organization_id)


@router.get("/{role_id}", response_model=RoleDetailResponse)
def get_role_details(
    role_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    return RoleService.get_role_details(
        db=db,
        role_id=role_id,
        organization_id=current_user.organization_id
    )


@router.post("", response_model=RoleDetailResponse, status_code=status.HTTP_201_CREATED)
def create_role(
    role_in: RoleCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    res = RoleService.create_role(
        db=db,
        role_in=role_in,
        organization_id=current_user.organization_id
    )
    ws_manager.trigger_event(
        current_user.organization_id,
        "ROLE_CREATED",
        {"role": res.model_dump(mode="json")}
    )
    return res


@router.put("/{role_id}", response_model=RoleDetailResponse)
def update_role(
    role_id: str,
    updates: RoleUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    res = RoleService.update_role(
        db=db,
        role_id=role_id,
        updates=updates,
        organization_id=current_user.organization_id
    )
    ws_manager.trigger_event(
        current_user.organization_id,
        "ROLE_UPDATED",
        {"role": res.model_dump(mode="json")}
    )
    return res


@router.delete("/{role_id}")
def delete_role(
    role_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    RoleService.delete_role(
        db=db,
        role_id=role_id,
        organization_id=current_user.organization_id
    )
    ws_manager.trigger_event(
        current_user.organization_id,
        "ROLE_DELETED",
        {"role_id": role_id}
    )
    return {"message": "Role deleted successfully"}
