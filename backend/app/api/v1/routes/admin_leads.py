from __future__ import annotations

import secrets
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db, require_roles
from app.models.analytics import AuditLog, LeadEvent
from app.models.identity import User
from app.models.inventory import PropertyUnit, UnitStatusHistory
from app.models.leads_contracts import Lead, LeadQuote, Reservation, SalesContract
from app.models.pricing import UnitPriceQuote
from app.schemas.inventory import Paginated
from app.schemas.leads import (
    LeadQuoteLink,
    LeadRead,
    LeadStatusUpdate,
    ReservationCreate,
    ReservationRead,
    SalesContractCreate,
    SalesContractRead,
)

router = APIRouter(dependencies=[Depends(require_roles("admin"))])


def _not_found(entity: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={"code": "NOT_FOUND", "message": f"{entity} not found"},
    )


@router.get("/leads", response_model=Paginated[LeadRead])
def list_leads(
    db: Session = Depends(get_db),
    company_id: UUID | None = None,
    status_filter: str | None = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
) -> Paginated[LeadRead]:
    q = db.query(Lead)
    if company_id is not None:
        q = q.filter(Lead.company_id == company_id)
    if status_filter:
        q = q.filter(Lead.status == status_filter)
    total = q.count()
    rows = q.order_by(Lead.created_at.desc()).offset(skip).limit(limit).all()
    return Paginated(items=[LeadRead.model_validate(r) for r in rows], total=total)


@router.get("/leads/{lead_id}", response_model=LeadRead)
def get_lead(lead_id: UUID, db: Session = Depends(get_db)) -> LeadRead:
    row = db.query(Lead).filter(Lead.id == lead_id).first()
    if row is None:
        raise _not_found("Lead")
    return LeadRead.model_validate(row)


@router.patch("/leads/{lead_id}", response_model=LeadRead)
def update_lead_status(
    lead_id: UUID,
    body: LeadStatusUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_active_user),
) -> LeadRead:
    row = db.query(Lead).filter(Lead.id == lead_id).first()
    if row is None:
        raise _not_found("Lead")
    old = row.status
    row.status = body.status
    db.add(
        LeadEvent(
            lead_id=row.id,
            event_type="status_changed",
            payload={"from": old, "to": body.status, "note": body.note},
        )
    )
    db.add(
        AuditLog(
            actor_user_id=admin.id,
            action="lead.status_changed",
            entity_type="lead",
            entity_id=row.id,
            payload={"from": old, "to": body.status},
        )
    )
    db.commit()
    db.refresh(row)
    return LeadRead.model_validate(row)


@router.post("/leads/{lead_id}/quotes", response_model=LeadRead)
def link_quote_to_lead(
    lead_id: UUID,
    body: LeadQuoteLink,
    db: Session = Depends(get_db),
) -> LeadRead:
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if lead is None:
        raise _not_found("Lead")
    quote = db.query(UnitPriceQuote).filter(UnitPriceQuote.id == body.quote_id).first()
    if quote is None:
        raise _not_found("Quote")
    existing = (
        db.query(LeadQuote)
        .filter(LeadQuote.lead_id == lead_id, LeadQuote.quote_id == body.quote_id)
        .first()
    )
    if not existing:
        db.add(LeadQuote(lead_id=lead_id, quote_id=body.quote_id))
    lead.quote_id = body.quote_id
    db.commit()
    db.refresh(lead)
    return LeadRead.model_validate(lead)


@router.post("/reservations", response_model=ReservationRead, status_code=status.HTTP_201_CREATED)
def create_reservation(
    body: ReservationCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_active_user),
) -> ReservationRead:
    quote = db.query(UnitPriceQuote).filter(UnitPriceQuote.id == body.quote_id).first()
    if quote is None:
        raise _not_found("Quote")
    unit = db.query(PropertyUnit).filter(PropertyUnit.id == quote.unit_id).first()
    if unit is None:
        raise _not_found("Unit")
    if unit.status not in ("available", "draft"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "UNIT_NOT_AVAILABLE", "message": "Unit cannot be reserved"},
        )
    hist = UnitStatusHistory(
        unit_id=unit.id,
        user_id=admin.id,
        from_status=unit.status,
        to_status="reserved",
        note="Reservation created",
    )
    unit.status = "reserved"
    db.add(hist)
    row = Reservation(
        quote_id=quote.id,
        unit_id=unit.id,
        status="active",
        expires_at=body.expires_at,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return ReservationRead.model_validate(row)


@router.post("/contracts", response_model=SalesContractRead, status_code=status.HTTP_201_CREATED)
def create_contract(
    body: SalesContractCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_active_user),
) -> SalesContractRead:
    quote = db.query(UnitPriceQuote).filter(UnitPriceQuote.id == body.quote_id).first()
    if quote is None:
        raise _not_found("Quote")
    unit = db.query(PropertyUnit).filter(PropertyUnit.id == quote.unit_id).first()
    if unit is None:
        raise _not_found("Unit")

    contract_number = body.contract_number or f"BP-{secrets.token_hex(4).upper()}"
    taken = db.query(SalesContract).filter(SalesContract.contract_number == contract_number).first()
    if taken:
        contract_number = f"BP-{secrets.token_hex(6).upper()}"

    row = SalesContract(
        quote_id=quote.id,
        reservation_id=body.reservation_id,
        contract_number=contract_number,
        buyer_name=body.buyer_name,
        locked_price=quote.final_price,
        status="signed" if body.signed_date else "draft",
        signed_date=body.signed_date,
    )
    db.add(row)
    db.flush()

    if body.signed_date or row.status == "signed":
        hist = UnitStatusHistory(
            unit_id=unit.id,
            user_id=admin.id,
            from_status=unit.status,
            to_status="sold",
            note=f"Contract {contract_number}",
        )
        unit.status = "sold"
        db.add(hist)

    db.add(
        AuditLog(
            actor_user_id=admin.id,
            action="contract.created",
            entity_type="sales_contract",
            entity_id=row.id,
            payload={"contract_number": contract_number, "quote_id": str(quote.id)},
        )
    )
    db.commit()
    db.refresh(row)
    return SalesContractRead.model_validate(row)


@router.get("/contracts", response_model=Paginated[SalesContractRead])
def list_contracts(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
) -> Paginated[SalesContractRead]:
    q = db.query(SalesContract)
    total = q.count()
    rows = q.order_by(SalesContract.created_at.desc()).offset(skip).limit(limit).all()
    return Paginated(items=[SalesContractRead.model_validate(r) for r in rows], total=total)
