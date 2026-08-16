import os
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional, List
from fastapi import Header, HTTPException, status, Depends
from pydantic import BaseModel
from jose import jwt, JWTError
from app.core.config import settings


def get_password_hash(password: str) -> str:
    salt = os.urandom(16).hex()
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
    return f"{salt}${key.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        if "$" in hashed_password:
            salt, key_hex = hashed_password.split("$")
            key = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt.encode('utf-8'), 100000)
            return key.hex() == key_hex
        return False
    except Exception:
        return False


def create_access_token(
    subject: str,
    org_id: Optional[str] = None,
    role: str = "staff",
    expires_delta: Optional[timedelta] = None
) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "sub": str(subject),
        "org_id": str(org_id) if org_id is not None else None,
        "role": role,
        "exp": expire
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


class CurrentUser(BaseModel):
    id: str
    organization_id: str
    role: str = "staff"
    email: Optional[str] = None


def get_current_user(
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    x_organization_id: Optional[str] = Header(None, alias="X-Organization-Id"),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    authorization: Optional[str] = Header(None, alias="Authorization")
) -> CurrentUser:
    """
    Extract authenticated user context.
    Supports microservice gateway headers or Bearer JWT token.
    """
    # 1. Gateway header-based user context
    if x_user_id and x_organization_id:
        return CurrentUser(
            id=str(x_user_id),
            organization_id=str(x_organization_id),
            role=str(x_user_role) if x_user_role else "staff"
        )
    
    # 2. Authorization Bearer Token
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "").strip()
        
        # Try JWT decode first
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            user_id: str = payload.get("sub")
            org_id: str = payload.get("org_id")
            role: str = payload.get("role", "staff")
            if user_id and org_id:
                return CurrentUser(id=str(user_id), organization_id=str(org_id), role=str(role))
        except JWTError:
            pass

        # Formatted dev/fallback token: "user_123:org_123:company_admin"
        parts = token.split(":")
        if len(parts) >= 2:
            return CurrentUser(
                id=parts[0],
                organization_id=parts[1],
                role=parts[2] if len(parts) > 2 else "staff"
            )

    # 3. Raise 401 Unauthorized if neither is provided
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Unauthorized: Missing authentication credentials (X-User-Id and X-Organization-Id headers or Authorization Bearer token required)"
    )


def verify_organization_access(
    organization_id: str,
    current_user: CurrentUser = Depends(get_current_user)
) -> CurrentUser:
    """
    Enforces tenant isolation. Users can only access resources belonging to their organization.
    Superadmins can access any organization.
    """
    if current_user.role in ["super_admin", "superadmin"]:
        return current_user
    
    if str(current_user.organization_id) != str(organization_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Forbidden: You do not have permission to access organization '{organization_id}'"
        )

    return current_user


def require_roles(allowed_roles: List[str]):
    def role_checker(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if current_user.role in ["super_admin", "superadmin"]:
            return current_user
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: Operation requires one of the following roles: {allowed_roles}"
            )
        return current_user
    return role_checker
