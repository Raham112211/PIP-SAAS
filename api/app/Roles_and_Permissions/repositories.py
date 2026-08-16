from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select, or_
from app.Roles_and_Permissions.models import Role, Permission, RolePermission
from app.Roles_and_Permissions.schemas import RoleCreate, RoleUpdate


class PermissionRepository:
    @staticmethod
    def get_all_permissions(db: Session) -> List[Permission]:
        stmt = select(Permission).order_by(Permission.module, Permission.name)
        return list(db.scalars(stmt).all())

    @staticmethod
    def get_permissions_by_ids(db: Session, permission_ids: List[str]) -> List[Permission]:
        stmt = select(Permission).where(Permission.id.in_(permission_ids))
        return list(db.scalars(stmt).all())

    @staticmethod
    def get_role_permissions(db: Session, role_id: str) -> List[Permission]:
        stmt = (
            select(Permission)
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .where(RolePermission.role_id == str(role_id))
            .order_by(Permission.module, Permission.name)
        )
        return list(db.scalars(stmt).all())

    @staticmethod
    def set_role_permissions(db: Session, role_id: str, permission_ids: List[str]) -> List[Permission]:
        # Delete existing role permissions
        existing = db.scalars(
            select(RolePermission).where(RolePermission.role_id == str(role_id))
        ).all()
        for rp in existing:
            db.delete(rp)
        db.flush()

        # Add new role permissions
        for pid in permission_ids:
            rp = RolePermission(role_id=str(role_id), permission_id=str(pid))
            db.add(rp)
        
        db.commit()
        return PermissionRepository.get_role_permissions(db, role_id)

    @staticmethod
    def seed_default_permissions(db: Session) -> None:
        """Seed standard permissions across modules if not existing"""
        standard_permissions = [
            # Staff
            {"slug": "staff:view", "name": "View Staff", "module": "staff", "description": "View staff profiles and listings"},
            {"slug": "staff:create", "name": "Create Staff", "module": "staff", "description": "Add new staff members"},
            {"slug": "staff:edit", "name": "Edit Staff", "module": "staff", "description": "Update staff details"},
            {"slug": "staff:delete", "name": "Delete Staff", "module": "staff", "description": "Remove or deactivate staff members"},
            {"slug": "staff:assign_role", "name": "Assign Role", "module": "staff", "description": "Assign roles to staff members"},
            {"slug": "staff:assign_branch", "name": "Assign Branch", "module": "staff", "description": "Assign staff to branches"},

            # Roles & Permissions
            {"slug": "roles:view", "name": "View Roles", "module": "roles", "description": "View roles and permission matrices"},
            {"slug": "roles:create", "name": "Create Role", "module": "roles", "description": "Create custom organization roles"},
            {"slug": "roles:edit", "name": "Edit Role", "module": "roles", "description": "Modify role permissions and settings"},
            {"slug": "roles:delete", "name": "Delete Role", "module": "roles", "description": "Delete custom roles"},

            # Branches
            {"slug": "branches:view", "name": "View Branches", "module": "branches", "description": "View branch locations and stats"},
            {"slug": "branches:create", "name": "Create Branch", "module": "branches", "description": "Add new branch offices"},
            {"slug": "branches:edit", "name": "Edit Branch", "module": "branches", "description": "Update branch info"},
            {"slug": "branches:delete", "name": "Delete Branch", "module": "branches", "description": "Remove branch records"},

            # Connections
            {"slug": "connections:view", "name": "View Connections", "module": "connections", "description": "View meters and connection details"},
            {"slug": "connections:create", "name": "Add Connection", "module": "connections", "description": "Register consumer connections"},
            {"slug": "connections:edit", "name": "Edit Connection", "module": "connections", "description": "Update connection details"},

            # Bills
            {"slug": "bills:view", "name": "View Bills", "module": "bills", "description": "View utility invoices and details"},
            {"slug": "bills:download", "name": "Download Bills", "module": "bills", "description": "Download original PDF bills"},
            {"slug": "bills:export", "name": "Export Bills Data", "module": "bills", "description": "Export billing spreadsheets"},

            # Scraper
            {"slug": "scraper:run", "name": "Trigger Scraper", "module": "scraper", "description": "Run live utility web scraper"},
            {"slug": "scraper:view_jobs", "name": "View Scraping Jobs", "module": "scraper", "description": "Inspect automated scraping logs"},

            # Reports
            {"slug": "reports:view", "name": "View Analytics", "module": "reports", "description": "View analytics and consumption charts"},
            {"slug": "reports:export", "name": "Export Reports", "module": "reports", "description": "Export reports to Excel/PDF"},

            # Settings
            {"slug": "settings:edit", "name": "Edit Settings", "module": "settings", "description": "Modify organization system preferences"}
        ]

        for p_def in standard_permissions:
            existing = db.scalars(
                select(Permission).where(Permission.slug == p_def["slug"])
            ).first()
            if not existing:
                p = Permission(
                    slug=p_def["slug"],
                    name=p_def["name"],
                    module=p_def["module"],
                    description=p_def["description"]
                )
                db.add(p)
        db.commit()


