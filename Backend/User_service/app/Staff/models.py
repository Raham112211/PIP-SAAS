import uuid
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import String, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.core.organization import Organization
    from app.core.branch import BranchUser
    from app.Roles_and_Permissions.models import Role


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    organization_id: Mapped[Optional[str]] = mapped_column(
        String(64),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    designation: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Role attributes (both role string code and role_id link to dynamic Role)
    role: Mapped[str] = mapped_column(String(50), default="staff", nullable=False)
    role_id: Mapped[Optional[str]] = mapped_column(
        String(64),
        ForeignKey("roles.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    # Status attributes
    status: Mapped[str] = mapped_column(String(50), default="active", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    organization: Mapped[Optional["Organization"]] = relationship("Organization", back_populates="users")
    branch_users: Mapped[List["BranchUser"]] = relationship(
        "BranchUser",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    role_obj: Mapped[Optional["Role"]] = relationship("Role", back_populates="users")
