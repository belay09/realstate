"""Seed demo inventory and public listings for UI and API smoke testing."""

from __future__ import annotations

import argparse
import sys
from datetime import UTC, date, datetime
from decimal import Decimal

from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.commission import CommissionRule, CommissionScheme
from app.data.listing_card_image import order_images_for_card, SalesChannel
from app.models.identity import User
from app.models.inventory import (
    Block,
    Project,
    PropertyImage,
    PropertyListing,
    PropertyUnit,
    UnitType,
)
from app.models.payment import PaymentPlan, PaymentPlanStep
from app.models.pricing import DiscountRule, PriceTableRow, PricingDocument, PricingVersion

DEMO_COMPANY_SLUGS = ("ayat-real-estate", "sunshine-developers")

# Placeholder images (stable URLs for gallery testing)
IMG_APARTMENT = "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80"
IMG_LIVING = "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80"
IMG_BUILDING = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80"


def _get_company(db: Session, slug: str) -> Company | None:
    return db.query(Company).filter(Company.slug == slug).first()


def _reset_demo(db: Session) -> None:
    for slug in DEMO_COMPANY_SLUGS:
        company = _get_company(db, slug)
        if company:
            db.delete(company)
    db.commit()
    print("Removed demo companies (cascade deletes related inventory).")


def _upsert_company(
    db: Session,
    *,
    slug: str,
    name: str,
    phone: str | None = None,
    website: str | None = None,
    description: str | None = None,
) -> Company:
    row = _get_company(db, slug)
    if row is None:
        row = Company(
            slug=slug,
            name=name,
            phone=phone,
            website=website,
            description=description,
            is_active=True,
        )
        db.add(row)
        db.flush()
    else:
        row.name = name
        row.phone = phone
        row.website = website
        row.description = description
        row.is_active = True
    return row


def _upsert_project(
    db: Session,
    *,
    company: Company,
    slug: str,
    name: str,
    city: str,
    area: str,
) -> Project:
    row = (
        db.query(Project)
        .filter(Project.company_id == company.id, Project.slug == slug)
        .first()
    )
    if row is None:
        row = Project(
            company_id=company.id,
            slug=slug,
            name=name,
            city=city,
            area=area,
            status="active",
        )
        db.add(row)
        db.flush()
    else:
        row.name = name
        row.city = city
        row.area = area
        row.status = "active"
    return row


def _upsert_block(db: Session, *, project: Project, name: str, code: str) -> Block:
    row = (
        db.query(Block)
        .filter(Block.project_id == project.id, Block.code == code)
        .first()
    )
    if row is None:
        row = Block(project_id=project.id, name=name, code=code, total_floors=12)
        db.add(row)
        db.flush()
    else:
        row.name = name
        row.total_floors = 12
    return row


def _upsert_unit_type(
    db: Session,
    *,
    company: Company,
    code: str,
    name: str,
    bedrooms: int | None,
    category: str = "residential",
    area: Decimal | None = None,
) -> UnitType:
    row = (
        db.query(UnitType)
        .filter(UnitType.company_id == company.id, UnitType.code == code)
        .first()
    )
    if row is None:
        row = UnitType(
            company_id=company.id,
            code=code,
            name=name,
            category=category,
            bedrooms=bedrooms,
            default_area_sqm=area,
            finish_type="semi-finished",
        )
        db.add(row)
        db.flush()
    else:
        row.name = name
        row.bedrooms = bedrooms
        row.default_area_sqm = area
    return row


def _upsert_unit(
    db: Session,
    *,
    block: Block,
    unit_type: UnitType,
    unit_number: str,
    floor_number: int,
    status: str,
    area_sqm: Decimal,
) -> PropertyUnit:
    row = (
        db.query(PropertyUnit)
        .filter(PropertyUnit.block_id == block.id, PropertyUnit.unit_number == unit_number)
        .first()
    )
    if row is None:
        row = PropertyUnit(
            block_id=block.id,
            unit_type_id=unit_type.id,
            unit_number=unit_number,
            floor_number=floor_number,
            area_sqm=area_sqm,
            orientation="east",
            status=status,
        )
        db.add(row)
        db.flush()
    else:
        row.unit_type_id = unit_type.id
        row.floor_number = floor_number
        row.area_sqm = area_sqm
        row.status = status
    return row


