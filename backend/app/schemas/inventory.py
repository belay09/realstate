from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class Paginated[T](BaseModel):
    items: list[T]
    total: int


# --- Company ---


class CompanyCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    slug: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=64)
    website: str | None = Field(default=None, max_length=512)
    logo_url: str | None = Field(default=None, max_length=1024)
    description: str | None = None
    is_active: bool = True


class CompanyUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    slug: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=64)
    website: str | None = Field(default=None, max_length=512)
    logo_url: str | None = Field(default=None, max_length=1024)
    description: str | None = None
    is_active: bool | None = None


class CompanyRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    slug: str
    phone: str | None
    website: str | None
    logo_url: str | None
    description: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


# --- Project ---


class ProjectCreate(BaseModel):
    company_id: UUID
    name: str = Field(min_length=1, max_length=255)
    slug: str | None = Field(default=None, max_length=255)
    city: str | None = Field(default=None, max_length=128)
    area: str | None = Field(default=None, max_length=128)
    status: str = Field(default="active", max_length=64)


class ProjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    slug: str | None = Field(default=None, max_length=255)
    city: str | None = Field(default=None, max_length=128)
    area: str | None = Field(default=None, max_length=128)
    status: str | None = Field(default=None, max_length=64)


class ProjectRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    company_id: UUID
    name: str
    slug: str
    city: str | None
    area: str | None
    status: str
    created_at: datetime
    updated_at: datetime


# --- Block ---


class BlockCreate(BaseModel):
    project_id: UUID
    name: str = Field(min_length=1, max_length=255)
    code: str | None = Field(default=None, max_length=64)
    total_floors: int | None = Field(default=None, ge=0)


class BlockUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    code: str | None = Field(default=None, max_length=64)
    total_floors: int | None = Field(default=None, ge=0)


class BlockRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    name: str
    code: str | None
    total_floors: int | None
    created_at: datetime
    updated_at: datetime


# --- Unit type ---


class UnitTypeCreate(BaseModel):
    company_id: UUID
    code: str = Field(min_length=1, max_length=64)
    name: str = Field(min_length=1, max_length=255)
    category: str = Field(min_length=1, max_length=64)
    bedrooms: int | None = Field(default=None, ge=0)
    default_area_sqm: Decimal | None = None
    finish_type: str | None = Field(default=None, max_length=64)


class UnitTypeUpdate(BaseModel):
    code: str | None = Field(default=None, min_length=1, max_length=64)
    name: str | None = Field(default=None, min_length=1, max_length=255)
    category: str | None = Field(default=None, min_length=1, max_length=64)
    bedrooms: int | None = Field(default=None, ge=0)
    default_area_sqm: Decimal | None = None
    finish_type: str | None = Field(default=None, max_length=64)


class UnitTypeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    company_id: UUID
    code: str
    name: str
    category: str
    bedrooms: int | None
    default_area_sqm: Decimal | None
    finish_type: str | None
    created_at: datetime
    updated_at: datetime


# --- Property unit ---


class PropertyUnitCreate(BaseModel):
    block_id: UUID
    unit_type_id: UUID
    unit_number: str = Field(min_length=1, max_length=64)
    floor_number: int | None = None
    area_sqm: Decimal | None = None
    orientation: str | None = Field(default=None, max_length=64)
    status: str = Field(default="draft", max_length=32)


class PropertyUnitUpdate(BaseModel):
    unit_number: str | None = Field(default=None, min_length=1, max_length=64)
    floor_number: int | None = None
    area_sqm: Decimal | None = None
    orientation: str | None = Field(default=None, max_length=64)
    status: str | None = Field(default=None, max_length=32)
    unit_type_id: UUID | None = None


class PropertyUnitRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    block_id: UUID
    unit_type_id: UUID
    unit_number: str
    floor_number: int | None
    area_sqm: Decimal | None
    orientation: str | None
    status: str
    created_at: datetime
    updated_at: datetime


class UnitStatusChange(BaseModel):
    to_status: str = Field(min_length=1, max_length=32)
    note: str | None = None


# --- Listing ---


class PropertyListingCreate(BaseModel):
    unit_id: UUID
    title: str = Field(min_length=1, max_length=512)
    slug: str | None = Field(default=None, max_length=512)
    description: str | None = None
    city: str | None = Field(default=None, max_length=128)
    area: str | None = Field(default=None, max_length=128)
    is_featured: bool = False
    is_public: bool = False


class PropertyListingUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=512)
    slug: str | None = Field(default=None, max_length=512)
    description: str | None = None
    city: str | None = Field(default=None, max_length=128)
    area: str | None = Field(default=None, max_length=128)
    is_featured: bool | None = None
    is_public: bool | None = None


class PropertyListingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    unit_id: UUID
    created_by_id: UUID | None
    title: str
    slug: str
    description: str | None
    city: str | None
    area: str | None
    is_featured: bool
    is_public: bool
    created_at: datetime
    updated_at: datetime


class PropertyImageCreate(BaseModel):
    url: str = Field(min_length=1, max_length=2048)
    sort_order: int = 0
    is_primary: bool = False
    public_id: str | None = Field(default=None, max_length=512)


class PropertyImageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    listing_id: UUID
    url: str
    public_id: str | None
    sort_order: int
    is_primary: bool
    created_at: datetime


# --- Location content (admin + public) ---


class LocationMediaCreate(BaseModel):
    url: str = Field(min_length=1, max_length=2048)
    media_type: str = Field(default="image", pattern="^(image|video)$")
    caption: str | None = Field(default=None, max_length=512)
    sort_order: int = 0
    is_primary: bool = False


class LocationMediaRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    location_content_id: UUID
    url: str
    media_type: str
    caption: str | None
    sort_order: int
    is_primary: bool
    created_at: datetime


class LocationCard(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    body: str | None = None
    image_url: str | None = Field(default=None, max_length=2048)


class LocationContentCreate(BaseModel):
    kind: str = Field(pattern="^(apartment|shop)$")
    location_id: str = Field(min_length=1, max_length=255)
    title: str = Field(min_length=1, max_length=255)
    subtitle: str | None = Field(default=None, max_length=255)
    description: str | None = None
    video_url: str | None = Field(default=None, max_length=2048)
    cards: list[LocationCard] = []
    is_public: bool = True


class LocationContentUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    subtitle: str | None = Field(default=None, max_length=255)
    description: str | None = None
    video_url: str | None = Field(default=None, max_length=2048)
    cards: list[LocationCard] | None = None
    is_public: bool | None = None


class LocationContentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    kind: str
    location_id: str
    title: str
    subtitle: str | None
    description: str | None
    video_url: str | None
    cards: list[LocationCard]
    is_public: bool
    created_at: datetime
    updated_at: datetime


class HomePageCardUpsert(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str = Field(default="", max_length=4000)
    tag: str | None = Field(default=None, max_length=64)
    image_url: str | None = Field(default=None, max_length=2048)
    to_path: str = Field(default="/", max_length=255)
    sort_order: int = 0
    is_active: bool = True


class HomePageCardRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    card_key: str
    title: str
    description: str
    tag: str | None
    image_url: str | None
    to_path: str
    sort_order: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


# --- Public ---


class PublicListingImage(BaseModel):
    url: str
    sort_order: int
    is_primary: bool


class PublicListingSummary(BaseModel):
    id: UUID
    title: str
    slug: str
    city: str | None
    area: str | None
    bedrooms: int | None
    unit_type_code: str
    unit_type_name: str
    company_name: str
    company_slug: str
    project_name: str
    project_slug: str
    primary_image_url: str | None


class PublicListingDetail(PublicListingSummary):
    description: str | None
    images: list[PublicListingImage]
    unit_number: str
    floor_number: int | None
    area_sqm: Decimal | None
    unit_status: str


class PublicFilterOption(BaseModel):
    value: str
    label: str


class PublicListingFilterOptions(BaseModel):
    areas: list[PublicFilterOption]
    cities: list[PublicFilterOption]
    bedrooms: list[PublicFilterOption]
    companies: list[PublicFilterOption]
    unit_types: list[PublicFilterOption]


class PublicLocationContent(BaseModel):
    kind: str
    location_id: str
    title: str | None
    subtitle: str | None
    description: str | None
    video_url: str | None
    cards: list[LocationCard]
    media: list[dict[str, object]]


class PublicHomeCard(BaseModel):
    card_key: str
    title: str
    description: str
    tag: str | None
    image_url: str | None
    to_path: str
    sort_order: int
