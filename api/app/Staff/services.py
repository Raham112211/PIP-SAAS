from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.Staff.repositories import UserRepository
from app.Roles_and_Permissions.repositories import RoleRepository
from app.Staff.schemas import (
    StaffCreate,
    StaffUpdate,
    StaffResponse,
    StaffListResponse,
    BranchAssignmentRequest,
    RoleAssignmentRequest,
    BranchSummaryResponse,
    RoleSummaryResponse,
)
from app.core.security import get_password_hash
from app.Staff.models import User


class UserService:
    @staticmethod
    def _to_staff_response(user: User) -> StaffResponse:
        # Map branches from user's branch_users relationship
        branches = []
        if user.branch_users:
            for bu in user.branch_users:
                if bu.branch:
                    branches.append(
                        BranchSummaryResponse(
                            id=bu.branch.id,
                            name=bu.branch.name,
                            code=bu.branch.code,
                            city=bu.branch.city
                        )
                    )

        # Map role details
        role_details = None
        if user.role_obj:
            role_details = RoleSummaryResponse(
                id=user.role_obj.id,
                name=user.role_obj.name,
                slug=user.role_obj.slug,
                is_system=user.role_obj.is_system
            )

        return StaffResponse(
            id=user.id,
            organization_id=user.organization_id,
            email=user.email,
            full_name=user.full_name,
            phone=user.phone,
            designation=user.designation,
            role=user.role,
            role_id=user.role_id,
            role_details=role_details,
            branches=branches,
            status=user.status,
            is_active=user.is_active,
            is_verified=user.is_verified,
            created_at=user.created_at,
            updated_at=user.updated_at
        )

    @staticmethod
    def get_staff_list(
        db: Session,
        organization_id: str,
        branch_id: Optional[str] = None,
        role_id: Optional[str] = None,
        search: Optional[str] = None,
        status: Optional[str] = None,
        page: int = 1,
        page_size: int = 50
    ) -> StaffListResponse:
        skip = (page - 1) * page_size
        users = UserRepository.get_staff_list(
            db=db,
            organization_id=organization_id,
            branch_id=branch_id,
            role_id=role_id,
            search=search,
            status=status,
            skip=skip,
            limit=page_size
        )
        total = UserRepository.count_staff(
            db=db,
            organization_id=organization_id,
            branch_id=branch_id,
            role_id=role_id,
            search=search,
            status=status
        )

        items = [UserService._to_staff_response(u) for u in users]
        return StaffListResponse(items=items, total=total, page=page, page_size=page_size)

    @staticmethod
    def get_staff_by_id(db: Session, staff_id: str, organization_id: str) -> StaffResponse:
        user = UserRepository.get_staff_by_id(db, staff_id, organization_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Staff member with ID '{staff_id}' not found in this organization"
            )
        return UserService._to_staff_response(user)

    @staticmethod
    def create_staff(db: Session, staff_in: StaffCreate, organization_id: str) -> StaffResponse:
        # Check email uniqueness
        existing = UserRepository.get_user_by_email(db, staff_in.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"A user with email '{staff_in.email}' already exists"
            )

        # Validate branches belong to this organization
        if staff_in.branch_ids:
            branches = UserRepository.get_branches_by_ids(db, staff_in.branch_ids, organization_id)
            if len(branches) != len(set(staff_in.branch_ids)):
                found_ids = {b.id for b in branches}
                invalid_ids = set(staff_in.branch_ids) - found_ids
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid branch IDs for this organization: {list(invalid_ids)}"
                )

        # Resolve role
        role_obj = None
        if staff_in.role_id:
            role_obj = RoleRepository.get_role_by_id(db, staff_in.role_id, organization_id)
            if not role_obj:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Role with ID '{staff_in.role_id}' is invalid or not accessible"
                )
        elif staff_in.role:
            role_obj = RoleRepository.get_role_by_slug(db, staff_in.role, organization_id)

        password = staff_in.password or "TempPass123!"
        hashed_password = get_password_hash(password)

        created_user = UserRepository.create_staff(
            db=db,
            staff_in=staff_in,
            organization_id=organization_id,
            hashed_password=hashed_password,
            role_obj=role_obj
        )

        return UserService.get_staff_by_id(db, created_user.id, organization_id)

    @staticmethod
    def update_staff(
        db: Session,
        staff_id: str,
        updates: StaffUpdate,
        organization_id: str
    ) -> StaffResponse:
        user = UserRepository.get_staff_by_id(db, staff_id, organization_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Staff member with ID '{staff_id}' not found in this organization"
            )

        # Validate branches if provided
        if updates.branch_ids is not None:
            branches = UserRepository.get_branches_by_ids(db, updates.branch_ids, organization_id)
            if len(branches) != len(set(updates.branch_ids)):
                found_ids = {b.id for b in branches}
                invalid_ids = set(updates.branch_ids) - found_ids
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid branch IDs for this organization: {list(invalid_ids)}"
                )

        # Resolve role if provided
        role_obj = None
        if updates.role_id is not None:
            role_obj = RoleRepository.get_role_by_id(db, updates.role_id, organization_id)
            if not role_obj:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Role with ID '{updates.role_id}' is invalid or not accessible"
                )
        elif updates.role is not None:
            role_obj = RoleRepository.get_role_by_slug(db, updates.role, organization_id)

        updated_user = UserRepository.update_staff(
            db=db,
            user=user,
            updates=updates,
            role_obj=role_obj
        )

        return UserService.get_staff_by_id(db, updated_user.id, organization_id)

    @staticmethod
    def assign_branches(
        db: Session,
        staff_id: str,
        assignment: BranchAssignmentRequest,
        organization_id: str
    ) -> StaffResponse:
        user = UserRepository.get_staff_by_id(db, staff_id, organization_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Staff member with ID '{staff_id}' not found in this organization"
            )

        # Validate all branches belong to the organization
        branches = UserRepository.get_branches_by_ids(db, assignment.branch_ids, organization_id)
        if len(branches) != len(set(assignment.branch_ids)):
            found_ids = {b.id for b in branches}
            invalid_ids = set(assignment.branch_ids) - found_ids
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid branch IDs for this organization: {list(invalid_ids)}"
            )

        UserRepository.assign_branches(db, user, assignment.branch_ids)
        return UserService.get_staff_by_id(db, user.id, organization_id)

    @staticmethod
    def assign_role(
        db: Session,
        staff_id: str,
        assignment: RoleAssignmentRequest,
        organization_id: str
    ) -> StaffResponse:
        user = UserRepository.get_staff_by_id(db, staff_id, organization_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Staff member with ID '{staff_id}' not found in this organization"
            )

        role_obj = None
        if assignment.role_id:
            role_obj = RoleRepository.get_role_by_id(db, assignment.role_id, organization_id)
        elif assignment.role:
            role_obj = RoleRepository.get_role_by_slug(db, assignment.role, organization_id)

        if not role_obj:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Valid role_id or role slug is required"
            )

        UserRepository.assign_role(db, user, role_obj)
        return UserService.get_staff_by_id(db, user.id, organization_id)

    @staticmethod
    def delete_staff(db: Session, staff_id: str, organization_id: str, hard_delete: bool = False) -> None:
        user = UserRepository.get_staff_by_id(db, staff_id, organization_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Staff member with ID '{staff_id}' not found in this organization"
            )
        UserRepository.delete_staff(db, user, hard_delete=hard_delete)
