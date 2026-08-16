"""
Migration: Add Organization Settings Table
Revision ID: add_organization_settings
"""

from sqlalchemy import (
    Table,
    Column,
    String,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    JSON,
    MetaData,
    Index
)
from datetime import datetime, timezone

metadata = MetaData()

organization_settings_table = Table(
    "organization_settings",
    metadata,
    Column("id", String(36), primary_key=True),
    Column("organization_id", String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True),
    Column("key", String(100), nullable=False, index=True),
    Column("value", JSON, nullable=True),
    Column("created_at", DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False),
    Column("updated_at", DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False),
    UniqueConstraint("organization_id", "key", name="uq_org_setting_key")
)


def upgrade(bind):
    """Run migration upgrade."""
    organization_settings_table.create(bind=bind, checkfirst=True)


def downgrade(bind):
    """Run migration rollback."""
    organization_settings_table.drop(bind=bind, checkfirst=True)
