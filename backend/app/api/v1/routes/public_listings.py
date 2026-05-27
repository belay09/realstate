from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import distinct
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_db
from app.models.company import Company
from app.models.inventory import (
    Block,
    HomePageCard,
    LocationContent,
    Project,
    PropertyListing,
    PropertyUnit,
    UnitType,
)
from app.models.payment import PaymentPlan
from app.schemas.inventory import (
    Paginated,
    PublicFilterOption,
    PublicHomeCard,
    PublicListingDetail,
    PublicListingFilterOptions,
    PublicListingImage,
    PublicListingSummary,
    PublicLocationContent,
)
from app.schemas.payment import (
    InstallmentItemRead,
    PublicPaymentPlanOption,
    PublicPaymentPreview,
)
from app.schemas.pricing import PublicPricePreview
from app.services.payment_service import (
    PaymentError,
    check_plan_eligibility,
    preview_installment_items,
)
from app.services.pricing_engine import PricingError, calculate_unit_price

router = APIRouter()


def _not_found() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={"code": "NOT_FOUND", "message": "Listing not found"},
    )


def _primary_image_url(listing: PropertyListing) -> str | None:
    ims = list(listing.images)
    if not ims:
        return None
    ims.sort(key=lambda i: (not i.is_primary, i.sort_order))
    return ims[0].url


def _sorted_images(listing: PropertyListing) -> list[PublicListingImage]:
    ims = sorted(listing.images, key=lambda i: (not i.is_primary, i.sort_order, i.id))
    return [
        PublicListingImage(url=i.url, sort_order=i.sort_order, is_primary=i.is_primary)
        for i in ims
    ]


def _sorted_location_media(content: LocationContent) -> list[dict[str, object]]:
    rows = sorted(content.media, key=lambda m: (not m.is_primary, m.sort_order, m.id))
    return [
        {
            "id": m.id,
            "url": m.url,
            "media_type": m.media_type,
            "caption": m.caption,
            "sort_order": m.sort_order,
            "is_primary": m.is_primary,
        }
        for m in rows
    ]


def _to_summary(
    listing: PropertyListing,
    location_cover_map: dict[str, str] | None = None,
) -> PublicListingSummary:
    unit = listing.unit
    ut = unit.unit_type
    block = unit.block
    project = block.project
    company = project.company
    project_cover = None
    if location_cover_map:
        project_cover = location_cover_map.get(project.slug)
    return PublicListingSummary(
        id=listing.id,
        title=listing.title,
        slug=listing.slug,
        city=listing.city,
        area=listing.area,
        bedrooms=ut.bedrooms,
        unit_type_code=ut.code,
        unit_type_name=ut.name,
        company_name=company.name,
        company_slug=company.slug,
        project_name=project.name,
        project_slug=project.slug,
        primary_image_url=project_cover or _primary_image_url(listing),
    )


def _public_listing_base_query(db: Session):
    return (
        db.query(PropertyListing)
        .join(PropertyUnit, PropertyListing.unit_id == PropertyUnit.id)
        .join(UnitType, PropertyUnit.unit_type_id == UnitType.id)
        .join(Block, PropertyUnit.block_id == Block.id)
        .join(Project, Block.project_id == Project.id)
        .join(Company, Project.company_id == Company.id)
        .options(
            selectinload(PropertyListing.images),
            selectinload(PropertyListing.unit).selectinload(PropertyUnit.unit_type),
            selectinload(PropertyListing.unit)
            .selectinload(PropertyUnit.block)
            .selectinload(Block.project)
            .selectinload(Project.company),
        )
        .filter(PropertyListing.is_public.is_(True))
        .filter(PropertyUnit.status == "available")
        .filter(Company.is_active.is_(True))
    )


