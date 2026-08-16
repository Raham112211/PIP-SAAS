import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.core.database import get_db
from app.core.base import Base
from app.core.organization import Organization
from app.core.branch import Branch, BranchUser
from app.Roles_and_Permissions.models import Role
from app.Staff.models import User
from app.Roles_and_Permissions.models import Permission
from app.Roles_and_Permissions.repositories import PermissionRepository
from app.Roles_and_Permissions.repositories import RoleRepository
from app.core.security import get_password_hash
from app.main import app

SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Create fresh database tables and seed defaults for each test."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    
    PermissionRepository.seed_default_permissions(session)
    RoleRepository.seed_default_roles(session)

    try:
        yield session
    finally:
        session.rollback()
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """FastAPI TestClient with overridden get_db dependency."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def seed_data(db_session):
    """Seed sample organizations, branches, and staff users."""
    org1 = Organization(id="org-1001", name="Acme Corporation", slug="acme-corp", status="active")
    org2 = Organization(id="org-2002", name="Beta Innovations", slug="beta-innovations", status="active")
    db_session.add_all([org1, org2])
    db_session.commit()

    branch1 = Branch(id="branch-101", organization_id="org-1001", name="Lahore Central", code="LHR-01", city="Lahore")
    branch2 = Branch(id="branch-102", organization_id="org-1001", name="Karachi South", code="KHI-01", city="Karachi")
    branch3 = Branch(id="branch-201", organization_id="org-2002", name="Islamabad Main", code="ISB-01", city="Islamabad")
    
    db_session.add_all([branch1, branch2, branch3])
    db_session.commit()

    admin_role = db_session.query(Role).filter(Role.slug == "company_admin", Role.is_system == True).first()
    staff_role = db_session.query(Role).filter(Role.slug == "staff").first()
    if not staff_role:
        staff_role = Role(name="Staff", slug="staff", is_system=False, organization_id=org1.id)
        db_session.add(staff_role)
        db_session.commit()
        
        p = db_session.query(Permission).filter(Permission.slug == "bills:view").first()
        if p:
            PermissionRepository.set_role_permissions(db_session, staff_role.id, [p.id])

    hashed_pwd = get_password_hash("Secret123!")
    user1 = User(
        id="user-101",
        organization_id="org-1001",
        email="admin@acme.com",
        hashed_password=hashed_pwd,
        full_name="Alice Admin",
        designation="Operations Lead",
        phone="+923001234567",
        role="company_admin",
        role_id=admin_role.id if admin_role else None,
        status="active",
        is_active=True,
        is_verified=True
    )
    user2 = User(
        id="user-102",
        organization_id="org-1001",
        email="john.staff@acme.com",
        hashed_password=hashed_pwd,
        full_name="John Staff",
        designation="Billing Analyst",
        phone="+923007654321",
        role="staff",
        role_id=staff_role.id if staff_role else None,
        status="active",
        is_active=True,
        is_verified=True
    )

    user3 = User(
        id="user-201",
        organization_id="org-2002",
        email="admin@beta.com",
        hashed_password=hashed_pwd,
        full_name="Bob Beta",
        designation="Director",
        role="company_admin",
        role_id=admin_role.id if admin_role else None,
        status="active",
        is_active=True,
        is_verified=True
    )

    db_session.add_all([user1, user2, user3])
    db_session.commit()

    bu1 = BranchUser(branch_id="branch-101", user_id="user-102")
    db_session.add(bu1)
    db_session.commit()

    return {
        "org1_id": "org-1001",
        "org2_id": "org-2002",
        "branch1_id": "branch-101",
        "branch2_id": "branch-102",
        "branch3_id": "branch-201",
        "user1_id": "user-101",
        "user2_id": "user-102",
        "user3_id": "user-201",
        "admin_role_id": admin_role.id if admin_role else None,
        "staff_role_id": staff_role.id if staff_role else None,
    }
