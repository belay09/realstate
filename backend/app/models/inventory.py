from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin


class Project(Base, TimestampMixin):
    __tablename__ = "projects"
    __table_args__ = (UniqueConstraint("company_id", "slug", name="uq_projects_company_slug"),)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    city: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    area: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    status: Mapped[str] = mapped_column(String(64), default="active", nullable=False)

    company: Mapped["Company"] = relationship("Company", back_populates="projects")
    blocks: Mapped[list[Block]] = relationship(
        "Block",
        back_populates="project",
        cascade="all, delete-orphan",
    )


class Block(Base, TimestampMixin):
    __tablename__ = "blocks"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str | None] = mapped_column(String(64), nullable=True)
    total_floors: Mapped[int | None] = mapped_column(Integer, nullable=True)

    project: Mapped[Project] = relationship("Project", back_populates="blocks")
    units: Mapped[list[PropertyUnit]] = relationship(
        "PropertyUnit",
        back_populates="block",
        cascade="all, delete-orphan",
    )


class UnitType(Base, TimestampMixin):
    __tablename__ = "unit_types"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), index=True
    )
    code: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(64), nullable=False)
    bedrooms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    default_area_sqm: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    finish_type: Mapped[str | None] = mapped_column(String(64), nullable=True)

    company: Mapped["Company"] = relationship("Company", back_populates="unit_types")
    units: Mapped[list[PropertyUnit]] = relationship("PropertyUnit", back_populates="unit_type")


class PropertyUnit(Base, TimestampMixin):
    __tablename__ = "property_units"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    block_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("blocks.id", ondelete="CASCADE"), index=True
    )
    unit_type_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("unit_types.id", ondelete="RESTRICT"), index=True
    )
    unit_number: Mapped[str] = mapped_column(String(64), nullable=False)
    floor_number: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    area_sqm: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    orientation: Mapped[str | None] = mapped_column(String(64), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="draft", nullable=False, index=True)

    block: Mapped[Block] = relationship("Block", back_populates="units")
    unit_type: Mapped[UnitType] = relationship("UnitType", back_populates="units")
    listings: Mapped[list[PropertyListing]] = relationship(
        "PropertyListing",
        back_populates="unit",
        cascade="all, delete-orphan",
    )
    status_history: Mapped[list[UnitStatusHistory]] = relationship(
        "UnitStatusHistory",
        back_populates="unit",
        cascade="all, delete-orphan",
    )


class UnitStatusHistory(Base):
    __tablename__ = "unit_status_history"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    unit_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("property_units.id", ondelete="CASCADE"), index=True
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    from_status: Mapped[str | None] = mapped_column(String(32), nullable=True)
    to_status: Mapped[str] = mapped_column(String(32), nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    unit: Mapped[PropertyUnit] = relationship("PropertyUnit", back_populates="status_history")


class PropertyListing(Base, TimestampMixin):
    __tablename__ = "property_listings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    unit_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("property_units.id", ondelete="CASCADE"), index=True
    )
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    slug: Mapped[str] = mapped_column(String(512), unique=True, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    city: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    area: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_public: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)

    unit: Mapped[PropertyUnit] = relationship("PropertyUnit", back_populates="listings")
    images: Mapped[list[PropertyImage]] = relationship(
        "PropertyImage",
        back_populates="listing",
        cascade="all, delete-orphan",
    )


class PropertyImage(Base):
    __tablename__ = "property_images"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    listing_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("property_listings.id", ondelete="CASCADE"), index=True
    )
    url: Mapped[str] = mapped_column(String(2048), nullable=False)
    public_id: Mapped[str | None] = mapped_column(String(512), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    listing: Mapped[PropertyListing] = relationship("PropertyListing", back_populates="images")


class LocationContent(Base, TimestampMixin):
    __tablename__ = "location_content"
    __table_args__ = (
        UniqueConstraint("kind", "location_id", name="uq_location_content_kind_location"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    kind: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    location_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    subtitle: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    video_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    cards: Mapped[list[dict]] = mapped_column(JSON, nullable=False, default=list)
    is_public: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)

    media: Mapped[list["LocationMedia"]] = relationship(
        "LocationMedia",
        back_populates="location_content",
        cascade="all, delete-orphan",
    )


class LocationMedia(Base):
    __tablename__ = "location_media"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    location_content_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("location_content.id", ondelete="CASCADE"),
        index=True,
    )
    url: Mapped[str] = mapped_column(String(2048), nullable=False)
    media_type: Mapped[str] = mapped_column(String(16), nullable=False, default="image")
    caption: Mapped[str | None] = mapped_column(String(512), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    location_content: Mapped[LocationContent] = relationship(
        "LocationContent",
        back_populates="media",
    )