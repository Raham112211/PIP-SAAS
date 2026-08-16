from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, CurrentUser
from app.core.ws_manager import ws_manager
from app.Staff.services import UserService
from app.Staff.schemas import (
    StaffCreate,
    StaffUpdate,
    StaffResponse,
    StaffListResponse,
    BranchAssignmentRequest,
    RoleAssignmentRequest,
)

router = APIRouter(prefix="/staff", tags=["Staff Management"])


@router.get("", response_model=StaffListResponse)
def list_staff(
    branch_id: Optional[str] = Query(None, description="Filter staff by branch ID"),
    role_id: Optional[str] = Query(None, description="Filter staff by role ID or slug"),
    search: Optional[str] = Query(None, description="Search by name, email, phone or designation"),
    status: Optional[str] = Query(None, description="Filter by status (active, inactive, suspended)"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    return UserService.get_staff_list(
        db=db,
        organization_id=current_user.organization_id,
        branch_id=branch_id,
        role_id=role_id,
        search=search,
        status=status,
        page=page,
        page_size=page_size
    )


@router.get("/{staff_id}", response_model=StaffResponse)
def get_staff_details(
    staff_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    return UserService.get_staff_by_id(
        db=db,
        staff_id=staff_id,
        organization_id=current_user.organization_id
    )


@router.post("", response_model=StaffResponse, status_code=status.HTTP_201_CREATED)
def create_staff(
    staff_in: StaffCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    res = UserService.create_staff(
        db=db,
        staff_in=staff_in,
        organization_id=current_user.organization_id
    )
    ws_manager.trigger_event(
        current_user.organization_id,
        "STAFF_CREATED",
        {"staff": res.model_dump(mode="json")}
    )
    return res


@router.put("/{staff_id}", response_model=StaffResponse)
def update_staff(
    staff_id: str,
    updates: StaffUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    res = UserService.update_staff(
        db=db,
        staff_id=staff_id,
        updates=updates,
        organization_id=current_user.organization_id
    )
    ws_manager.trigger_event(
        current_user.organization_id,
        "STAFF_UPDATED",
        {"staff": res.model_dump(mode="json")}
    )
    return res


@router.delete("/{staff_id}")
def delete_staff(
    staff_id: str,
    hard_delete: bool = Query(False, description="True for hard delete, False for deactivation"),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    UserService.delete_staff(
        db=db,
        staff_id=staff_id,
        organization_id=current_user.organization_id,
        hard_delete=hard_delete
    )
    ws_manager.trigger_event(
        current_user.organization_id,
        "STAFF_DELETED",
        {"staff_id": staff_id, "hard_delete": hard_delete}
    )
    return {"message": "Staff member deleted successfully" if hard_delete else "Staff member deactivated successfully"}


@router.post("/{staff_id}/branches", response_model=StaffResponse)
def assign_staff_branches(
    staff_id: str,
    assignment: BranchAssignmentRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    res = UserService.assign_branches(
        db=db,
        staff_id=staff_id,
        assignment=assignment,
        organization_id=current_user.organization_id
    )
    ws_manager.trigger_event(
        current_user.organization_id,
        "STAFF_BRANCHES_ASSIGNED",
        {"staff": res.model_dump(mode="json")}
    )
    return res


@router.post("/{staff_id}/role", response_model=StaffResponse)
def assign_staff_role(
    staff_id: str,
    assignment: RoleAssignmentRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    res = UserService.assign_role(
        db=db,
        staff_id=staff_id,
        assignment=assignment,
        organization_id=current_user.organization_id
    )
    ws_manager.trigger_event(
        current_user.organization_id,
        "STAFF_ROLE_ASSIGNED",
        {"staff": res.model_dump(mode="json")}
    )
    return res
