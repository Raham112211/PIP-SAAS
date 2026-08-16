import uuid
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.core.organization import Organization
    from app.Staff.models import User


class Branch(Base, TimestampMixin):
    __tablename__ = "branches"

    id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    organization_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(100), nullable=False)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", back_populates="branches")
    branch_users: Mapped[List["BranchUser"]] = relationship(
        "BranchUser",
        back_populates="branch",
        cascade="all, delete-orphan",
        lazy="selectin"
    )


class BranchUser(Base, TimestampMixin):
    __tablename__ = "branch_users"

    id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    branch_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("branches.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Relationships
    branch: Mapped["Branch"] = relationship("Branch", back_populates="branch_users")
    user: Mapped["User"] = relationship("User", back_populates="branch_users")
