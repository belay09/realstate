from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_db, require_roles
from app.models.payment import PaymentPlan, PaymentPlanStep
from app.schemas.inventory import Paginated
from app.schemas.payment import (
    PaymentPlanCreate,
    PaymentPlanRead,
    PaymentPlanStepCreate,
    PaymentPlanStepRead,
    PaymentPlanUpdate,
)
from app.services.payment_service import (
    PaymentError,
    validate_plan_steps,
    validate_step_percentages,
)

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


def _payment_error(exc: PaymentError) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail={"code": exc.code, "message": exc.message},
    )


def _plan_read(plan: PaymentPlan) -> PaymentPlanRead:
    return PaymentPlanRead(
        id=plan.id,
        company_id=plan.company_id,
        code=plan.code,
        name=plan.name,
        status=plan.status,
        effective_from=plan.effective_from,
        effective_to=plan.effective_to,
        created_at=plan.created_at,
        updated_at=plan.updated_at,
        steps=[
            PaymentPlanStepRead.model_validate(s)
            for s in sorted(plan.steps, key=lambda x: x.step_order)
        ],
    )


@router.get("/payment-plans", response_model=Paginated[PaymentPlanRead])
def list_payment_plans(
    db: Session = Depends(get_db),
    company_id: UUID | None = None,
    status_filter: str | None = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
) -> Paginated[PaymentPlanRead]:
    q = db.query(PaymentPlan).options(selectinload(PaymentPlan.steps))
    if company_id is not None:
        q = q.filter(PaymentPlan.company_id == company_id)
    if status_filter:
        q = q.filter(PaymentPlan.status == status_filter)
    total = q.count()
    rows = q.order_by(PaymentPlan.code).offset(skip).limit(limit).all()
    return Paginated(items=[_plan_read(r) for r in rows], total=total)


@router.post("/payment-plans", response_model=PaymentPlanRead, status_code=status.HTTP_201_CREATED)
def create_payment_plan(
    body: PaymentPlanCreate,
    db: Session = Depends(get_db),
) -> PaymentPlanRead:
    if body.steps:
        try:
            validate_step_percentages(body.steps, get_pct=lambda s: s.percentage)
        except PaymentError as exc:
            raise _payment_error(exc) from exc

    plan = PaymentPlan(
        company_id=body.company_id,
        code=body.code,
        name=body.name,
        status="draft",
        effective_from=body.effective_from,
        effective_to=body.effective_to,
    )
    db.add(plan)
    db.flush()
    for s in body.steps:
        db.add(
            PaymentPlanStep(
                payment_plan_id=plan.id,
                step_order=s.step_order,
                trigger_type=s.trigger_type,
                milestone_name=s.milestone_name,
                due_after_days=s.due_after_days,
                due_after_months=s.due_after_months,
                percentage=s.percentage,
            )
        )
    db.commit()
    db.refresh(plan)
    plan = (
        db.query(PaymentPlan)
        .options(selectinload(PaymentPlan.steps))
        .filter(PaymentPlan.id == plan.id)
        .first()
    )
    assert plan is not None
    return _plan_read(plan)


@router.get("/payment-plans/{plan_id}", response_model=PaymentPlanRead)
def get_payment_plan(plan_id: UUID, db: Session = Depends(get_db)) -> PaymentPlanRead:
    plan = (
        db.query(PaymentPlan)
        .options(selectinload(PaymentPlan.steps))
        .filter(PaymentPlan.id == plan_id)
        .first()
    )
    if plan is None:
        raise _not_found("Payment plan")
    return _plan_read(plan)


@router.patch("/payment-plans/{plan_id}", response_model=PaymentPlanRead)
def update_payment_plan(
    plan_id: UUID,
    body: PaymentPlanUpdate,
    db: Session = Depends(get_db),
) -> PaymentPlanRead:
    plan = (
        db.query(PaymentPlan)
        .options(selectinload(PaymentPlan.steps))
        .filter(PaymentPlan.id == plan_id)
        .first()
    )
    if plan is None:
        raise _not_found("Payment plan")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(plan, k, v)
    db.commit()
    db.refresh(plan)
    return _plan_read(plan)


@router.post("/payment-plans/{plan_id}/publish", response_model=PaymentPlanRead)
def publish_payment_plan(plan_id: UUID, db: Session = Depends(get_db)) -> PaymentPlanRead:
    plan = (
        db.query(PaymentPlan)
        .options(selectinload(PaymentPlan.steps))
        .filter(PaymentPlan.id == plan_id)
        .first()
    )
    if plan is None:
        raise _not_found("Payment plan")
    try:
        validate_plan_steps(list(plan.steps))
    except PaymentError as exc:
        raise _payment_error(exc) from exc
    plan.status = "published"
    db.commit()
    db.refresh(plan)
    return _plan_read(plan)


@router.post(
    "/payment-plans/{plan_id}/steps",
    response_model=PaymentPlanStepRead,
    status_code=status.HTTP_201_CREATED,
)
def add_payment_plan_step(
    plan_id: UUID,
    body: PaymentPlanStepCreate,
    db: Session = Depends(get_db),
) -> PaymentPlanStepRead:
    plan = db.query(PaymentPlan).filter(PaymentPlan.id == plan_id).first()
    if plan is None:
        raise _not_found("Payment plan")
    if plan.status == "published":
        raise _bad_request("PLAN_PUBLISHED", "Cannot modify steps on a published plan")
    row = PaymentPlanStep(payment_plan_id=plan_id, **body.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return PaymentPlanStepRead.model_validate(row)


@router.delete(
    "/payment-plans/{plan_id}/steps/{step_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_payment_plan_step(
    plan_id: UUID,
    step_id: UUID,
    db: Session = Depends(get_db),
) -> None:
    row = (
        db.query(PaymentPlanStep)
        .filter(PaymentPlanStep.id == step_id, PaymentPlanStep.payment_plan_id == plan_id)
        .first()
    )
    if row is None:
        raise _not_found("Payment plan step")
    db.delete(row)
    db.commit()
