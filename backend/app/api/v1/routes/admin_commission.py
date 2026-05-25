from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_roles
from app.models.commission import AgentContract, CommissionRule, CommissionScheme
from app.models.company import SalesChannel
from app.schemas.commission import (
    AgentContractCreate,
    AgentContractRead,
    CommissionRuleCreate,
    CommissionRuleRead,
    CommissionSchemeCreate,
    CommissionSchemeRead,
    CommissionSchemeUpdate,
)
from app.schemas.inventory import Paginated

router = APIRouter(dependencies=[Depends(require_roles("admin"))])


def _not_found(entity: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={"code": "NOT_FOUND", "message": f"{entity} not found"},
    )


@router.get("/commission-schemes", response_model=Paginated[CommissionSchemeRead])
def list_schemes(
    db: Session = Depends(get_db),
    company_id: UUID | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
) -> Paginated[CommissionSchemeRead]:
    q = db.query(CommissionScheme)
    if company_id is not None:
        q = q.filter(CommissionScheme.company_id == company_id)
    total = q.count()
    rows = q.order_by(CommissionScheme.name).offset(skip).limit(limit).all()
    return Paginated(
        items=[CommissionSchemeRead.model_validate(r) for r in rows],
        total=total,
    )


@router.post(
    "/commission-schemes",
    response_model=CommissionSchemeRead,
    status_code=status.HTTP_201_CREATED,
)
def create_scheme(
    body: CommissionSchemeCreate,
    db: Session = Depends(get_db),
) -> CommissionSchemeRead:
    row = CommissionScheme(
        company_id=body.company_id,
        name=body.name,
        status="draft",
        effective_from=body.effective_from,
        effective_to=body.effective_to,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return CommissionSchemeRead.model_validate(row)


@router.post("/commission-schemes/{scheme_id}/publish", response_model=CommissionSchemeRead)
def publish_scheme(scheme_id: UUID, db: Session = Depends(get_db)) -> CommissionSchemeRead:
    row = db.query(CommissionScheme).filter(CommissionScheme.id == scheme_id).first()
    if row is None:
        raise _not_found("Commission scheme")
    row.status = "published"
    db.commit()
    db.refresh(row)
    return CommissionSchemeRead.model_validate(row)


@router.patch("/commission-schemes/{scheme_id}", response_model=CommissionSchemeRead)
def update_scheme(
    scheme_id: UUID,
    body: CommissionSchemeUpdate,
    db: Session = Depends(get_db),
) -> CommissionSchemeRead:
    row = db.query(CommissionScheme).filter(CommissionScheme.id == scheme_id).first()
    if row is None:
        raise _not_found("Commission scheme")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return CommissionSchemeRead.model_validate(row)


@router.get(
    "/commission-schemes/{scheme_id}/rules",
    response_model=list[CommissionRuleRead],
)
def list_rules(scheme_id: UUID, db: Session = Depends(get_db)) -> list[CommissionRuleRead]:
    rows = (
        db.query(CommissionRule)
        .filter(CommissionRule.commission_scheme_id == scheme_id)
        .order_by(CommissionRule.created_at)
        .all()
    )
    return [CommissionRuleRead.model_validate(r) for r in rows]


@router.post(
    "/commission-schemes/{scheme_id}/rules",
    response_model=CommissionRuleRead,
    status_code=status.HTTP_201_CREATED,
)
def create_rule(
    scheme_id: UUID,
    body: CommissionRuleCreate,
    db: Session = Depends(get_db),
) -> CommissionRuleRead:
    if body.commission_percent is None and body.fixed_amount is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_RULE", "message": "Set commission_percent or fixed_amount"},
        )
    row = CommissionRule(commission_scheme_id=scheme_id, **body.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return CommissionRuleRead.model_validate(row)


@router.get("/sales-channels", response_model=Paginated[dict])
def list_sales_channels(
    db: Session = Depends(get_db),
    company_id: UUID | None = None,
) -> Paginated[dict]:
    q = db.query(SalesChannel)
    if company_id is not None:
        q = q.filter(SalesChannel.company_id == company_id)
    rows = q.all()
    items = [
        {
            "id": str(r.id),
            "code": r.code,
            "name": r.name,
            "company_id": str(r.company_id) if r.company_id else None,
        }
        for r in rows
    ]
    return Paginated(items=items, total=len(items))


@router.post(
    "/agent-contracts",
    response_model=AgentContractRead,
    status_code=status.HTTP_201_CREATED,
)
def create_agent_contract(
    body: AgentContractCreate,
    db: Session = Depends(get_db),
) -> AgentContractRead:
    row = AgentContract(**body.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return AgentContractRead.model_validate(row)


@router.get("/agent-contracts", response_model=Paginated[AgentContractRead])
def list_agent_contracts(
    db: Session = Depends(get_db),
    company_id: UUID | None = None,
) -> Paginated[AgentContractRead]:
    q = db.query(AgentContract)
    if company_id is not None:
        q = q.filter(AgentContract.company_id == company_id)
    rows = q.all()
    return Paginated(
        items=[AgentContractRead.model_validate(r) for r in rows],
        total=len(rows),
    )