@router.get("/listings", response_model=Paginated[PublicListingSummary])
def list_public_listings(
    db: Session = Depends(get_db),
    city: str | None = None,
    area: str | None = None,
    bedrooms: int | None = Query(default=None, ge=0),
    unit_type_code: str | None = None,
    company_slug: str | None = None,
    project_slug: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
) -> Paginated[PublicListingSummary]:
    q = _public_listing_base_query(db)
    if city:
        q = q.filter(PropertyListing.city.ilike(f"%{city}%"))
    if area:
        q = q.filter(PropertyListing.area.ilike(f"%{area}%"))
    if bedrooms is not None:
        q = q.filter(UnitType.bedrooms == bedrooms)
    if unit_type_code:
        q = q.filter(UnitType.code == unit_type_code)
    if company_slug:
        q = q.filter(Company.slug == company_slug)
    if project_slug:
        q = q.filter(Project.slug == project_slug)

    total = q.count()
    rows = (
        q.order_by(PropertyListing.is_featured.desc(), PropertyListing.updated_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    project_slugs = {r.unit.block.project.slug for r in rows}
    location_cover_map: dict[str, str] = {}
    if project_slugs:
        content_rows = (
            db.query(LocationContent)
            .options(selectinload(LocationContent.media))
            .filter(
                LocationContent.kind == "apartment",
                LocationContent.location_id.in_(project_slugs),
                LocationContent.is_public.is_(True),
            )
            .all()
        )
        for content in content_rows:
            sorted_media = sorted(
                content.media,
                key=lambda m: (not m.is_primary, m.sort_order, m.id),
            )
            cover = next((m.url for m in sorted_media if m.media_type == "image"), None)
            if not cover and sorted_media:
                cover = sorted_media[0].url
            if cover:
                location_cover_map[content.location_id] = cover

    return Paginated(items=[_to_summary(r, location_cover_map) for r in rows], total=total)


def _bedroom_label(count: int) -> str:
    if count == 1:
        return "1 bedroom"
    return f"{count} bedrooms"


@router.get("/listings/filter-options", response_model=PublicListingFilterOptions)
def public_listing_filter_options(db: Session = Depends(get_db)) -> PublicListingFilterOptions:
    base = _public_listing_base_query(db)

    area_rows = (
        base.with_entities(distinct(PropertyListing.area))
        .filter(PropertyListing.area.isnot(None), PropertyListing.area != "")
        .order_by(PropertyListing.area)
        .all()
    )
    city_rows = (
        base.with_entities(distinct(PropertyListing.city))
        .filter(PropertyListing.city.isnot(None), PropertyListing.city != "")
        .order_by(PropertyListing.city)
        .all()
    )
    bedroom_rows = (
        base.with_entities(distinct(UnitType.bedrooms))
        .filter(UnitType.bedrooms.isnot(None))
        .order_by(UnitType.bedrooms)
        .all()
    )
    company_rows = (
        base.with_entities(distinct(Company.slug), Company.name)
        .order_by(Company.name)
        .all()
    )
    unit_type_rows = (
        base.with_entities(distinct(UnitType.code), UnitType.name)
        .order_by(UnitType.name)
        .all()
    )

    return PublicListingFilterOptions(
        areas=[PublicFilterOption(value=r[0], label=r[0]) for r in area_rows if r[0]],
        cities=[PublicFilterOption(value=r[0], label=r[0]) for r in city_rows if r[0]],
        bedrooms=[
            PublicFilterOption(value=str(r[0]), label=_bedroom_label(int(r[0])))
            for r in bedroom_rows
            if r[0] is not None
        ],
        companies=[
            PublicFilterOption(value=slug, label=name)
            for slug, name in company_rows
            if slug and name
        ],
        unit_types=[
            PublicFilterOption(value=code, label=name)
            for code, name in unit_type_rows
            if code and name
        ],
    )


@router.get("/listings/{slug}", response_model=PublicListingDetail)
def get_public_listing(slug: str, db: Session = Depends(get_db)) -> PublicListingDetail:
    row = (
        _public_listing_base_query(db)
        .filter(PropertyListing.slug == slug)
        .first()
    )
    if row is None:
        raise _not_found()
    unit = row.unit
    summary = _to_summary(row)
    return PublicListingDetail(
        **summary.model_dump(),
        description=row.description,
        images=_sorted_images(row),
        unit_number=unit.unit_number,
        floor_number=unit.floor_number,
        area_sqm=unit.area_sqm,
        unit_status=unit.status,
    )


@router.get(
    "/location-content/{kind}/{location_id}",
    response_model=PublicLocationContent,
)
def get_public_location_content(
    kind: str,
    location_id: str,
    db: Session = Depends(get_db),
) -> PublicLocationContent:
    if kind not in {"apartment", "shop"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "BAD_REQUEST", "message": "kind must be apartment or shop"},
        )
    row = (
        db.query(LocationContent)
        .filter(
            LocationContent.kind == kind,
            LocationContent.location_id == location_id,
            LocationContent.is_public.is_(True),
        )
        .first()
    )
    if row is None:
        return PublicLocationContent(
            kind=kind,
            location_id=location_id,
            title=None,
            subtitle=None,
            description=None,
            video_url=None,
            cards=[],
            media=[],
        )
    return PublicLocationContent(
        kind=row.kind,
        location_id=row.location_id,
        title=row.title,
        subtitle=row.subtitle,
        description=row.description,
        video_url=row.video_url,
        cards=row.cards or [],
        media=_sorted_location_media(row),
    )


@router.get("/listings/{slug}/price-preview", response_model=PublicPricePreview)
def public_listing_price_preview(slug: str, db: Session = Depends(get_db)) -> PublicPricePreview:
    row = (
        _public_listing_base_query(db)
        .filter(PropertyListing.slug == slug)
        .first()
    )
    if row is None:
        raise _not_found()
    try:
        calc = calculate_unit_price(db, unit_id=row.unit_id, as_of=date.today())
    except PricingError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "PRICE_UNAVAILABLE",
                "message": "No published pricing available for this property",
            },
        ) from None
    return PublicPricePreview(
        final_price=calc.final_price,
        currency=calc.currency,
        includes_vat=calc.includes_vat,
        pricing_version_name=calc.pricing_version_name,
    )