def _upsert_listing(
    db: Session,
    *,
    unit: PropertyUnit,
    slug: str,
    title: str,
    description: str,
    city: str,
    area: str,
    is_public: bool,
    is_featured: bool,
    admin: User | None,
    image_urls: list[str],
    listing_metadata: dict | None = None,
) -> PropertyListing:
    row = db.query(PropertyListing).filter(PropertyListing.slug == slug).first()
    if row is None:
        row = PropertyListing(
            unit_id=unit.id,
            created_by_id=admin.id if admin else None,
            title=title,
            slug=slug,
            description=description,
            city=city,
            area=area,
            is_public=is_public,
            is_featured=is_featured,
        )
        db.add(row)
        db.flush()
    else:
        row.unit_id = unit.id
        row.title = title
        row.description = description
        row.city = city
        row.area = area
        row.is_public = is_public
        row.is_featured = is_featured
    row.listing_metadata = listing_metadata

    if image_urls:
        existing = {img.url for img in row.images}
        ordered = order_images_for_card(image_urls)
        for i, url in enumerate(ordered):
            if url in existing:
                continue
            db.add(
                PropertyImage(
                    listing_id=row.id,
                    url=url,
                    sort_order=i,
                    is_primary=(i == 0),
                )
            )
    return row


def seed(db: Session) -> None:
    admin = db.query(User).filter(User.email == "admin@example.com").first()

    ayat = _upsert_company(
        db,
        slug="ayat-real-estate",
        name="Ayat Real Estate",
        phone="+251111234567",
        website="https://example.com/ayat",
        description="Demo seed — Ayat-style inventory for Belay Properties UI testing.",
    )
    sunshine = _upsert_company(
        db,
        slug="sunshine-developers",
        name="Sunshine Developers",
        phone="+251911000000",
        description="Second demo company for company_slug filters on the public site.",
    )

    ayat_hills = _upsert_project(
        db,
        company=ayat,
        slug="ayat-hills",
        name="Ayat Hills",
        city="Addis Ababa",
        area="Ayat",
    )
    ayat_cmc = _upsert_project(
        db,
        company=ayat,
        slug="cmc-extension",
        name="CMC Extension",
        city="Addis Ababa",
        area="CMC",
    )
    sunshine_lebu = _upsert_project(
        db,
        company=sunshine,
        slug="lebu-heights",
        name="Lebu Heights",
        city="Addis Ababa",
        area="Lebu",
    )

    block_a = _upsert_block(db, project=ayat_hills, name="Block A", code="A")
    block_b = _upsert_block(db, project=ayat_hills, name="Block B", code="B")
    block_cmc = _upsert_block(db, project=ayat_cmc, name="Tower 1", code="T1")
    block_lebu = _upsert_block(db, project=sunshine_lebu, name="Phase 1", code="P1")

    t2 = _upsert_unit_type(
        db, company=ayat, code="T2", name="Two bedroom", bedrooms=2, area=Decimal("85.5")
    )
    t3 = _upsert_unit_type(
        db, company=ayat, code="T3", name="Three bedroom", bedrooms=3, area=Decimal("110.0")
    )
    studio = _upsert_unit_type(
        db,
        company=sunshine,
        code="ST1",
        name="Studio",
        bedrooms=1,
        area=Decimal("45.0"),
    )

    # --- Units ---
    u_501 = _upsert_unit(
        db,
        block=block_a,
        unit_type=t3,
        unit_number="501",
        floor_number=5,
        status="available",
        area_sqm=Decimal("112.5"),
    )
    u_302 = _upsert_unit(
        db,
        block=block_b,
        unit_type=t2,
        unit_number="302",
        floor_number=3,
        status="available",
        area_sqm=Decimal("86.0"),
    )
    u_cmc_201 = _upsert_unit(
        db,
        block=block_cmc,
        unit_type=t2,
        unit_number="201",
        floor_number=2,
        status="available",
        area_sqm=Decimal("88.0"),
    )
    u_sold = _upsert_unit(
        db,
        block=block_a,
        unit_type=t3,
        unit_number="1201",
        floor_number=12,
        status="sold",
        area_sqm=Decimal("115.0"),
    )
    u_draft = _upsert_unit(
        db,
        block=block_b,
        unit_type=t2,
        unit_number="105",
        floor_number=1,
        status="draft",
        area_sqm=Decimal("84.0"),
    )
    u_lebu = _upsert_unit(
        db,
        block=block_lebu,
        unit_type=studio,
        unit_number="12",
        floor_number=4,
        status="available",
        area_sqm=Decimal("46.5"),
    )

    # --- Listings ---
    listings_public = [
        (
            u_501,
            "ayat-hills-3br-floor-5",
            "Spacious 3BR at Ayat Hills — Block A, Floor 5",
            "Corner unit, east orientation. Demo for public detail and filters (3 bed, Ayat).",
            True,
            True,
            [IMG_APARTMENT, IMG_LIVING],
        ),
        (
            u_302,
            "ayat-hills-2br-block-b",
            "2BR apartment — Ayat Hills Block B",
            "Mid-floor two bedroom. Filter by bedrooms=2 or area=Ayat.",
            True,
            False,
            [IMG_LIVING],
        ),
        (
            u_cmc_201,
            "cmc-extension-2br-floor-2",
            "2BR at CMC Extension — Tower 1",
            "CMC area demo. Try public filter area=CMC.",
            True,
            False,
            [IMG_BUILDING, IMG_APARTMENT],
        ),
        (
            u_lebu,
            "lebu-heights-studio",
            "Studio at Lebu Heights — Sunshine Developers",
            "Second company on the platform. Filter company_slug=sunshine-developers.",
            True,
            True,
            [IMG_APARTMENT],
        ),
    ]
    for unit, slug, title, desc, is_pub, featured, imgs in listings_public:
        _upsert_listing(
            db,
            unit=unit,
            slug=slug,
            title=title,
            description=desc,
            city="Addis Ababa",
            area=unit.block.project.area or "Addis Ababa",
            is_public=is_pub,
            is_featured=featured,
            admin=admin,
            image_urls=imgs,
        )

    # Sold unit: listing public but hidden from public API (tests availability rule)
    _upsert_listing(
        db,
        unit=u_sold,
        slug="ayat-hills-3br-sold-sample",
        title="3BR Penthouse — SOLD (should not appear on public site)",
        description="Unit status is sold; public list/detail should 404 even if is_public is true.",
        city="Addis Ababa",
        area="Ayat",
        is_public=True,
        is_featured=False,
        admin=admin,
        image_urls=[],
    )

    # Draft unit: private listing (admin only)
    _upsert_listing(
        db,
        unit=u_draft,
        slug="ayat-hills-draft-internal",
        title="Draft unit — not on public site",
        description="is_public=false for admin listings table testing.",
        city="Addis Ababa",
        area="Ayat",
        is_public=False,
        is_featured=False,
        admin=admin,
        image_urls=[],
    )

    _seed_demo_pricing(
        db,
        ayat=ayat,
        ayat_hills=ayat_hills,
        block_a=block_a,
        block_b=block_b,
        block_cmc=block_cmc,
        t2=t2,
        t3=t3,
    )
    _seed_demo_payment_and_commission(db, ayat=ayat)

    db.commit()

    print("\n=== Demo seed complete ===\n")
    print("Companies:")
    print(f"  - {ayat.name}  slug={ayat.slug}  id={ayat.id}")
    print(f"  - {sunshine.name}  slug={sunshine.slug}  id={sunshine.id}")
    print("\nPublic listing slugs (browse at /listings/<slug>):")
    for _, slug, *_rest in listings_public:
        print(f"  - {slug}")
    print("  - (hidden) ayat-hills-3br-sold-sample — sold unit, not on public API")
    print("\nFilter hints (public /listings):")
    print("  city=Addis  area=Ayat  bedrooms=3  company_slug=ayat-real-estate  unit_type_code=T3")
    print("  company_slug=sunshine-developers  area=Lebu  bedrooms=1")
    print("\nAdmin UI deep links (after login):")
    print(f"  /admin/projects?company_id={ayat.id}")
    print(f"  /admin/blocks?project_id={ayat_hills.id}")
    print(f"  /admin/units?block_id={block_a.id}")
    print(f"  /admin/unit-types?company_id={ayat.id}")
    print("\nAdmin login: admin@example.com (create with create_admin if missing)")
    print("\nPricing: published version 'Ayat demo pricing 2024' on ayat-real-estate")
    print("  POST /api/v1/admin/quotes/generate with unit_id + payment_plan_id")
    print("  POST /api/v1/public/leads to submit a lead from a listing slug\n")


