import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.core.database import get_db
from app.models.base import Base
from app.models.organization import Organization
from app.models.organization_setting import OrganizationSetting
from app.main import app

# In-memory SQLite with StaticPool ensures the same connection/memory DB is shared
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Create fresh database tables for each test."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
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
    """Seed initial organizations and sample settings."""
    org1 = Organization(id="org-1001", name="Acme Corporation")
    org2 = Organization(id="org-2002", name="Beta Innovations")
    db_session.add_all([org1, org2])
    db_session.commit()

    setting1 = OrganizationSetting(
        organization_id="org-1001",
        key="timezone",
        value="Asia/Karachi"
    )
    setting2 = OrganizationSetting(
        organization_id="org-1001",
        key="currency",
        value="PKR"
    )
    db_session.add_all([setting1, setting2])
    db_session.commit()

    return {
        "org1_id": "org-1001",
        "org2_id": "org-2002",
    }
