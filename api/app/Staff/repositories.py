from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select, func, or_, delete
from app.Staff.models import User
from app.core.branch import Branch, BranchUser
from app.Roles_and_Permissions.models import Role
from app.Staff.schemas import StaffCreate, StaffUpdate


class UserRepository:
    @staticmethod
    def get_staff_list(
        db: Session,
        organization_id: str,
        branch_id: Optional[str] = None,
        role_id: Optional[str] = None,
        search: Optional[str] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> List[User]:
        stmt = select(User).where(User.organization_id == str(organization_id))

        if status:
            stmt = stmt.where(User.status == status)

        if role_id:
            stmt = stmt.where(or_(User.role_id == role_id, User.role == role_id))

        if branch_id:
            stmt = stmt.join(BranchUser, BranchUser.user_id == User.id).where(BranchUser.branch_id == str(branch_id))

        if search:
            search_pattern = f"%{search}%"
            stmt = stmt.where(
                or_(
                    User.full_name.ilike(search_pattern),
                    User.email.ilike(search_pattern),
                    User.phone.ilike(search_pattern),
                    User.designation.ilike(search_pattern)
                )
            )

        stmt = stmt.order_by(User.created_at.desc()).offset(skip).limit(limit)
        return list(db.scalars(stmt).all())

    @staticmethod
    def count_staff(
        db: Session,
        organization_id: str,
        branch_id: Optional[str] = None,
        role_id: Optional[str] = None,
        search: Optional[str] = None,
        status: Optional[str] = None
    ) -> int:
        stmt = select(func.count(User.id)).where(User.organization_id == str(organization_id))

        if status:
            stmt = stmt.where(User.status == status)

        if role_id:
            stmt = stmt.where(or_(User.role_id == role_id, User.role == role_id))

        if branch_id:
            stmt = stmt.join(BranchUser, BranchUser.user_id == User.id).where(BranchUser.branch_id == str(branch_id))

        if search:
            search_pattern = f"%{search}%"
            stmt = stmt.where(
                or_(
                    User.full_name.ilike(search_pattern),
                    User.email.ilike(search_pattern),
                    User.phone.ilike(search_pattern),
                    User.designation.ilike(search_pattern)
                )
            )

        return db.scalar(stmt) or 0

    @staticmethod
    def get_staff_by_id(db: Session, staff_id: str, organization_id: Optional[str] = None) -> Optional[User]:
        stmt = select(User).where(User.id == str(staff_id))
        if organization_id:
            stmt = stmt.where(User.organization_id == str(organization_id))
        return db.scalars(stmt).first()

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        stmt = select(User).where(User.email == email.strip().lower())
        return db.scalars(stmt).first()

    @staticmethod
    def get_branches_by_ids(db: Session, branch_ids: List[str], organization_id: str) -> List[Branch]:
        if not branch_ids:
            return []
        stmt = select(Branch).where(
            Branch.id.in_([str(b) for b in branch_ids]),
            Branch.organization_id == str(organization_id)
        )
        return list(db.scalars(stmt).all())

    @staticmethod
    def create_staff(
        db: Session,
        staff_in: StaffCreate,
        organization_id: str,
        hashed_password: str,
        role_obj: Optional[Role] = None
    ) -> User:
        user = User(
            organization_id=str(organization_id),
            email=staff_in.email.strip().lower(),
            hashed_password=hashed_password,
            full_name=staff_in.full_name,
            phone=staff_in.phone,
            designation=staff_in.designation,
            role=role_obj.slug if role_obj else (staff_in.role or "staff"),
            role_id=role_obj.id if role_obj else staff_in.role_id,
            status=staff_in.status or "active",
            is_active=True,
            is_verified=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Assign branches if provided
        if staff_in.branch_ids:
            UserRepository.assign_branches(db, user, staff_in.branch_ids)
            db.refresh(user)

        return user

    @staticmethod
    def update_staff(
        db: Session,
        user: User,
        updates: StaffUpdate,
        role_obj: Optional[Role] = None
    ) -> User:
        if updates.full_name is not None:
            user.full_name = updates.full_name
        if updates.phone is not None:
            user.phone = updates.phone
        if updates.designation is not None:
            user.designation = updates.designation
        if updates.status is not None:
            user.status = updates.status
        if updates.is_active is not None:
            user.is_active = updates.is_active

        if role_obj is not None:
            user.role_obj = role_obj
            user.role_id = role_obj.id
            user.role = role_obj.slug
        elif updates.role is not None:
            user.role = updates.role

        db.commit()
        db.refresh(user)

        if updates.branch_ids is not None:
            UserRepository.assign_branches(db, user, updates.branch_ids)
            db.refresh(user)

        return user

    @staticmethod
    def delete_staff(db: Session, user: User, hard_delete: bool = False) -> None:
        if hard_delete:
            db.delete(user)
        else:
            user.is_active = False
            user.status = "inactive"
        db.commit()

    @staticmethod
    def assign_branches(db: Session, user: User, branch_ids: List[str]) -> None:
        # Clear existing branch associations
        db.execute(delete(BranchUser).where(BranchUser.user_id == user.id))
        
        # Add new branch assignments
        unique_branch_ids = set(str(b) for b in branch_ids)
        branch_users = [
            BranchUser(user_id=user.id, branch_id=bid)
            for bid in unique_branch_ids
        ]
        db.add_all(branch_users)
        db.commit()

    @staticmethod
    def assign_role(db: Session, user: User, role: Role) -> User:
        user.role_id = role.id
        user.role = role.slug
        user.role_obj = role
        db.commit()
        db.refresh(user)
        return user