def _seed_demo_payment_and_commission(db: Session, *, ayat: Company) -> None:
    if (
        db.query(PaymentPlan)
        .filter(PaymentPlan.company_id == ayat.id, PaymentPlan.code == "full")
        .first()
    ):
        return

    full = PaymentPlan(
        company_id=ayat.id,
        code="full",
        name="Full payment",
        status="published",
        effective_from=date(2024, 1, 1),
    )
    db.add(full)
    db.flush()
    db.add(
        PaymentPlanStep(
            payment_plan_id=full.id,
            step_order=1,
            trigger_type="on_signing",
            milestone_name="Full payment",
            percentage=Decimal("100"),
        )
    )

    sixty = PaymentPlan(
        company_id=ayat.id,
        code="60_40",
        name="60/40 plan (residential)",
        status="published",
        effective_from=date(2024, 1, 1),
    )
    db.add(sixty)
    db.flush()
    db.add_all(
        [
            PaymentPlanStep(
                payment_plan_id=sixty.id,
                step_order=1,
                trigger_type="down_payment",
                milestone_name="40% down payment",
                due_after_days=30,
                percentage=Decimal("40"),
            ),
            PaymentPlanStep(
                payment_plan_id=sixty.id,
                step_order=2,
                trigger_type="on_completion",
                milestone_name="60% on handover",
                due_after_months=18,
                percentage=Decimal("60"),
            ),
        ]
    )

    scheme = CommissionScheme(
        company_id=ayat.id,
        name="Ayat agent commission 2024",
        status="published",
        effective_from=date(2024, 1, 1),
    )
    db.add(scheme)
    db.flush()
    db.add(
        CommissionRule(
            commission_scheme_id=scheme.id,
            sales_channel="default",
            commission_percent=Decimal("3"),
            conditions={"payment_plan_codes": ["full", "60_40"]},
        )
    )
    db.add(
        CommissionRule(
            commission_scheme_id=scheme.id,
            sales_channel="agent",
            commission_percent=Decimal("4"),
        )
    )

    if not db.query(SalesChannel).filter(SalesChannel.company_id == ayat.id).first():
        db.add(
            SalesChannel(
                company_id=ayat.id,
                code="agent",
                name="Sales agent",
                is_active=True,
            )
        )


