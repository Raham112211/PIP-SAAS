from typing import List, Dict, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.Roles_and_Permissions.repositories import PermissionRepository, RoleRepository
from app.Roles_and_Permissions.schemas import (
    PermissionResponse,
    ModulePermissionsGroup,
    RoleCreate,
    RoleUpdate,
    RoleResponse,
    RoleDetailResponse
)
from app.Roles_and_Permissions.models import Role


class PermissionService:
    @staticmethod
    def get_all_permissions(db: Session) -> List[PermissionResponse]:
        perms = PermissionRepository.get_all_permissions(db)
        return [PermissionResponse.model_validate(p) for p in perms]

    @staticmethod
    def get_permissions_grouped_by_module(db: Session) -> List[ModulePermissionsGroup]:
        perms = PermissionRepository.get_all_permissions(db)
        grouped: Dict[str, List[PermissionResponse]] = {}
        for p in perms:
            p_resp = PermissionResponse.model_validate(p)
            if p.module not in grouped:
                grouped[p.module] = []
            grouped[p.module].append(p_resp)

        return [
            ModulePermissionsGroup(module=module_name, permissions=module_perms)
            for module_name, module_perms in grouped.items()
        ]

    @staticmethod
    def get_role_permissions(db: Session, role_id: str, organization_id: str) -> List[PermissionResponse]:
        role = RoleRepository.get_role_by_id(db, role_id, organization_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Role with ID '{role_id}' not found"
            )
        perms = PermissionRepository.get_role_permissions(db, role.id)
        return [PermissionResponse.model_validate(p) for p in perms]

    @staticmethod
    def update_role_permissions(
        db: Session,
        role_id: str,
        permission_ids: List[str],
        organization_id: str
    ) -> List[PermissionResponse]:
        role = RoleRepository.get_role_by_id(db, role_id, organization_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Role with ID '{role_id}' not found"
            )

        if role.slug == "company_admin":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Company Admin maintains full system access and permissions by design"
            )

        valid_perms = PermissionRepository.get_permissions_by_ids(db, permission_ids)
        if len(valid_perms) != len(set(permission_ids)):
            found_ids = {p.id for p in valid_perms}
            invalid_ids = set(permission_ids) - found_ids
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid permission IDs provided: {list(invalid_ids)}"
            )

        updated_perms = PermissionRepository.set_role_permissions(db, role.id, permission_ids)
        return [PermissionResponse.model_validate(p) for p in updated_perms]


class RoleService:
    @staticmethod
    def get_roles(db: Session, organization_id: str) -> List[RoleResponse]:
        roles = RoleRepository.get_roles(db, organization_id)
        return [RoleResponse.model_validate(r) for r in roles]

    @staticmethod
    def get_role_details(db: Session, role_id: str, organization_id: str) -> RoleDetailResponse:
        role = RoleRepository.get_role_by_id(db, role_id, organization_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Role with ID '{role_id}' not found"
            )
        perms = PermissionRepository.get_role_permissions(db, role.id)
        return RoleDetailResponse(
            id=role.id,
            organization_id=role.organization_id,
            name=role.name,
            slug=role.slug,
            description=role.description,
            is_system=role.is_system,
            created_at=role.created_at,
            updated_at=role.updated_at,
            permissions=[PermissionResponse.model_validate(p) for p in perms]
        )

    @staticmethod
    def create_role(db: Session, role_in: RoleCreate, organization_id: str) -> RoleDetailResponse:
        slug = role_in.slug or role_in.name.lower().replace(" ", "_")
        existing = RoleRepository.get_role_by_slug(db, slug, organization_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Role with slug '{slug}' already exists in this organization"
            )

        if role_in.permission_ids:
            valid_perms = PermissionRepository.get_permissions_by_ids(db, role_in.permission_ids)
            if len(valid_perms) != len(set(role_in.permission_ids)):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="One or more invalid permission IDs provided"
                )

        created_role = RoleRepository.create_role(db, role_in, organization_id)
        perms = PermissionRepository.get_role_permissions(db, created_role.id)
        return RoleDetailResponse(
            id=created_role.id,
            organization_id=created_role.organization_id,
            name=created_role.name,
            slug=created_role.slug,
            description=created_role.description,
            is_system=created_role.is_system,
            created_at=created_role.created_at,
            updated_at=created_role.updated_at,
            permissions=[PermissionResponse.model_validate(p) for p in perms]
        )

    @staticmethod
    def update_role(db: Session, role_id: str, updates: RoleUpdate, organization_id: str) -> RoleDetailResponse:
        role = RoleRepository.get_role_by_id(db, role_id, organization_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Role with ID '{role_id}' not found"
            )

        if role.slug == "company_admin":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Master Company Admin role title cannot be modified"
            )

        if updates.permission_ids:
            valid_perms = PermissionRepository.get_permissions_by_ids(db, updates.permission_ids)
            if len(valid_perms) != len(set(updates.permission_ids)):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="One or more invalid permission IDs provided"
                )

        updated_role = RoleRepository.update_role(db, role, updates)
        perms = PermissionRepository.get_role_permissions(db, updated_role.id)
        return RoleDetailResponse(
            id=updated_role.id,
            organization_id=updated_role.organization_id,
            name=updated_role.name,
            slug=updated_role.slug,
            description=updated_role.description,
            is_system=updated_role.is_system,
            created_at=updated_role.created_at,
            updated_at=updated_role.updated_at,
            permissions=[PermissionResponse.model_validate(p) for p in perms]
        )

    @staticmethod
    def delete_role(db: Session, role_id: str, organization_id: str) -> None:
        role = RoleRepository.get_role_by_id(db, role_id, organization_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Role with ID '{role_id}' not found"
            )

        if role.slug == "company_admin":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Master Company Admin role cannot be deleted"
            )

        RoleRepository.delete_role(db, role)
