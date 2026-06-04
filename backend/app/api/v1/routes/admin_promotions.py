from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_roles
from app.models.promotions import LocationPromotion
from app.schemas.promotions import (
    LocationPromotionCreate,
    LocationPromotionRead,
    LocationPromotionUpdate,
)

router = APIRouter(dependencies=[Depends(require_roles("admin"))])


def _get_promotion(db: Session, promotion_id: UUID) -> LocationPromotion:
    row = db.query(LocationPromotion).filter(LocationPromotion.id == promotion_id).first()
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Promotion not found"},
        )
    return row


@router.get("/location-promotions", response_model=list[LocationPromotionRead])
def list_location_promotions(
    company_id: UUID = Query(...),
    db: Session = Depends(get_db),
) -> list[LocationPromotionRead]:
    rows = (
        db.query(LocationPromotion)
        .filter(LocationPromotion.company_id == company_id)
        .order_by(LocationPromotion.starts_at.desc())
        .all()
    )
    return [LocationPromotionRead.model_validate(r) for r in rows]


@router.post(
    "/location-promotions",
    response_model=LocationPromotionRead,
    status_code=status.HTTP_201_CREATED,
)
def create_location_promotion(
    body: LocationPromotionCreate,
    db: Session = Depends(get_db),
) -> LocationPromotionRead:
    row = LocationPromotion(
        company_id=body.company_id,
        name=body.name.strip(),
        kind=body.kind,
        location_ids=body.location_ids,
        discount_percent=body.discount_percent,
        starts_at=body.starts_at,
        ends_at=body.ends_at,
        is_active=body.is_active,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return LocationPromotionRead.model_validate(row)


@router.patch("/location-promotions/{promotion_id}", response_model=LocationPromotionRead)
def update_location_promotion(
    promotion_id: UUID,
    body: LocationPromotionUpdate,
    db: Session = Depends(get_db),
) -> LocationPromotionRead:
    row = _get_promotion(db, promotion_id)
    data = body.model_dump(exclude_unset=True)
    if "name" in data and data["name"] is not None:
        data["name"] = data["name"].strip()
    if "starts_at" in data or "ends_at" in data:
        starts = data.get("starts_at", row.starts_at)
        ends = data.get("ends_at", row.ends_at)
        if ends <= starts:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "INVALID_RANGE", "message": "End must be after start"},
            )
    for key, value in data.items():
        setattr(row, key, value)
    db.commit()
    db.refresh(row)
    return LocationPromotionRead.model_validate(row)


@router.delete("/location-promotions/{promotion_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_location_promotion(
    promotion_id: UUID,
    db: Session = Depends(get_db),
) -> None:
    row = _get_promotion(db, promotion_id)
    db.delete(row)
    db.commit()
