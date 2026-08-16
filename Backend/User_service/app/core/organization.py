import uuid
from typing import List, TYPE_CHECKING
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.core.branch import Branch
    from app.Staff.models import User
    from app.Roles_and_Permissions.models import Role


class Organization(Base, TimestampMixin):
    __tablename__ = "organizations"

    id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="active")

    # Relationships
    branches: Mapped[List["Branch"]] = relationship(
        "Branch",
        back_populates="organization",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    users: Mapped[List["User"]] = relationship(
        "User",
        back_populates="organization",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    roles: Mapped[List["Role"]] = relationship(
        "Role",
        back_populates="organization",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
