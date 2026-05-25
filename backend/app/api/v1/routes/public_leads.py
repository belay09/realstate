from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_db
from app.models.analytics import LeadEvent
from app.models.company import Company
from app.models.inventory import Block, PropertyListing, PropertyUnit
from app.schemas.leads import LeadRead, PublicLeadCreate

router = APIRouter()


@router.post("/leads", response_model=LeadRead, status_code=status.HTTP_201_CREATED)
def submit_public_lead(body: PublicLeadCreate, db: Session = Depends(get_db)) -> LeadRead:
    listing: PropertyListing | None = None
    unit_id = body.unit_id

    if body.listing_slug:
        listing = (
            db.query(PropertyListing)
            .options(
                selectinload(PropertyListing.unit)
                .selectinload(PropertyUnit.block)
                .selectinload(Block.project),
            )
            .filter(PropertyListing.slug == body.listing_slug)
            .first()
        )
        if listing is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "NOT_FOUND", "message": "Listing not found"},
            )
        unit_id = listing.unit_id
    elif body.listing_id:
        listing = db.query(PropertyListing).filter(PropertyListing.id == body.listing_id).first()
        if listing is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "NOT_FOUND", "message": "Listing not found"},
            )
        unit_id = listing.unit_id

    if unit_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "MISSING_CONTEXT",
                "message": "Provide listing_slug, listing_id, or unit_id",
            },
        )

    unit = (
        db.query(PropertyUnit)
        .options(
            selectinload(PropertyUnit.unit_type),
            selectinload(PropertyUnit.block).selectinload(Block.project),
        )
        .filter(PropertyUnit.id == unit_id)
        .first()
    )
    if unit is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Unit not found"},
        )

    company_id = unit.unit_type.company_id
    company = db.query(Company).filter(Company.id == company_id).first()
    if company is None or not company.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "COMPANY_INACTIVE", "message": "Cannot submit lead for this property"},
        )

    from app.models.leads_contracts import Lead

    lead = Lead(
        listing_id=listing.id if listing else None,
        unit_id=unit_id,
        company_id=company_id,
        name=body.name,
        phone=body.phone,
        email=str(body.email) if body.email else None,
        message=body.message,
        source=body.source,
        status="new",
    )
    db.add(lead)
    db.flush()
    db.add(
        LeadEvent(
            lead_id=lead.id,
            event_type="submitted",
            payload={"source": body.source},
        )
    )
    db.commit()
    db.refresh(lead)
    return LeadRead.model_validate(lead)
