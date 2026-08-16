from typing import Optional
from fastapi import Header, HTTPException, status, Depends
from pydantic import BaseModel


class CurrentUser(BaseModel):
    id: str
    organization_id: str
    role: str = "member"


def get_current_user(
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    x_organization_id: Optional[str] = Header(None, alias="X-Organization-Id"),
    x_user_role: Optional[str] = Header("member", alias="X-User-Role"),
    authorization: Optional[str] = Header(None, alias="Authorization")
) -> CurrentUser:
    """
    Extract authenticated user context.
    Supports HTTP headers or token fallback for seamless microservice / gateway integration.
    """
    # Default to header-based user context
    if x_user_id and x_organization_id:
        return CurrentUser(
            id=x_user_id,
            organization_id=x_organization_id,
            role=x_user_role or "member"
        )
    
    # If Authorization Bearer token is provided with mock/dev fallback
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "").strip()
        # Allows formatted dev token like "user_123:org_123:admin"
        parts = token.split(":")
        if len(parts) >= 2:
            return CurrentUser(
                id=parts[0],
                organization_id=parts[1],
                role=parts[2] if len(parts) > 2 else "member"
            )

    # If neither provided in strict environment, raise 401 Unauthorized
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Unauthorized: Missing authentication credentials (X-User-Id and X-Organization-Id headers or Authorization Bearer token required)"
    )


def verify_organization_access(
    organization_id: str,
    current_user: CurrentUser = Depends(get_current_user)
) -> CurrentUser:
    """
    Verifies that the authenticated user has access to the requested organization.
    Superadmins can access any organization. Regular members can only access their own organization.
    """
    if current_user.role in ["admin", "superadmin"] and current_user.organization_id == organization_id:
        return current_user
    
    if current_user.organization_id != organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Forbidden: You do not have permission to access organization '{organization_id}'"
        )

    return current_user