class RoleRepository:
    @staticmethod
    def get_roles(db: Session, organization_id: str) -> List[Role]:
        stmt = (
            select(Role)
            .where(
                or_(
                    Role.is_system == True,
                    Role.organization_id == str(organization_id)
                )
            )
            .order_by(Role.is_system.desc(), Role.name)
        )
        return list(db.scalars(stmt).all())

    @staticmethod
    def get_role_by_id(db: Session, role_id: str, organization_id: Optional[str] = None) -> Optional[Role]:
        stmt = select(Role).where(Role.id == str(role_id))
        if organization_id:
            stmt = stmt.where(
                or_(
                    Role.is_system == True,
                    Role.organization_id == str(organization_id)
                )
            )
        return db.scalars(stmt).first()

    @staticmethod
    def get_role_by_slug(db: Session, slug: str, organization_id: Optional[str] = None) -> Optional[Role]:
        stmt = select(Role).where(Role.slug == slug)
        if organization_id:
            stmt = stmt.where(
                or_(
                    Role.is_system == True,
                    Role.organization_id == str(organization_id)
                )
            )
        return db.scalars(stmt).first()

    @staticmethod
    def create_role(db: Session, role_in: RoleCreate, organization_id: str) -> Role:
        slug = role_in.slug or role_in.name.lower().replace(" ", "_")
        role = Role(
            organization_id=str(organization_id),
            name=role_in.name,
            slug=slug,
            description=role_in.description,
            is_system=False
        )
        db.add(role)
        db.commit()
        db.refresh(role)

        if role_in.permission_ids:
            PermissionRepository.set_role_permissions(db, role.id, role_in.permission_ids)
            db.refresh(role)

        return role

    @staticmethod
    def update_role(db: Session, role: Role, updates: RoleUpdate) -> Role:
        if updates.name is not None:
            role.name = updates.name
        if updates.description is not None:
            role.description = updates.description
        
        db.commit()
        db.refresh(role)

        if updates.permission_ids is not None:
            PermissionRepository.set_role_permissions(db, role.id, updates.permission_ids)
            db.refresh(role)

        return role

    @staticmethod
    def delete_role(db: Session, role: Role) -> None:
        db.delete(role)
        db.commit()

    @staticmethod
    def seed_default_roles(db: Session) -> None:
        all_perms = PermissionRepository.get_all_permissions(db)
        perm_by_slug = {p.slug: p.id for p in all_perms}

        system_roles_spec = [
            {
                "name": "Company Admin",
                "slug": "company_admin",
                "description": "Full access to organization staff, roles, branches, bills, and settings",
                "perms": list(perm_by_slug.keys())
            }
        ]

        for r_def in system_roles_spec:
            existing = db.scalars(
                select(Role).where(Role.slug == r_def["slug"], Role.is_system == True)
            ).first()
            
            if not existing:
                new_role = Role(
                    name=r_def["name"],
                    slug=r_def["slug"],
                    description=r_def["description"],
                    is_system=True,
                    organization_id=None
                )
                db.add(new_role)
                db.commit()
                db.refresh(new_role)
                existing = new_role

            p_ids = [perm_by_slug[p_slug] for p_slug in r_def["perms"] if p_slug in perm_by_slug]
            current_role_perms = db.scalars(
                select(RolePermission).where(RolePermission.role_id == existing.id)
            ).all()
            if not current_role_perms and p_ids:
                PermissionRepository.set_role_permissions(db, existing.id, p_ids)
