import uuid
from typing import Any, TYPE_CHECKING
from sqlalchemy import String, ForeignKey, UniqueConstraint, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.organization import Organization


class OrganizationSetting(Base, TimestampMixin):
    __tablename__ = "organization_settings"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    organization_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    key: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True
    )
    value: Mapped[Any] = mapped_column(
        JSON,
        nullable=True
    )

    # Relationships
    organization: Mapped["Organization"] = relationship(
        "Organization",
        back_populates="settings"
    )

    __table_args__ = (
        UniqueConstraint("organization_id", "key", name="uq_org_setting_key"),
    )