def _seed_demo_pricing(
    db: Session,
    *,
    ayat: Company,
    ayat_hills: Project,
    block_a: Block,
    block_b: Block,
    block_cmc: Block,
    t2: UnitType,
    t3: UnitType,
) -> None:
    version_name = "Ayat demo pricing 2024"
    existing = (
        db.query(PricingVersion)
        .filter(PricingVersion.company_id == ayat.id, PricingVersion.name == version_name)
        .first()
    )
    if existing is not None:
        return

    doc = PricingDocument(
        company_id=ayat.id,
        title="Ayat price list (demo PDF placeholder)",
        document_type="price_list",
        storage_url="https://example.com/demo/ayat-price-list.pdf",
        ocr_status="skipped",
        extracted_text="Demo document for UI testing — replace with real Ayat OCR text later.",
    )
    db.add(doc)
    db.flush()

    version = PricingVersion(
        company_id=ayat.id,
        pricing_document_id=doc.id,
        name=version_name,
        status="published",
        effective_from=date(2024, 1, 1),
        effective_to=None,
        currency="ETB",
        includes_vat=True,
        published_at=datetime.now(UTC),
    )
    db.add(version)
    db.flush()

    rows = [
        PriceTableRow(
            pricing_version_id=version.id,
            project_id=ayat_hills.id,
            block_id=block_a.id,
            floor_band="1-8",
            unit_type_code="T3",
            price_per_sqm=Decimal("45000"),
        ),
        PriceTableRow(
            pricing_version_id=version.id,
            project_id=ayat_hills.id,
            block_id=block_b.id,
            floor_band="1-5",
            unit_type_code="T2",
            price_per_sqm=Decimal("42000"),
        ),
        PriceTableRow(
            pricing_version_id=version.id,
            project_id=block_cmc.project_id,
            floor_band="1-10",
            unit_type_code="T2",
            price_per_sqm=Decimal("38000"),
        ),
        PriceTableRow(
            pricing_version_id=version.id,
            project_id=ayat_hills.id,
            unit_type_code="T3",
            floor_band="9-12",
            price_per_sqm=Decimal("48000"),
        ),
    ]
    db.add_all(rows)
    db.add(
        DiscountRule(
            pricing_version_id=version.id,
            rule_type="promotional",
            priority=10,
            discount_percent=Decimal("5"),
            conditions={"note": "Demo 5% discount — select rule id when calculating"},
        )
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed demo companies, inventory, and listings.")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Delete demo companies (ayat-real-estate, sunshine-developers) before seeding.",
    )
    args = parser.parse_args()

    db = SessionLocal()
    try:
        if args.reset:
            _reset_demo(db)
        seed(db)
    except Exception as exc:
        db.rollback()
        print(f"Seed failed: {exc}", file=sys.stderr)
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
