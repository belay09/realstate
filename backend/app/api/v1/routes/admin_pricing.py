from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db, require_roles
from app.data.ayat_official_loader import build_calculator_config_snapshot, load_official
from app.models.identity import User
from app.models.pricing import (
    DiscountRule,
    PriceHistoryEvent,
    PriceTableRow,
    PricingDocument,
    PricingVersion,
    UnitPriceQuote,
)
from app.schemas.inventory import Paginated
from app.schemas.pricing import (
    CalculatorConfigRead,
    CalculatorConfigUpdate,
    DiscountRuleCreate,
    DiscountRuleRead,
    LivePricingRead,
    PriceCalculateRequest,
    PriceCalculationBreakdown,
    PriceTableRowCreate,
    PriceTableRowRead,
    PricingDocumentCreate,
    PricingDocumentRead,
    PricingVersionCreate,
    PricingVersionRead,
    PricingVersionUpdate,
    UnitPriceQuoteRead,
)
from app.schemas.quote import FullQuoteRequest, FullQuoteResponse
from app.services.calculator_config import merge_calculator_config_update
from app.services.commission_service import CommissionError as CommErr
from app.services.live_pricing import get_or_create_live_pricing_version, touch_live_pricing
from app.services.payment_service import PaymentError as PayErr
from app.services.payment_service import attach_plan_to_quote
from app.services.pricing_engine import PricingError, calculate_unit_price, persist_quote
from app.services.quote_service import generate_full_quote

router = APIRouter(dependencies=[Depends(require_roles("admin"))])


def _not_found(entity: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={"code": "NOT_FOUND", "message": f"{entity} not found"},
    )


def _bad_request(code: str, message: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail={"code": code, "message": message},
    )


def _pricing_error(exc: PricingError) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail={"code": exc.code, "message": exc.message},
    )


def _get_version(db: Session, version_id: UUID) -> PricingVersion:
    row = db.query(PricingVersion).filter(PricingVersion.id == version_id).first()
    if row is None:
        raise _not_found("Pricing version")
    return row


def _require_draft(version: PricingVersion) -> None:
    if version.status != "draft":
        raise _bad_request("VERSION_NOT_DRAFT", "Only draft pricing versions can be edited")


# --- Live pricing (one editable config per company; versions are internal) ---


def _live_pricing_read(db: Session, version: PricingVersion) -> LivePricingRead:
    rows = (
        db.query(PriceTableRow)
        .filter(PriceTableRow.pricing_version_id == version.id)
        .order_by(PriceTableRow.created_at)
        .all()
    )
    return LivePricingRead(
        id=version.id,
        company_id=version.company_id,
        currency=version.currency,
        includes_vat=version.includes_vat,
        calculator_config=version.calculator_config,
        price_rows=[PriceTableRowRead.model_validate(r) for r in rows],
    )


@router.get("/pricing/live", response_model=LivePricingRead)
def get_live_pricing(
    company_id: UUID = Query(...),
    db: Session = Depends(get_db),
) -> LivePricingRead:
    version = get_or_create_live_pricing_version(db, company_id=company_id)
    db.commit()
    db.refresh(version)
    return _live_pricing_read(db, version)


@router.patch("/pricing/live/calculator-config", response_model=CalculatorConfigRead)
def update_live_calculator_config(
    company_id: UUID = Query(...),
    body: CalculatorConfigUpdate = ...,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_active_user),
) -> CalculatorConfigRead:
    version = get_or_create_live_pricing_version(db, company_id=company_id)
    patch = body.model_dump(exclude_unset=True)
    version.calculator_config = merge_calculator_config_update(version.calculator_config, patch)
    if version.status != "published":
        version.status = "published"
        version.published_at = version.published_at or datetime.now(UTC)
    touch_live_pricing(db, version, user_id=admin.id)
    db.commit()
    db.refresh(version)
    return CalculatorConfigRead(calculator_config=version.calculator_config, status=version.status)


