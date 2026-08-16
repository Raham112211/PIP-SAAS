import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, SessionLocal
from app.core.base import Base

# Import all models so SQLAlchemy declarative registry resolves relationships
from app.core.organization import Organization
from app.core.branch import Branch, BranchUser
from app.Roles_and_Permissions.models import Role, Permission, RolePermission
from app.Staff.models import User

from app.Roles_and_Permissions.repositories import PermissionRepository, RoleRepository
from app.Staff.routes import router as staff_router
from app.Roles_and_Permissions.role_routes import router as role_router
from app.Roles_and_Permissions.permission_routes import router as permission_router
from app.core.ws_routes import router as ws_router


def init_database_schema():
    try:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        try:
            PermissionRepository.seed_default_permissions(db)
            RoleRepository.seed_default_roles(db)
        finally:
            db.close()
    except Exception as e:
        print("Database schema initialization warning:", e)


# Run immediately on module import for Vercel Serverless cold starts
init_database_schema()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_database_schema()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json" if settings.API_V1_STR else "/openapi.json",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers (Both root and /api prefixes to handle local + Vercel serverless routing seamlessly)
app.include_router(staff_router, prefix=settings.API_V1_STR)
app.include_router(role_router, prefix=settings.API_V1_STR)
app.include_router(permission_router, prefix=settings.API_V1_STR)
app.include_router(ws_router)

app.include_router(staff_router, prefix="/api")
app.include_router(role_router, prefix="/api")
app.include_router(permission_router, prefix="/api")


@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
def health_check():
    return {"status": "healthy", "service": settings.PROJECT_NAME}
