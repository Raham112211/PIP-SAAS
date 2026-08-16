import uuid
from typing import List, TYPE_CHECKING
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.organization_setting import OrganizationSetting


class Organization(Base, TimestampMixin):
    __tablename__ = "organizations"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    # Relationships
    settings: Mapped[List["OrganizationSetting"]] = relationship(
        "OrganizationSetting",
        back_populates="organization",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