@router.post(
    "/pricing/live/price-rows",
    response_model=PriceTableRowRead,
    status_code=status.HTTP_201_CREATED,
)
def create_live_price_row(
    company_id: UUID = Query(...),
    body: PriceTableRowCreate = ...,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_active_user),
) -> PriceTableRowRead:
    version = get_or_create_live_pricing_version(db, company_id=company_id)
    if body.price_per_sqm is None and body.fixed_price is None:
        raise _bad_request(
            "INVALID_ROW",
            "Provide price_per_sqm or fixed_price",
        )
    row = PriceTableRow(
        pricing_version_id=version.id,
        project_id=body.project_id,
        block_id=body.block_id,
        floor_band=body.floor_band,
        unit_type_code=body.unit_type_code,
        finish_type=body.finish_type,
        construction_state=body.construction_state,
        price_per_sqm=body.price_per_sqm,
        fixed_price=body.fixed_price,
        conditions=body.conditions,
    )
    db.add(row)
    if version.status != "published":
        version.status = "published"
        version.published_at = version.published_at or datetime.now(UTC)
    touch_live_pricing(db, version, user_id=admin.id)
    db.commit()
    db.refresh(row)
    return PriceTableRowRead.model_validate(row)


@router.delete("/pricing/live/price-rows/{row_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_live_price_row(
    row_id: UUID,
    company_id: UUID = Query(...),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_active_user),
) -> None:
    version = get_or_create_live_pricing_version(db, company_id=company_id)
    row = (
        db.query(PriceTableRow)
        .filter(
            PriceTableRow.id == row_id,
            PriceTableRow.pricing_version_id == version.id,
        )
        .first()
    )
    if row is None:
        raise _not_found("Price row")
    db.delete(row)
    touch_live_pricing(db, version, user_id=admin.id)
    db.commit()


# --- Documents ---


@router.get("/pricing-documents", response_model=Paginated[PricingDocumentRead])
def list_pricing_documents(
    db: Session = Depends(get_db),
    company_id: UUID | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
) -> Paginated[PricingDocumentRead]:
    q = db.query(PricingDocument)
    if company_id is not None:
        q = q.filter(PricingDocument.company_id == company_id)
    total = q.count()
    rows = q.order_by(PricingDocument.uploaded_at.desc()).offset(skip).limit(limit).all()
    return Paginated(
        items=[PricingDocumentRead.model_validate(r) for r in rows],
        total=total,
    )


