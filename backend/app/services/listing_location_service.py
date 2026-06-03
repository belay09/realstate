"""Assign property listings to apartment or shop location pages."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy.orm import Session

from app.models.inventory import Block, LocationContent, Project, PropertyListing, PropertyUnit

SHOP_PROJECT_PREFIX = "shop-"


class ListingLocationError(Exception):
    def __init__(self, code: str, message: str) -> None:
        self.code = code
        self.message = message
        super().__init__(message)


def shop_project_slug(location_id: str) -> str:
    return f"{SHOP_PROJECT_PREFIX}{location_id}"


def infer_listing_location(
    listing: PropertyListing,
    *,
    project: Project,
) -> tuple[str, str]:
    meta = listing.listing_metadata or {}
    kind = meta.get("location_kind")
    if kind not in ("apartment", "shop"):
        kind = "shop" if meta.get("property_kind") == "commercial" else "apartment"

    location_id = meta.get("location_id")
    if isinstance(location_id, str) and location_id.strip():
        return kind, location_id.strip()

    if kind == "shop" and project.slug.startswith(SHOP_PROJECT_PREFIX):
        return kind, project.slug.removeprefix(SHOP_PROJECT_PREFIX)
    return kind, project.slug


def _default_block(db: Session, project: Project) -> Block:
    block = db.query(Block).filter(Block.project_id == project.id).order_by(Block.code).first()
    if block is not None:
        return block
    block = Block(
        project_id=project.id,
        name="Default",
        code="DEF",
        total_floors=1,
    )
    db.add(block)
    db.flush()
    return block


def _move_unit_to_project(db: Session, unit: PropertyUnit, target_project: Project) -> None:
    block = _default_block(db, target_project)
    unit.block_id = block.id


def _get_or_create_apartment_project(
    db: Session,
    *,
    company_id: UUID,
    location_id: str,
    location_content: LocationContent,
) -> Project:
    project = (
        db.query(Project)
        .filter(Project.company_id == company_id, Project.slug == location_id)
        .first()
    )
    if project is not None:
        return project
    project = Project(
        company_id=company_id,
        slug=location_id,
        name=location_content.title.strip() or location_id,
        city="Addis Ababa",
        area=location_content.subtitle or location_content.title or location_id,
        status="active",
    )
    db.add(project)
    db.flush()
    return project


def _get_or_create_shop_project(
    db: Session,
    *,
    company_id: UUID,
    location_id: str,
    location_content: LocationContent,
) -> Project:
    slug = shop_project_slug(location_id)
    project = (
        db.query(Project)
        .filter(Project.company_id == company_id, Project.slug == slug)
        .first()
    )
    if project is not None:
        return project
    project = Project(
        company_id=company_id,
        slug=slug,
        name=location_content.title,
        city="Addis Ababa",
        area=location_content.title,
        status="active",
    )
    db.add(project)
    db.flush()
    return project


def reassign_listing_location(
    db: Session,
    listing: PropertyListing,
    *,
    location_kind: str,
    location_id: str,
) -> None:
    location_kind = location_kind.strip().lower()
    location_id = location_id.strip()
    if location_kind not in ("apartment", "shop"):
        raise ListingLocationError("INVALID_KIND", "location_kind must be apartment or shop")
    if not location_id:
        raise ListingLocationError("INVALID_LOCATION", "location_id is required")

    location_content = (
        db.query(LocationContent)
        .filter(
            LocationContent.kind == location_kind,
            LocationContent.location_id == location_id,
        )
        .first()
    )
    if location_content is None:
        raise ListingLocationError(
            "LOCATION_NOT_FOUND",
            (
                f"No {location_kind} location page with id “{location_id}”. "
                "Add it under Location pages first."
            ),
        )

    unit = listing.unit
    if unit is None:
        raise ListingLocationError("NO_UNIT", "Listing has no inventory unit")
    source_project = unit.block.project
    company_id = source_project.company_id

    meta = dict(listing.listing_metadata or {})
    meta["location_kind"] = location_kind
    meta["location_id"] = location_id
    meta["property_kind"] = "commercial" if location_kind == "shop" else "residential"
    listing.listing_metadata = meta

    if location_kind == "apartment":
        target = _get_or_create_apartment_project(
            db,
            company_id=company_id,
            location_id=location_id,
            location_content=location_content,
        )
        _move_unit_to_project(db, unit, target)
        listing.city = target.city or listing.city
        listing.area = target.area or location_content.title
    else:
        target = _get_or_create_shop_project(
            db,
            company_id=company_id,
            location_id=location_id,
            location_content=location_content,
        )
        _move_unit_to_project(db, unit, target)
        listing.city = listing.city or "Addis Ababa"
        listing.area = location_content.title
