"""Load Temer Properties pilot inventory from backend/data/temer_production.json."""

from __future__ import annotations

import argparse
import json
import sys
from decimal import Decimal
from pathlib import Path

from sqlalchemy.orm import Session

from app.data.temer_listing_metadata import build_metadata
from app.db.session import SessionLocal
from app.models.identity import User
from app.models.company import Company
from app.models.inventory import Block, Project, PropertyListing, PropertyUnit
from app.scripts.seed_demo_data import (
    _get_company,
    _upsert_block,
    _upsert_company,
    _upsert_listing,
    _upsert_project,
    _upsert_unit,
    _upsert_unit_type,
)

DEFAULT_DATA_PATH = Path(__file__).resolve().parents[2] / "data" / "temer_production.json"


def _load_data(path: Path) -> dict:
    with path.open(encoding="utf-8") as fh:
        return json.load(fh)


def _unit_key(project_slug: str, block_code: str, unit_number: str) -> tuple[str, str, str]:
    return (project_slug, block_code, unit_number)


def seed_from_data(db: Session, data: dict) -> None:
    admin = db.query(User).filter(User.email == "admin@example.com").first()

    company_data = data["company"]
    company = _upsert_company(db, **company_data)

    project_by_slug: dict[str, object] = {}
    block_by_key: dict[tuple[str, str], object] = {}

    for project_data in data["projects"]:
        blocks = project_data.pop("blocks", [])
        project = _upsert_project(
            db,
            company=company,
            slug=project_data["slug"],
            name=project_data["name"],
            city=project_data["city"],
            area=project_data["area"],
        )
        project_by_slug[project.slug] = project
        for block_data in blocks:
            block = _upsert_block(
                db,
                project=project,
                name=block_data["name"],
                code=block_data["code"],
            )
            block.total_floors = block_data.get("total_floors", block.total_floors)
            block_by_key[(project.slug, block.code)] = block

    unit_type_by_code: dict[str, object] = {}
    for ut in data["unit_types"]:
        unit_type = _upsert_unit_type(
            db,
            company=company,
            code=ut["code"],
            name=ut["name"],
            bedrooms=ut.get("bedrooms"),
            category=ut.get("category", "residential"),
            area=Decimal(ut["default_area_sqm"]) if ut.get("default_area_sqm") else None,
        )
        unit_type_by_code[ut["code"]] = unit_type

    unit_by_key: dict[tuple[str, str, str], object] = {}
    for unit_data in data["units"]:
        block = block_by_key[(unit_data["project_slug"], unit_data["block_code"])]
        unit_type = unit_type_by_code[unit_data["unit_type_code"]]
        unit = _upsert_unit(
            db,
            block=block,
            unit_type=unit_type,
            unit_number=unit_data["unit_number"],
            floor_number=unit_data["floor_number"],
            status=unit_data["status"],
            area_sqm=Decimal(unit_data["area_sqm"]),
        )
        unit_by_key[
            _unit_key(
                unit_data["project_slug"],
                unit_data["block_code"],
                unit_data["unit_number"],
            )
        ] = unit

    for listing_data in data["listings"]:
        ref = listing_data["unit_ref"]
        key = _unit_key(ref["project_slug"], ref["block_code"], ref["unit_number"])
        unit = unit_by_key[key]
        property_kind = listing_data.get("property_kind", "residential")
        listing_meta = build_metadata(
            property_kind=property_kind,
            area=listing_data["area"],
            title=listing_data["title"],
            details=listing_data.get("specs"),
            external_property_id=listing_data.get("external_property_id"),
            features=listing_data.get("feature_groups") or listing_data.get("features"),
            map_point=listing_data.get("map"),
        )
        _upsert_listing(
            db,
            unit=unit,
            slug=listing_data["slug"],
            title=listing_data["title"],
            description=listing_data["description"],
            city=listing_data["city"],
            area=listing_data["area"],
            is_public=listing_data.get("is_public", True),
            is_featured=listing_data.get("is_featured", False),
            admin=admin,
            image_urls=listing_data.get("images") or [],
            listing_metadata=listing_meta,
        )

    new_slugs = {listing_data["slug"] for listing_data in data.get("listings", [])}
    if new_slugs:
        stale_rows = (
            db.query(PropertyListing)
            .join(PropertyUnit, PropertyListing.unit_id == PropertyUnit.id)
            .join(Block, PropertyUnit.block_id == Block.id)
            .join(Project, Block.project_id == Project.id)
            .join(Company, Project.company_id == Company.id)
            .filter(
                Company.slug == company.slug,
                PropertyListing.slug.like("temer-%"),
                PropertyListing.slug.notin_(new_slugs),
            )
            .all()
        )
        for row in stale_rows:
            row.is_public = False

    db.commit()

    print("\n=== Temer production seed complete ===\n")
    print(f"Company: {company.name} ({company.slug})")
    print(f"Projects: {', '.join(project_by_slug.keys())}")
    print(f"Public listings: {len(data.get('listings', []))}")
    print("\nPublic URLs:")
    for listing in data.get("listings", []):
        if listing.get("is_public", True):
            print(f"  /listings/{listing['slug']}")
    print("\nFilter: GET /api/v1/public/listings?company_slug=temer-properties")
    print("Edit backend/data/temer_production.json then re-run this script.\n")


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed Temer Properties inventory")
    parser.add_argument(
        "--data",
        type=Path,
        default=DEFAULT_DATA_PATH,
        help="Path to temer_production.json",
    )
    args = parser.parse_args()
    if not args.data.is_file():
        print(f"Data file not found: {args.data}", file=sys.stderr)
        sys.exit(1)

    data = _load_data(args.data)
    db = SessionLocal()
    try:
        existing = _get_company(db, data["company"]["slug"])
        if existing:
            print(f"Updating Temer company: {existing.slug}")
        seed_from_data(db, data)
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