@router.post(
    "/pricing-documents",
    response_model=PricingDocumentRead,
    status_code=status.HTTP_201_CREATED,
)
def create_pricing_document(
    body: PricingDocumentCreate,
    db: Session = Depends(get_db),
) -> PricingDocumentRead:
    row = PricingDocument(
        company_id=body.company_id,
        title=body.title,
        document_type=body.document_type,
        storage_url=body.storage_url,
        ocr_status=body.ocr_status,
        extracted_text=body.extracted_text,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return PricingDocumentRead.model_validate(row)


# --- Versions ---


@router.get("/pricing-versions", response_model=Paginated[PricingVersionRead])
def list_pricing_versions(
    db: Session = Depends(get_db),
    company_id: UUID | None = None,
    status_filter: str | None = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
) -> Paginated[PricingVersionRead]:
    q = db.query(PricingVersion)
    if company_id is not None:
        q = q.filter(PricingVersion.company_id == company_id)
    if status_filter is not None:
        q = q.filter(PricingVersion.status == status_filter)
    total = q.count()
    rows = q.order_by(PricingVersion.effective_from.desc()).offset(skip).limit(limit).all()
    return Paginated(items=[PricingVersionRead.model_validate(r) for r in rows], total=total)


@router.post(
    "/pricing-versions",
    response_model=PricingVersionRead,
    status_code=status.HTTP_201_CREATED,
)
def create_pricing_version(
    body: PricingVersionCreate,
    db: Session = Depends(get_db),
) -> PricingVersionRead:
    row = PricingVersion(
        company_id=body.company_id,
        pricing_document_id=body.pricing_document_id,
        name=body.name,
        status="draft",
        effective_from=body.effective_from,
        effective_to=body.effective_to,
        currency=body.currency,
        includes_vat=body.includes_vat,
        calculator_config=build_calculator_config_snapshot(load_official()),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return PricingVersionRead.model_validate(row)


@router.get("/pricing-versions/{version_id}", response_model=PricingVersionRead)
def get_pricing_version(version_id: UUID, db: Session = Depends(get_db)) -> PricingVersionRead:
    return PricingVersionRead.model_validate(_get_version(db, version_id))


@router.patch("/pricing-versions/{version_id}", response_model=PricingVersionRead)
def update_pricing_version(
    version_id: UUID,
    body: PricingVersionUpdate,
    db: Session = Depends(get_db),
) -> PricingVersionRead:
    row = _get_version(db, version_id)
    _require_draft(row)
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return PricingVersionRead.model_validate(row)


@router.post("/pricing-versions/{version_id}/publish", response_model=PricingVersionRead)
def publish_pricing_version(
    version_id: UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_active_user),
) -> PricingVersionRead:
    row = _get_version(db, version_id)
    if row.status == "published":
        raise _bad_request("ALREADY_PUBLISHED", "Version is already published")
    if not row.price_rows:
        raise _bad_request("NO_PRICE_ROWS", "Add at least one price table row before publishing")
    if not row.calculator_config:
        row.calculator_config = build_calculator_config_snapshot(load_official())
    row.status = "published"
    row.published_at = datetime.now(UTC)
    db.add(
        PriceHistoryEvent(
            pricing_version_id=row.id,
            user_id=admin.id,
            event_type="published",
            payload={"name": row.name},
        )
    )
    db.commit()
    db.refresh(row)
    return PricingVersionRead.model_validate(row)


# --- Calculator config (shops, tiers, milestones; apartment rates = price rows) ---


@router.get(
    "/pricing-versions/{version_id}/calculator-config",
    response_model=CalculatorConfigRead,
)
def get_calculator_config(version_id: UUID, db: Session = Depends(get_db)) -> CalculatorConfigRead:
    row = _get_version(db, version_id)
    return CalculatorConfigRead(calculator_config=row.calculator_config, status=row.status)


@router.patch(
    "/pricing-versions/{version_id}/calculator-config",
    response_model=CalculatorConfigRead,
)
def update_calculator_config(
    version_id: UUID,
    body: CalculatorConfigUpdate,
    db: Session = Depends(get_db),
) -> CalculatorConfigRead:
    row = _get_version(db, version_id)
    _require_draft(row)
    patch = body.model_dump(exclude_unset=True)
    row.calculator_config = merge_calculator_config_update(row.calculator_config, patch)
    db.commit()
    db.refresh(row)
    return CalculatorConfigRead(calculator_config=row.calculator_config, status=row.status)


# --- Price rows ---


@router.get(
    "/pricing-versions/{version_id}/price-rows",
    response_model=list[PriceTableRowRead],
)
def list_price_rows(version_id: UUID, db: Session = Depends(get_db)) -> list[PriceTableRowRead]:
    _get_version(db, version_id)
    rows = (
        db.query(PriceTableRow)
        .filter(PriceTableRow.pricing_version_id == version_id)
        .order_by(PriceTableRow.created_at)
        .all()
    )
    return [PriceTableRowRead.model_validate(r) for r in rows]


@router.post(
    "/pricing-versions/{version_id}/price-rows",
    response_model=PriceTableRowRead,
    status_code=status.HTTP_201_CREATED,
)
def create_price_row(
    version_id: UUID,
    body: PriceTableRowCreate,
    db: Session = Depends(get_db),
) -> PriceTableRowRead:
    version = _get_version(db, version_id)
    _require_draft(version)
    if body.price_per_sqm is None and body.fixed_price is None:
        raise _bad_request(
            "INVALID_ROW",
            "Provide price_per_sqm or fixed_price",
        )
    row = PriceTableRow(
        pricing_version_id=version_id,
        project_id=body.project_id,
        block_id=body.block_id,
        floor_band=body.floor_band,
        unit_type_code=body.unit_type_code,
        finish_type=body.finish_type,
        construction_state=body.construction_state,
        price_per_sqm=body.price_per_sqm,
        fixed_price=body.fixed_price,
        conditions=body.conditions,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return PriceTableRowRead.model_validate(row)


@router.delete(
    "/pricing-versions/{version_id}/price-rows/{row_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_price_row(
    version_id: UUID,
    row_id: UUID,
    db: Session = Depends(get_db),
) -> None:
    version = _get_version(db, version_id)
    _require_draft(version)
    row = (
        db.query(PriceTableRow)
        .filter(
            PriceTableRow.id == row_id,
            PriceTableRow.pricing_version_id == version_id,
        )
        .first()
    )
    if row is None:
        raise _not_found("Price row")
    db.delete(row)
    db.commit()


# --- Discount rules ---


@router.get(
    "/pricing-versions/{version_id}/discount-rules",
    response_model=list[DiscountRuleRead],
)
def list_discount_rules(
    version_id: UUID,
    db: Session = Depends(get_db),
) -> list[DiscountRuleRead]:
    _get_version(db, version_id)
    rows = (
        db.query(DiscountRule)
        .filter(DiscountRule.pricing_version_id == version_id)
        .order_by(DiscountRule.priority.desc())
        .all()
    )
    return [DiscountRuleRead.model_validate(r) for r in rows]


@router.post(
    "/pricing-versions/{version_id}/discount-rules",
    response_model=DiscountRuleRead,
    status_code=status.HTTP_201_CREATED,
)
def create_discount_rule(
    version_id: UUID,
    body: DiscountRuleCreate,
    db: Session = Depends(get_db),
) -> DiscountRuleRead:
    version = _get_version(db, version_id)
    _require_draft(version)
    row = DiscountRule(
        pricing_version_id=version_id,
        rule_type=body.rule_type,
        priority=body.priority,
        conditions=body.conditions,
        discount_percent=body.discount_percent,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return DiscountRuleRead.model_validate(row)


# --- Calculate & quotes ---


@router.post("/pricing/calculate", response_model=PriceCalculationBreakdown)
def calculate_price(
    body: PriceCalculateRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_active_user),
) -> PriceCalculationBreakdown:
    try:
        result = calculate_unit_price(
            db,
            unit_id=body.unit_id,
            as_of=body.as_of_date,
            apply_discount_rule_ids=body.apply_discount_rule_ids,
        )
    except PricingError as exc:
        raise _pricing_error(exc) from exc

    if body.persist_quote:
        quote = persist_quote(
            db,
            unit_id=body.unit_id,
            breakdown=result,
            created_by_id=admin.id,
        )
        db.commit()
        result.snapshot["quote_id"] = str(quote.id)

    return result


@router.post("/quotes/generate", response_model=FullQuoteResponse)
def generate_quote(
    body: FullQuoteRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_active_user),
) -> FullQuoteResponse:
    try:
        return generate_full_quote(db, body, created_by_id=admin.id)
    except PricingError as exc:
        raise _pricing_error(exc) from exc
    except PayErr as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": exc.code, "message": exc.message},
        ) from exc
    except CommErr as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": exc.code, "message": exc.message},
        ) from exc


@router.post("/quotes/{quote_id}/attach-payment-plan")
def attach_payment_plan_to_quote(
    quote_id: UUID,
    payment_plan_id: UUID = Query(...),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    try:
        schedule = attach_plan_to_quote(
            db,
            quote_id=quote_id,
            payment_plan_id=payment_plan_id,
        )
        db.commit()
        return {"installment_schedule_id": str(schedule.id)}
    except PayErr as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": exc.code, "message": exc.message},
        ) from exc


@router.get("/pricing/quotes", response_model=Paginated[UnitPriceQuoteRead])
def list_quotes(
    db: Session = Depends(get_db),
    unit_id: UUID | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
) -> Paginated[UnitPriceQuoteRead]:
    q = db.query(UnitPriceQuote)
    if unit_id is not None:
        q = q.filter(UnitPriceQuote.unit_id == unit_id)
    total = q.count()
    rows = q.order_by(UnitPriceQuote.created_at.desc()).offset(skip).limit(limit).all()
    return Paginated(items=[UnitPriceQuoteRead.model_validate(r) for r in rows], total=total)
