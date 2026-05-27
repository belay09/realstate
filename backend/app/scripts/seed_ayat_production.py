"""Load Ayat production inventory and pricing from backend/data/ayat_production.json."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
from pathlib import Path

from sqlalchemy.orm import Session

from app.data.ayat_official_loader import (
    build_commission_block,
    build_pricing_block,
    load_official,
)
from app.db.session import SessionLocal
from app.models.commission import CommissionRule, CommissionScheme
from app.models.company import Company, SalesChannel
from app.models.identity import User
from app.models.inventory import (
    Block,
    LocationContent,
    Project,
    PropertyListing,
    PropertyUnit,
    UnitType,
)
from app.models.payment import PaymentPlan, PaymentPlanStep
from app.models.pricing import DiscountRule, PriceTableRow, PricingDocument, PricingVersion
from app.scripts.seed_demo_data import (
    _get_company,
    _upsert_block,
    _upsert_company,
    _upsert_listing,
    _upsert_project,
    _upsert_unit,
    _upsert_unit_type,
)

DEFAULT_DATA_PATH = Path(__file__).resolve().parents[2] / "data" / "ayat_production.json"
REFERENCE_IMAGE_FILES = [
    "photo_2026-05-12_15-54-55.jpg",
    "photo_2026-05-12_15-59-35.jpg",
    "photo_2026-05-12_15-59-40.jpg",
    "photo_2026-05-12_15-59-45.jpg",
]


def _load_data(path: Path) -> dict:
    with path.open(encoding="utf-8") as fh:
        return json.load(fh)


def _cleanup_orphan_projects(db: Session) -> None:
    orphans = db.query(Project).filter(Project.company_id.is_(None)).all()
    for project in orphans:
        db.delete(project)
    if orphans:
        db.flush()
        print(f"Removed {len(orphans)} orphaned project(s) with null company_id")


def _cleanup_orphan_unit_types(db: Session) -> None:
    orphans = db.query(UnitType).filter(UnitType.company_id.is_(None)).all()
    for row in orphans:
        db.delete(row)
    if orphans:
        db.flush()
        print(f"Removed {len(orphans)} orphaned unit type(s) with null company_id")


def _remove_company_tree(db: Session, company: Company) -> None:
    projects = db.query(Project).filter(Project.company_id == company.id).all()
    for project in projects:
        for block in list(project.blocks):
            for unit in list(block.units):
                for listing in list(unit.listings):
                    db.delete(listing)
                db.delete(unit)
            db.delete(block)
        db.delete(project)

    for unit_type in db.query(UnitType).filter(UnitType.company_id == company.id).all():
        db.delete(unit_type)

    db.flush()
    db.delete(company)


def _remove_companies(db: Session, slugs: list[str]) -> None:
    for slug in slugs:
        company = _get_company(db, slug)
        if not company:
            continue
        _remove_company_tree(db, company)
        db.expire_all()
        print(f"Removed company: {slug}")
    db.flush()


def _archive_pricing_versions(db: Session, company_id, effective_from: date) -> None:
    cutoff = effective_from - timedelta(days=1)
    versions = (
        db.query(PricingVersion)
        .filter(
            PricingVersion.company_id == company_id,
            PricingVersion.status == "published",
            PricingVersion.effective_to.is_(None),
        )
        .all()
    )
    for version in versions:
        if version.effective_from < effective_from:
            version.effective_to = cutoff
            print(f"Archived pricing version: {version.name} (effective_to={cutoff})")


def _unit_key(project_slug: str, block_code: str, unit_number: str) -> tuple[str, str, str]:
    return (project_slug, block_code, unit_number)


def _remove_listings(db: Session, slugs: list[str]) -> None:
    for slug in slugs:
        row = db.query(PropertyListing).filter(PropertyListing.slug == slug).first()
        if row:
            db.delete(row)
            print(f"Removed listing: {slug}")


def seed_from_data(db: Session, data: dict) -> None:
    official = load_official()
    data = {
        **data,
        "pricing": build_pricing_block(official),
        "commission": build_commission_block(official),
    }

    admin = db.query(User).filter(User.email == "admin@example.com").first()

    _cleanup_orphan_projects(db)
    _cleanup_orphan_unit_types(db)

    remove = data.get("remove_companies") or []
    if remove:
        _remove_companies(db, remove)

    remove_listings = data.get("remove_listing_slugs") or []
    if remove_listings:
        _remove_listings(db, remove_listings)

    company_data = data["company"]
    company = _upsert_company(db, **company_data)

    project_by_slug: dict[str, Project] = {}
    block_by_key: dict[tuple[str, str], Block] = {}

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
        unit_type.finish_type = ut.get("finish_type", unit_type.finish_type)
        unit_type_by_code[ut["code"]] = unit_type

    unit_by_key: dict[tuple[str, str, str], PropertyUnit] = {}
    for unit_data in data["units"]:
        project = project_by_slug[unit_data["project_slug"]]
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
        if unit_data.get("orientation"):
            unit.orientation = unit_data["orientation"]
        ukey = _unit_key(
            unit_data["project_slug"],
            unit_data["block_code"],
            unit_data["unit_number"],
        )
        unit_by_key[ukey] = unit

    for listing_data in data["listings"]:
        ref = listing_data["unit_ref"]
        key = _unit_key(ref["project_slug"], ref["block_code"], ref["unit_number"])
        unit = unit_by_key[key]
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
        )

    _seed_pricing(db, company=company, project_by_slug=project_by_slug, pricing=data["pricing"])
    _seed_payment_plans(db, company=company, plans=data.get("payment_plans") or [])
    _seed_commission(db, company=company, commission=data.get("commission") or {})
    _seed_location_content(db, project_by_slug=project_by_slug, official=official)

    db.commit()

    print("\n=== Ayat production seed complete ===\n")
    print(f"Company: {company.name} ({company.slug})")
    print(f"Projects: {', '.join(project_by_slug.keys())}")
    print(f"Public listings: {len(data.get('listings', []))}")
    print(f"Pricing version: {data['pricing']['version_name']}")
    print("Location CMS content: seeded from official Ayat reference")
    print("\nPublic URLs (examples):")
    for listing in data.get("listings", []):
        if listing.get("is_public", True):
            print(f"  /listings/{listing['slug']}")
    print("\nEdit official prices in backend/data/ayat_official_2018.json")
    print("Edit inventory in backend/data/ayat_production.json then re-run this script.\n")


def _seed_pricing(
    db: Session,
    *,
    company: Company,
    project_by_slug: dict[str, Project],
    pricing: dict,
) -> None:
    effective_from = date.fromisoformat(pricing["effective_from"])
    version_name = pricing["version_name"]

    if pricing.get("archive_previous_versions"):
        _archive_pricing_versions(db, company.id, effective_from)

    existing = (
        db.query(PricingVersion)
        .filter(PricingVersion.company_id == company.id, PricingVersion.name == version_name)
        .first()
    )
    if existing is not None:
        print(f"Pricing version already exists: {version_name} — skipping pricing seed")
        return

    doc = PricingDocument(
        company_id=company.id,
        title=pricing["document_title"],
        document_type="price_list",
        storage_url="internal://ayat_production.json",
        ocr_status="manual_entry",
        extracted_text=(
            "Structured entry from backend/data/ayat_production.json. "
            "Verify against official Ayat PDF."
        ),
    )
    db.add(doc)
    db.flush()

    version = PricingVersion(
        company_id=company.id,
        pricing_document_id=doc.id,
        name=version_name,
        status="published",
        effective_from=effective_from,
        effective_to=None,
        currency=pricing.get("currency", "ETB"),
        includes_vat=pricing.get("includes_vat", True),
        published_at=datetime.now(UTC),
    )
    db.add(version)
    db.flush()

    for row in pricing.get("price_rows") or []:
        project_id = None
        if row.get("project_slug"):
            project_id = project_by_slug[row["project_slug"]].id
        db.add(
            PriceTableRow(
                pricing_version_id=version.id,
                project_id=project_id,
                floor_band=row.get("floor_band"),
                unit_type_code=row.get("unit_type_code"),
                finish_type=row.get("finish_type"),
                construction_state=row.get("construction_state"),
                price_per_sqm=Decimal(row["price_per_sqm"]) if row.get("price_per_sqm") else None,
                fixed_price=Decimal(row["fixed_price"]) if row.get("fixed_price") else None,
            )
        )

    for rule in pricing.get("discount_rules") or []:
        db.add(
            DiscountRule(
                pricing_version_id=version.id,
                rule_type=rule["rule_type"],
                priority=rule.get("priority", 0),
                discount_percent=Decimal(rule["discount_percent"]),
                conditions=rule.get("conditions"),
            )
        )


def _seed_payment_plans(db: Session, *, company: Company, plans: list[dict]) -> None:
    for plan_data in plans:
        existing = (
            db.query(PaymentPlan)
            .filter(PaymentPlan.company_id == company.id, PaymentPlan.code == plan_data["code"])
            .first()
        )
        if existing:
            existing.name = plan_data["name"]
            existing.status = plan_data.get("status", "published")
            existing.effective_from = date.fromisoformat(plan_data["effective_from"])
            continue

        plan = PaymentPlan(
            company_id=company.id,
            code=plan_data["code"],
            name=plan_data["name"],
            status=plan_data.get("status", "published"),
            effective_from=date.fromisoformat(plan_data["effective_from"]),
        )
        db.add(plan)
        db.flush()
        for step in plan_data.get("steps") or []:
            db.add(
                PaymentPlanStep(
                    payment_plan_id=plan.id,
                    step_order=step["step_order"],
                    trigger_type=step["trigger_type"],
                    milestone_name=step.get("milestone_name"),
                    due_after_days=step.get("due_after_days"),
                    due_after_months=step.get("due_after_months"),
                    percentage=Decimal(step["percentage"]),
                )
            )


def _seed_commission(db: Session, *, company: Company, commission: dict) -> None:
    if not commission:
        return

    scheme_name = commission["scheme_name"]
    existing_scheme = (
        db.query(CommissionScheme)
        .filter(CommissionScheme.company_id == company.id, CommissionScheme.name == scheme_name)
        .first()
    )
    if existing_scheme:
        print(f"Commission scheme already exists: {scheme_name}")
        return

    scheme = CommissionScheme(
        company_id=company.id,
        name=scheme_name,
        status="published",
        effective_from=date.fromisoformat(commission["effective_from"]),
    )
    db.add(scheme)
    db.flush()

    for rule in commission.get("rules") or []:
        db.add(
            CommissionRule(
                commission_scheme_id=scheme.id,
                sales_channel=rule["sales_channel"],
                commission_percent=Decimal(rule["commission_percent"]),
                conditions=rule.get("conditions"),
            )
        )

    for channel in commission.get("sales_channels") or []:
        if db.query(SalesChannel).filter(
            SalesChannel.company_id == company.id,
            SalesChannel.code == channel["code"],
        ).first():
            continue
        db.add(
            SalesChannel(
                company_id=company.id,
                code=channel["code"],
                name=channel["name"],
                is_active=True,
            )
        )


def _upsert_location_content(
    db: Session,
    *,
    kind: str,
    location_id: str,
    title: str,
    subtitle: str,
    description: str,
    cards: list[dict[str, str | None]],
) -> None:
    row = (
        db.query(LocationContent)
        .filter(LocationContent.kind == kind, LocationContent.location_id == location_id)
        .first()
    )
    payload_cards = [
        {
            "title": c.get("title") or "",
            "body": c.get("body"),
            "image_url": c.get("image_url"),
        }
        for c in cards
    ]
    if row:
        row.title = title
        row.subtitle = subtitle
        row.description = description
        row.cards = payload_cards
        row.is_public = True
        return
    db.add(
        LocationContent(
            kind=kind,
            location_id=location_id,
            title=title,
            subtitle=subtitle,
            description=description,
            cards=payload_cards,
            is_public=True,
        )
    )


def _seed_location_content(db: Session, *, project_by_slug: dict[str, Project], official) -> None:
    pricing_map = official["section10_apartments"]["listing_project_map"]
    locations = official["section10_apartments"]["locations"]
    bedroom_sizes = official["section2_bedroom_sizes_sqm"]
    refs = ", ".join(REFERENCE_IMAGE_FILES)

    for slug, project in project_by_slug.items():
        source_key = pricing_map.get(slug, {}).get("source")
        if not source_key:
            source_key = "cmc-unstarted"
        src = locations.get(source_key) or {}
        cards = [
            {
                "title": "2 bedroom (semi-finished)",
                "body": (
                    f"Sizes {bedroom_sizes['2'][0]}-{bedroom_sizes['2'][1]} m². "
                    f"From {src.get('SFCA', {}).get('3-10', '-'):,} ETB/m² (3-10 floor band)."
                    if src.get("SFCA", {}).get("3-10")
                    else "Sizes and prices follow official Ayat Section 10."
                ),
                "image_url": None,
            },
            {
                "title": "3 bedroom (regular-finished)",
                "body": (
                    f"Sizes {bedroom_sizes['3'][0]}-{bedroom_sizes['3'][-1]} m². "
                    f"From {src.get('RFCR', {}).get('3-10', '-'):,} ETB/m² (3-10 floor band)."
                    if src.get("RFCR", {}).get("3-10")
                    else "Sizes and prices follow official Ayat Section 10."
                ),
                "image_url": None,
            },
            {
                "title": "Official source reference",
                "body": f"Ayat/116/2018 scanned pages used as reference: {refs}",
                "image_url": None,
            },
        ]
        _upsert_location_content(
            db,
            kind="apartment",
            location_id=slug,
            title=project.area or project.name,
            subtitle=project.name,
            description=(
                "Official Ayat apartment location page. Configure video/images "
                "and update cards from admin."
            ),
            cards=cards,
        )

    for zone in official["section11_shops"]["zones"]:
        floor_cards = []
        for floor in ("GF", "1F", "2F", "3F"):
            val = zone["floors"].get(floor)
            if val:
                floor_cards.append(
                    {
                        "title": f"{floor} floor",
                        "body": f"{val:,} ETB per m²",
                        "image_url": None,
                    }
                )
        floor_cards.append(
            {
                "title": "Official source reference",
                "body": f"Ayat/116/2018 scanned pages used as reference: {refs}",
                "image_url": None,
            }
        )
        _upsert_location_content(
            db,
            kind="shop",
            location_id=zone["id"],
            title=zone["label"],
            subtitle="Ayat commercial shops (Section 11)",
            description=(
                "Official shop rates and payment terms. Configure location "
                "media/video from admin dashboard."
            ),
            cards=floor_cards,
        )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Seed Ayat production inventory and pricing from JSON.",
    )
    parser.add_argument(
        "--data",
        type=Path,
        default=DEFAULT_DATA_PATH,
        help=f"Path to JSON data file (default: {DEFAULT_DATA_PATH})",
    )
    args = parser.parse_args()

    if not args.data.is_file():
        print(f"Data file not found: {args.data}", file=sys.stderr)
        sys.exit(1)

    data = _load_data(args.data)
    db = SessionLocal()
    try:
        seed_from_data(db, data)
    except Exception as exc:
        db.rollback()
        print(f"Seed failed: {exc}", file=sys.stderr)
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