@router.get("/listings/{slug}/payment-plans", response_model=list[PublicPaymentPlanOption])
def public_listing_payment_plans(
    slug: str,
    db: Session = Depends(get_db),
) -> list[PublicPaymentPlanOption]:
    row = (
        _public_listing_base_query(db)
        .filter(PropertyListing.slug == slug)
        .first()
    )
    if row is None:
        raise _not_found()
    company_id = row.unit.unit_type.company_id
    unit_type = row.unit.unit_type
    plans = (
        db.query(PaymentPlan)
        .filter(PaymentPlan.company_id == company_id, PaymentPlan.status == "published")
        .order_by(PaymentPlan.code)
        .all()
    )
    options: list[PublicPaymentPlanOption] = []
    for plan in plans:
        try:
            check_plan_eligibility(plan, unit_type)
        except PaymentError:
            continue
        options.append(PublicPaymentPlanOption(code=plan.code, name=plan.name))
    return options


@router.get("/listings/{slug}/payment-preview", response_model=PublicPaymentPreview)
def public_listing_payment_preview(
    slug: str,
    plan_code: str = Query(default="full", min_length=1, max_length=64),
    db: Session = Depends(get_db),
) -> PublicPaymentPreview:
    row = (
        _public_listing_base_query(db)
        .filter(PropertyListing.slug == slug)
        .first()
    )
    if row is None:
        raise _not_found()
    try:
        calc = calculate_unit_price(db, unit_id=row.unit_id, as_of=date.today())
    except PricingError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "PRICE_UNAVAILABLE", "message": "No published pricing available"},
        ) from None

    company_id = row.unit.unit_type.company_id
    plan = (
        db.query(PaymentPlan)
        .options(selectinload(PaymentPlan.steps))
        .filter(
            PaymentPlan.company_id == company_id,
            PaymentPlan.code == plan_code,
            PaymentPlan.status == "published",
        )
        .first()
    )
    if plan is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "PLAN_NOT_FOUND", "message": "Payment plan not available"},
        )
    try:
        check_plan_eligibility(plan, row.unit.unit_type)
    except PaymentError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": exc.code, "message": exc.message},
        ) from exc

    raw_items, down = preview_installment_items(final_price=calc.final_price, plan=plan)
    items = [InstallmentItemRead.model_validate(i) for i in raw_items]
    return PublicPaymentPreview(
        plan_code=plan.code,
        plan_name=plan.name,
        final_price=calc.final_price,
        currency=calc.currency,
        down_payment_amount=down,
        items=items,
    )


@router.get("/home-cards", response_model=list[PublicHomeCard])
def get_public_home_cards(db: Session = Depends(get_db)) -> list[PublicHomeCard]:
    rows = (
        db.query(HomePageCard)
        .filter(HomePageCard.is_active.is_(True))
        .order_by(HomePageCard.sort_order, HomePageCard.card_key)
        .all()
    )
    return [
        PublicHomeCard(
            card_key=r.card_key,
            title=r.title,
            description=r.description,
            tag=r.tag,
            image_url=r.image_url,
            to_path=r.to_path,
            sort_order=r.sort_order,
        )
        for r in rows
    ]

