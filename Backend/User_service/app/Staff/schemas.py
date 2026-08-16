from typing import List, Optional
from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime


class BranchSummaryResponse(BaseModel):
    id: str
    name: str
    code: str
    city: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class RoleSummaryResponse(BaseModel):
    id: str
    name: str
    slug: str
    is_system: bool = False

    model_config = ConfigDict(from_attributes=True)


class StaffCreate(BaseModel):
    email: EmailStr
    password: Optional[str] = "TempPass123!"
    full_name: str
    phone: Optional[str] = None
    designation: Optional[str] = None
    role_id: Optional[str] = None
    role: Optional[str] = "staff"
    branch_ids: Optional[List[str]] = None
    status: Optional[str] = "active"


class StaffUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    designation: Optional[str] = None
    status: Optional[str] = None
    role_id: Optional[str] = None
    role: Optional[str] = None
    branch_ids: Optional[List[str]] = None
    is_active: Optional[bool] = None


class StaffResponse(BaseModel):
    id: str
    organization_id: Optional[str] = None
    email: str
    full_name: str
    phone: Optional[str] = None
    designation: Optional[str] = None
    role: str
    role_id: Optional[str] = None
    role_details: Optional[RoleSummaryResponse] = None
    branches: List[BranchSummaryResponse] = []
    status: str
    is_active: bool
    is_verified: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class StaffListResponse(BaseModel):
    items: List[StaffResponse]
    total: int
    page: int
    page_size: int


class BranchAssignmentRequest(BaseModel):
    branch_ids: List[str]


class RoleAssignmentRequest(BaseModel):
    role_id: Optional[str] = None
    role: Optional[str] = None
