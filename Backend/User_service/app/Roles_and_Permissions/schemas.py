from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from datetime import datetime


class PermissionResponse(BaseModel):
    id: str
    slug: str
    name: str
    module: str
    description: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class RolePermissionsUpdate(BaseModel):
    permission_ids: List[str]


class ModulePermissionsGroup(BaseModel):
    module: str
    permissions: List[PermissionResponse]


class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None


class RoleCreate(RoleBase):
    slug: Optional[str] = None
    permission_ids: Optional[List[str]] = None


class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permission_ids: Optional[List[str]] = None


class RoleResponse(BaseModel):
    id: str
    organization_id: Optional[str] = None
    name: str
    slug: str
    description: Optional[str] = None
    is_system: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class RoleDetailResponse(RoleResponse):
    permissions: List[PermissionResponse] = []
