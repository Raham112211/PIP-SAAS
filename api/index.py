import os
import sys
import uuid
import tempfile
from typing import List, Optional
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, Header, HTTPException, Query, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy import (
    create_engine, Column, String, Boolean, DateTime, Text,
    ForeignKey, Table, select, or_
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship, Session
from sqlalchemy.pool import StaticPool

# ── 1. Database Setup (Cross-Platform / Vercel Serverless Temp Storage) ────────
tmp_db = Path(tempfile.gettempdir()) / "pip_saas_cloud.db"
DATABASE_URL = f"sqlite:///{tmp_db.as_posix()}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ── 2. SQLAlchemy ORM Models ──────────────────────────────────────────────────
class Organization(Base):
    __tablename__ = "organizations"
    id = Column(String(50), primary_key=True, default=lambda: f"org-{uuid.uuid4().hex[:8]}")
    name = Column(String(100), nullable=False)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    status = Column(String(20), default="active", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class Branch(Base):
    __tablename__ = "branches"
    id = Column(String(50), primary_key=True, default=lambda: f"br-{uuid.uuid4().hex[:8]}")
    organization_id = Column(String(50), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    code = Column(String(20), nullable=True)
    city = Column(String(50), nullable=True)
    status = Column(String(20), default="active", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Permission(Base):
    __tablename__ = "permissions"
    id = Column(String(50), primary_key=True, default=lambda: f"perm-{uuid.uuid4().hex[:8]}")
    name = Column(String(100), nullable=False)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    module = Column(String(50), nullable=False, index=True)
    description = Column(Text, nullable=True)

class Role(Base):
    __tablename__ = "roles"
    id = Column(String(50), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(50), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), index=True, nullable=False)
    description = Column(Text, nullable=True)
    is_system = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class RolePermission(Base):
    __tablename__ = "role_permissions"
    role_id = Column(String(50), ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)
    permission_id = Column(String(50), ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True)

class User(Base):
    __tablename__ = "users"
    id = Column(String(50), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(50), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=True, default="demo123")
    full_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    designation = Column(String(100), nullable=True)
    role = Column(String(50), default="staff", nullable=False)
    role_id = Column(String(50), ForeignKey("roles.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(20), default="active", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

# ── 3. Seed Schema ────────────────────────────────────────────────────────────
SYSTEM_PERMISSIONS = [
    {"slug": "dashboard.view", "name": "View Dashboard", "module": "dashboard", "description": "Access metrics and analytics"},
    {"slug": "staff.view", "name": "View Staff Directory", "module": "staff", "description": "Browse active corporate staff"},
    {"slug": "staff.manage", "name": "Manage Staff", "module": "staff", "description": "Create, edit, and assign roles to staff"},
    {"slug": "roles.view", "name": "View Roles", "module": "roles", "description": "View system and organization roles"},
    {"slug": "roles.manage", "name": "Manage Roles & Permissions", "module": "roles", "description": "Create and edit custom role permissions"},
    {"slug": "branches.view", "name": "View Branches", "module": "branches", "description": "View corporate branch listings"},
    {"slug": "branches.manage", "name": "Manage Branches", "module": "branches", "description": "Create and edit branch nodes"},
    {"slug": "bills.view", "name": "View Bills", "module": "bills", "description": "View consumer bills and batches"},
    {"slug": "bills.manage", "name": "Manage Bills", "module": "bills", "description": "Create, verify, and print billing batches"},
    {"slug": "reports.view", "name": "View Reports", "module": "reports", "description": "Generate audit and financial reports"},
    {"slug": "reports.export", "name": "Export Reports", "module": "reports", "description": "Download analytical spreadsheets"},
]

def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # 1. Default Org
        org = db.scalars(select(Organization).where(Organization.id == "org-1001")).first()
        if not org:
            db.add(Organization(id="org-1001", name="PIP Enterprise Organization", slug="pip-org", status="active"))
            db.commit()

        # 2. Permissions
        for p_def in SYSTEM_PERMISSIONS:
            p = db.scalars(select(Permission).where(Permission.slug == p_def["slug"])).first()
            if not p:
                db.add(Permission(slug=p_def["slug"], name=p_def["name"], module=p_def["module"], description=p_def["description"]))
        db.commit()

        # 3. Default Roles
        admin_role = db.scalars(select(Role).where(Role.slug == "company_admin")).first()
        if not admin_role:
            admin_role = Role(
                id="role-admin-101",
                name="Company Admin",
                slug="company_admin",
                description="Full access to organization staff, roles, branches, bills, and settings",
                is_system=True,
                organization_id=None
            )
            db.add(admin_role)
            db.commit()

            # Grant all permissions to Company Admin
            all_perms = db.scalars(select(Permission)).all()
            for p in all_perms:
                db.add(RolePermission(role_id=admin_role.id, permission_id=p.id))
            db.commit()

        # 4. Default Seed Staff (if none exists)
        has_staff = db.scalars(select(User).where(User.organization_id == "org-1001")).first()
        if not has_staff:
            db.add(User(
                id="user-101",
                organization_id="org-1001",
                email="admin@pip.com",
                full_name="Admin Director",
                designation="Director",
                role="company_admin",
                role_id=admin_role.id,
                status="active",
                is_active=True,
                is_verified=True
            ))
            db.commit()
    except Exception as e:
        print("Schema init notice:", e)
    finally:
        db.close()

init_db()

# ── 4. FastAPI Application ────────────────────────────────────────────────────
app = FastAPI(title="PIP SaaS Cloud API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── 5. Request & Response Schemas ─────────────────────────────────────────────
class StaffCreate(BaseModel):
    full_name: str
    email: str
    phone: Optional[str] = None
    role_id: Optional[str] = None
    branch_ids: Optional[List[str]] = []
    designation: Optional[str] = None

class RoleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    permission_ids: Optional[List[str]] = []

class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permission_ids: Optional[List[str]] = None

class PermissionUpdate(BaseModel):
    permission_ids: List[str]

# ── 6. Endpoints (Registered on both / and /api for Serverless Compatibility) ─
@app.get("/health")
@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "PIP SaaS Cloud Engine"}

# ── Staff Endpoints ──
def _get_staff_list(db: Session, org_id: str, search: Optional[str], status_filter: Optional[str]):
    stmt = select(User).where(User.organization_id == org_id)
    if search:
        stmt = stmt.where(or_(User.full_name.ilike(f"%{search}%"), User.email.ilike(f"%{search}%")))
    if status_filter and status_filter.upper() != "ALL":
        stmt = stmt.where(User.status == status_filter.lower())
    users = db.scalars(stmt.order_by(User.created_at.desc())).all()
    
    items = []
    for u in users:
        role_name = "Staff"
        if u.role_id:
            r = db.scalars(select(Role).where(Role.id == u.role_id)).first()
            if r: role_name = r.name
        items.append({
            "id": u.id,
            "organization_id": u.organization_id,
            "email": u.email,
            "full_name": u.full_name,
            "phone": u.phone,
            "designation": u.designation,
            "role": u.role,
            "role_id": u.role_id,
            "role_details": {"id": u.role_id, "name": role_name} if u.role_id else None,
            "branches": [],
            "status": u.status,
            "is_active": u.is_active,
            "is_verified": u.is_verified,
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "updated_at": u.updated_at.isoformat() if u.updated_at else None,
        })
    return {"items": items, "total": len(items), "page": 1, "page_size": 50}

@app.get("/staff")
@app.get("/api/staff")
def list_staff(
    search: Optional[str] = None,
    status: Optional[str] = None,
    x_organization_id: Optional[str] = Header(None, alias="X-Organization-Id")
):
    org_id = x_organization_id or "org-1001"
    db = SessionLocal()
    try:
        return _get_staff_list(db, org_id, search, status)
    finally:
        db.close()

@app.post("/staff", status_code=status.HTTP_201_CREATED)
@app.post("/api/staff", status_code=status.HTTP_201_CREATED)
def create_staff(
    payload: StaffCreate,
    x_organization_id: Optional[str] = Header(None, alias="X-Organization-Id")
):
    org_id = x_organization_id or "org-1001"
    db = SessionLocal()
    try:
        existing = db.scalars(select(User).where(User.email == payload.email)).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"User with email '{payload.email}' already exists.")
        
        user = User(
            id=f"usr-{uuid.uuid4().hex[:8]}",
            organization_id=org_id,
            email=payload.email,
            full_name=payload.full_name,
            phone=payload.phone,
            designation=payload.designation,
            role="staff",
            role_id=payload.role_id,
            status="active",
            is_active=True,
            is_verified=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return {
            "id": user.id,
            "organization_id": user.organization_id,
            "email": user.email,
            "full_name": user.full_name,
            "phone": user.phone,
            "designation": user.designation,
            "role": user.role,
            "role_id": user.role_id,
            "status": user.status,
            "is_active": user.is_active,
            "is_verified": user.is_verified,
            "created_at": user.created_at.isoformat() if user.created_at else None,
        }
    finally:
        db.close()

# ── Role Endpoints ──
@app.get("/roles")
@app.get("/api/roles")
def list_roles(x_organization_id: Optional[str] = Header(None, alias="X-Organization-Id")):
    org_id = x_organization_id or "org-1001"
    db = SessionLocal()
    try:
        roles = db.scalars(
            select(Role).where(or_(Role.is_system == True, Role.organization_id == org_id)).order_by(Role.is_system.desc(), Role.name)
        ).all()
        return [
            {
                "id": r.id,
                "organization_id": r.organization_id,
                "name": r.name,
                "slug": r.slug,
                "description": r.description,
                "is_system": r.is_system,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "updated_at": r.updated_at.isoformat() if r.updated_at else None,
            }
            for r in roles
        ]
    finally:
        db.close()

@app.post("/roles", status_code=status.HTTP_201_CREATED)
@app.post("/api/roles", status_code=status.HTTP_201_CREATED)
def create_role(
    payload: RoleCreate,
    x_organization_id: Optional[str] = Header(None, alias="X-Organization-Id")
):
    org_id = x_organization_id or "org-1001"
    db = SessionLocal()
    try:
        slug = payload.name.lower().replace(" ", "_")
        role = Role(
            id=f"role-{uuid.uuid4().hex[:8]}",
            organization_id=org_id,
            name=payload.name,
            slug=slug,
            description=payload.description,
            is_system=False,
        )
        db.add(role)
        db.commit()
        db.refresh(role)

        if payload.permission_ids:
            for p_id in payload.permission_ids:
                db.add(RolePermission(role_id=role.id, permission_id=p_id))
            db.commit()

        return {
            "id": role.id,
            "organization_id": role.organization_id,
            "name": role.name,
            "slug": role.slug,
            "description": role.description,
            "is_system": role.is_system,
            "created_at": role.created_at.isoformat() if role.created_at else None,
        }
    finally:
        db.close()

@app.put("/roles/{role_id}")
@app.put("/api/roles/{role_id}")
def update_role(role_id: str, payload: RoleUpdate):
    db = SessionLocal()
    try:
        role = db.scalars(select(Role).where(Role.id == role_id)).first()
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")
        if payload.name: role.name = payload.name
        if payload.description is not None: role.description = payload.description
        db.commit()
        db.refresh(role)
        return {
            "id": role.id,
            "organization_id": role.organization_id,
            "name": role.name,
            "slug": role.slug,
            "description": role.description,
            "is_system": role.is_system,
        }
    finally:
        db.close()

@app.delete("/roles/{role_id}")
@app.delete("/api/roles/{role_id}")
def delete_role(role_id: str):
    db = SessionLocal()
    try:
        role = db.scalars(select(Role).where(Role.id == role_id)).first()
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")
        if role.is_system:
            raise HTTPException(status_code=400, detail="System roles cannot be deleted")
        db.delete(role)
        db.commit()
        return {"status": "success", "deleted_id": role_id}
    finally:
        db.close()

# ── Permissions Endpoints ──
@app.get("/permissions")
@app.get("/api/permissions")
def list_permissions():
    db = SessionLocal()
    try:
        perms = db.scalars(select(Permission)).all()
        return [
            {"id": p.id, "name": p.name, "slug": p.slug, "module": p.module, "description": p.description}
            for p in perms
        ]
    finally:
        db.close()

@app.get("/permissions/modules")
@app.get("/api/permissions/modules")
def list_permission_modules():
    db = SessionLocal()
    try:
        perms = db.scalars(select(Permission)).all()
        modules_map = {}
        for p in perms:
            if p.module not in modules_map:
                modules_map[p.module] = {
                    "module": p.module,
                    "name": p.module.capitalize(),
                    "permissions": []
                }
            modules_map[p.module]["permissions"].append({
                "id": p.id,
                "name": p.name,
                "slug": p.slug,
                "description": p.description
            })
        return list(modules_map.values())
    finally:
        db.close()

@app.get("/roles/{role_id}/permissions")
@app.get("/api/roles/{role_id}/permissions")
def get_role_permissions(role_id: str):
    db = SessionLocal()
    try:
        stmt = (
            select(Permission)
            .join(RolePermission, Permission.id == RolePermission.permission_id)
            .where(RolePermission.role_id == role_id)
        )
        perms = db.scalars(stmt).all()
        return [
            {"id": p.id, "name": p.name, "slug": p.slug, "module": p.module, "description": p.description}
            for p in perms
        ]
    finally:
        db.close()

@app.put("/roles/{role_id}/permissions")
@app.put("/api/roles/{role_id}/permissions")
def update_role_permissions(role_id: str, payload: PermissionUpdate):
    db = SessionLocal()
    try:
        # Delete existing mappings
        db.query(RolePermission).filter(RolePermission.role_id == role_id).delete()
        for p_id in payload.permission_ids:
            db.add(RolePermission(role_id=role_id, permission_id=p_id))
        db.commit()
        return {"status": "success", "role_id": role_id, "permission_count": len(payload.permission_ids)}
    finally:
        db.close()

# Export handler for Vercel
handler = app
