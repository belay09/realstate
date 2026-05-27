from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db, require_roles
from app.models.company import Company
from app.models.identity import User
from app.models.inventory import (
    Block,
    LocationContent,
    LocationMedia,
    Project,
    PropertyImage,
    PropertyListing,
    PropertyUnit,
    UnitStatusHistory,
    UnitType,
)
from app.schemas.inventory import (
    BlockCreate,
    BlockRead,
    BlockUpdate,
    CompanyCreate,
    CompanyRead,
    CompanyUpdate,
    LocationContentCreate,
    LocationContentRead,
    LocationContentUpdate,
    LocationMediaCreate,
    LocationMediaRead,
    Paginated,
    ProjectCreate,
    ProjectRead,
    ProjectUpdate,
    PropertyImageCreate,
    PropertyImageRead,
    PropertyListingCreate,
    PropertyListingRead,
    PropertyListingUpdate,
    PropertyUnitCreate,
    PropertyUnitRead,
    PropertyUnitUpdate,
    UnitStatusChange,
    UnitTypeCreate,
    UnitTypeRead,
    UnitTypeUpdate,
)
from app.shared.slug import slugify, unique_slug_candidate

router = APIRouter(dependencies=[Depends(require_roles("admin"))])


def _conflict(message: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail={"code": "CONFLICT", "message": message},
    )


def _not_found(entity: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={"code": "NOT_FOUND", "message": f"{entity} not found"},
    )


def _allocate_company_slug(db: Session, suggestion: str) -> str:
    base = slugify(suggestion)
    rows = db.query(Company.slug).filter(Company.slug.startswith(base)).all()
    existing = {r[0] for r in rows}
    return unique_slug_candidate(existing, base)


def _allocate_project_slug(db: Session, company_id: UUID, suggestion: str) -> str:
    base = slugify(suggestion)
    rows = (
        db.query(Project.slug)
        .filter(Project.company_id == company_id)
        .filter(Project.slug.startswith(base))
        .all()
    )
    existing = {r[0] for r in rows}
    return unique_slug_candidate(existing, base)


def _allocate_listing_slug(db: Session, suggestion: str) -> str:
    base = slugify(suggestion, max_length=480)
    rows = db.query(PropertyListing.slug).filter(PropertyListing.slug.startswith(base)).all()
    existing = {r[0] for r in rows}
    return unique_slug_candidate(existing, base)


# --- Companies ---


@router.get("/companies", response_model=Paginated[CompanyRead])
def list_companies(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    is_active: bool | None = None,
) -> Paginated[CompanyRead]:
    q = db.query(Company)
    if is_active is not None:
        q = q.filter(Company.is_active.is_(is_active))
    total = q.count()
    rows = q.order_by(Company.name).offset(skip).limit(limit).all()
    return Paginated(items=[CompanyRead.model_validate(r) for r in rows], total=total)


@router.post("/companies", response_model=CompanyRead, status_code=status.HTTP_201_CREATED)
def create_company(body: CompanyCreate, db: Session = Depends(get_db)) -> CompanyRead:
    if body.slug:
        slug = slugify(body.slug)
        if db.query(Company).filter(Company.slug == slug).first():
            raise _conflict("Company slug already in use")
    else:
        slug = _allocate_company_slug(db, body.name)
    row = Company(
        name=body.name,
        slug=slug,
        phone=body.phone,
        website=body.website,
        logo_url=body.logo_url,
        description=body.description,
        is_active=body.is_active,
    )
    db.add(row)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise _conflict("Could not create company") from None
    db.refresh(row)
    return CompanyRead.model_validate(row)


@router.get("/companies/{company_id}", response_model=CompanyRead)
def get_company(company_id: UUID, db: Session = Depends(get_db)) -> CompanyRead:
    row = db.query(Company).filter(Company.id == company_id).first()
    if row is None:
        raise _not_found("Company")
    return CompanyRead.model_validate(row)


@router.patch("/companies/{company_id}", response_model=CompanyRead)
def update_company(
    company_id: UUID,
    body: CompanyUpdate,
    db: Session = Depends(get_db),
) -> CompanyRead:
    row = db.query(Company).filter(Company.id == company_id).first()
    if row is None:
        raise _not_found("Company")
    data = body.model_dump(exclude_unset=True)
    if "slug" in data and data["slug"] is not None:
        data["slug"] = slugify(data["slug"])
        taken = (
            db.query(Company)
            .filter(Company.slug == data["slug"], Company.id != company_id)
            .first()
        )
        if taken:
            raise _conflict("Company slug already in use")
    for k, v in data.items():
        setattr(row, k, v)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise _conflict("Could not update company") from None
    db.refresh(row)
    return CompanyRead.model_validate(row)


@router.delete("/companies/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_company(company_id: UUID, db: Session = Depends(get_db)) -> None:
    row = db.query(Company).filter(Company.id == company_id).first()
    if row is None:
        raise _not_found("Company")
    db.delete(row)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise _conflict("Could not delete company") from None


# --- Projects ---


@router.get("/projects", response_model=Paginated[ProjectRead])
def list_projects(
    db: Session = Depends(get_db),
    company_id: UUID | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
) -> Paginated[ProjectRead]:
    q = db.query(Project)
    if company_id is not None:
        q = q.filter(Project.company_id == company_id)
    total = q.count()
    rows = q.order_by(Project.name).offset(skip).limit(limit).all()
    return Paginated(items=[ProjectRead.model_validate(r) for r in rows], total=total)


@router.post("/projects", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
def create_project(body: ProjectCreate, db: Session = Depends(get_db)) -> ProjectRead:
    if db.query(Company).filter(Company.id == body.company_id).first() is None:
        raise _not_found("Company")
    if body.slug:
        slug = slugify(body.slug)
        taken = (
            db.query(Project)
            .filter(Project.company_id == body.company_id, Project.slug == slug)
            .first()
        )
        if taken:
            raise _conflict("Project slug already used for this company")
    else:
        slug = _allocate_project_slug(db, body.company_id, body.name)
    row = Project(
        company_id=body.company_id,
        name=body.name,
        slug=slug,
        city=body.city,
        area=body.area,
        status=body.status,
    )
    db.add(row)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise _conflict("Could not create project") from None
    db.refresh(row)
    return ProjectRead.model_validate(row)


@router.get("/projects/{project_id}", response_model=ProjectRead)
def get_project(project_id: UUID, db: Session = Depends(get_db)) -> ProjectRead:
    row = db.query(Project).filter(Project.id == project_id).first()
    if row is None:
        raise _not_found("Project")
    return ProjectRead.model_validate(row)


@router.patch("/projects/{project_id}", response_model=ProjectRead)
def update_project(
    project_id: UUID,
    body: ProjectUpdate,
    db: Session = Depends(get_db),
) -> ProjectRead:
    row = db.query(Project).filter(Project.id == project_id).first()
    if row is None:
        raise _not_found("Project")
    data = body.model_dump(exclude_unset=True)
    if "slug" in data and data["slug"] is not None:
        data["slug"] = slugify(data["slug"])
        taken = (
            db.query(Project)
            .filter(
                Project.company_id == row.company_id,
                Project.slug == data["slug"],
                Project.id != project_id,
            )
            .first()
        )
        if taken:
            raise _conflict("Project slug already used for this company")
    for k, v in data.items():
        setattr(row, k, v)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise _conflict("Could not update project") from None
    db.refresh(row)
    return ProjectRead.model_validate(row)


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: UUID, db: Session = Depends(get_db)) -> None:
    row = db.query(Project).filter(Project.id == project_id).first()
    if row is None:
        raise _not_found("Project")
    db.delete(row)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise _conflict("Could not delete project") from None


# --- Blocks ---


@router.get("/blocks", response_model=Paginated[BlockRead])
def list_blocks(
    db: Session = Depends(get_db),
    project_id: UUID | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
) -> Paginated[BlockRead]:
    q = db.query(Block)
    if project_id is not None:
        q = q.filter(Block.project_id == project_id)
    total = q.count()
    rows = q.order_by(Block.name).offset(skip).limit(limit).all()
    return Paginated(items=[BlockRead.model_validate(r) for r in rows], total=total)


@router.post("/blocks", response_model=BlockRead, status_code=status.HTTP_201_CREATED)
def create_block(body: BlockCreate, db: Session = Depends(get_db)) -> BlockRead:
    if db.query(Project).filter(Project.id == body.project_id).first() is None:
        raise _not_found("Project")
    row = Block(
        project_id=body.project_id,
        name=body.name,
        code=body.code,
        total_floors=body.total_floors,
    )
    db.add(row)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise _conflict("Could not create block") from None
    db.refresh(row)
    return BlockRead.model_validate(row)


@router.get("/blocks/{block_id}", response_model=BlockRead)
def get_block(block_id: UUID, db: Session = Depends(get_db)) -> BlockRead:
    row = db.query(Block).filter(Block.id == block_id).first()
    if row is None:
        raise _not_found("Block")
    return BlockRead.model_validate(row)


@router.patch("/blocks/{block_id}", response_model=BlockRead)
def update_block(
    block_id: UUID,
    body: BlockUpdate,
    db: Session = Depends(get_db),
) -> BlockRead:
    row = db.query(Block).filter(Block.id == block_id).first()
    if row is None:
        raise _not_found("Block")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return BlockRead.model_validate(row)


@router.delete("/blocks/{block_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_block(block_id: UUID, db: Session = Depends(get_db)) -> None:
    row = db.query(Block).filter(Block.id == block_id).first()
    if row is None:
        raise _not_found("Block")
    db.delete(row)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise _conflict("Could not delete block") from None


# --- Unit types ---


@router.get("/unit-types", response_model=Paginated[UnitTypeRead])
def list_unit_types(
    db: Session = Depends(get_db),
    company_id: UUID | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
) -> Paginated[UnitTypeRead]:
    q = db.query(UnitType)
    if company_id is not None:
        q = q.filter(UnitType.company_id == company_id)
    total = q.count()
    rows = q.order_by(UnitType.code).offset(skip).limit(limit).all()
    return Paginated(items=[UnitTypeRead.model_validate(r) for r in rows], total=total)


@router.post("/unit-types", response_model=UnitTypeRead, status_code=status.HTTP_201_CREATED)
def create_unit_type(body: UnitTypeCreate, db: Session = Depends(get_db)) -> UnitTypeRead:
    if db.query(Company).filter(Company.id == body.company_id).first() is None:
        raise _not_found("Company")
    taken = (
        db.query(UnitType)
        .filter(UnitType.company_id == body.company_id, UnitType.code == body.code)
        .first()
    )
    if taken:
        raise _conflict("Unit type code already used for this company")
    row = UnitType(
        company_id=body.company_id,
        code=body.code,
        name=body.name,
        category=body.category,
        bedrooms=body.bedrooms,
        default_area_sqm=body.default_area_sqm,
        finish_type=body.finish_type,
    )
    db.add(row)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise _conflict("Could not create unit type") from None
    db.refresh(row)
    return UnitTypeRead.model_validate(row)


@router.get("/unit-types/{unit_type_id}", response_model=UnitTypeRead)
def get_unit_type(unit_type_id: UUID, db: Session = Depends(get_db)) -> UnitTypeRead:
    row = db.query(UnitType).filter(UnitType.id == unit_type_id).first()
    if row is None:
        raise _not_found("Unit type")
    return UnitTypeRead.model_validate(row)


@router.patch("/unit-types/{unit_type_id}", response_model=UnitTypeRead)
def update_unit_type(
    unit_type_id: UUID,
    body: UnitTypeUpdate,
    db: Session = Depends(get_db),
) -> UnitTypeRead:
    row = db.query(UnitType).filter(UnitType.id == unit_type_id).first()
    if row is None:
        raise _not_found("Unit type")
    data = body.model_dump(exclude_unset=True)
    if "code" in data:
        taken = (
            db.query(UnitType)
            .filter(
                UnitType.company_id == row.company_id,
                UnitType.code == data["code"],
                UnitType.id != unit_type_id,
            )
            .first()
        )
        if taken:
            raise _conflict("Unit type code already used for this company")
    for k, v in data.items():
        setattr(row, k, v)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise _conflict("Could not update unit type") from None
    db.refresh(row)
    return UnitTypeRead.model_validate(row)


@router.delete("/unit-types/{unit_type_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_unit_type(unit_type_id: UUID, db: Session = Depends(get_db)) -> None:
    row = db.query(UnitType).filter(UnitType.id == unit_type_id).first()
    if row is None:
        raise _not_found("Unit type")
    db.delete(row)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise _conflict("Unit type is still referenced by units") from None


# --- Property units ---


@router.get("/units", response_model=Paginated[PropertyUnitRead])
def list_units(
    db: Session = Depends(get_db),
    block_id: UUID | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
) -> Paginated[PropertyUnitRead]:
    q = db.query(PropertyUnit)
    if block_id is not None:
        q = q.filter(PropertyUnit.block_id == block_id)
    total = q.count()
    rows = q.order_by(PropertyUnit.unit_number).offset(skip).limit(limit).all()
    return Paginated(items=[PropertyUnitRead.model_validate(r) for r in rows], total=total)


@router.post("/units", response_model=PropertyUnitRead, status_code=status.HTTP_201_CREATED)
def create_unit(body: PropertyUnitCreate, db: Session = Depends(get_db)) -> PropertyUnitRead:
    if db.query(Block).filter(Block.id == body.block_id).first() is None:
        raise _not_found("Block")
    if db.query(UnitType).filter(UnitType.id == body.unit_type_id).first() is None:
        raise _not_found("Unit type")
    row = PropertyUnit(
        block_id=body.block_id,
        unit_type_id=body.unit_type_id,
        unit_number=body.unit_number,
        floor_number=body.floor_number,
        area_sqm=body.area_sqm,
        orientation=body.orientation,
        status=body.status,
    )
    db.add(row)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise _conflict("Could not create unit") from None
    db.refresh(row)
    return PropertyUnitRead.model_validate(row)


@router.get("/units/{unit_id}", response_model=PropertyUnitRead)
def get_unit(unit_id: UUID, db: Session = Depends(get_db)) -> PropertyUnitRead:
    row = db.query(PropertyUnit).filter(PropertyUnit.id == unit_id).first()
    if row is None:
        raise _not_found("Unit")
    return PropertyUnitRead.model_validate(row)


@router.patch("/units/{unit_id}", response_model=PropertyUnitRead)
def update_unit(
    unit_id: UUID,
    body: PropertyUnitUpdate,
    db: Session = Depends(get_db),
) -> PropertyUnitRead:
    row = db.query(PropertyUnit).filter(PropertyUnit.id == unit_id).first()
    if row is None:
        raise _not_found("Unit")
    data = body.model_dump(exclude_unset=True)
    if "unit_type_id" in data and data["unit_type_id"] is not None:
        if db.query(UnitType).filter(UnitType.id == data["unit_type_id"]).first() is None:
            raise _not_found("Unit type")
    for k, v in data.items():
        setattr(row, k, v)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise _conflict("Could not update unit") from None
    db.refresh(row)
    return PropertyUnitRead.model_validate(row)


@router.post("/units/{unit_id}/status", response_model=PropertyUnitRead)
def change_unit_status(
    unit_id: UUID,
    body: UnitStatusChange,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_active_user),
) -> PropertyUnitRead:
    row = db.query(PropertyUnit).filter(PropertyUnit.id == unit_id).first()
    if row is None:
        raise _not_found("Unit")
    hist = UnitStatusHistory(
        unit_id=row.id,
        user_id=admin.id,
        from_status=row.status,
        to_status=body.to_status,
        note=body.note,
    )
    row.status = body.to_status
    db.add(hist)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise _conflict("Could not update unit status") from None
    db.refresh(row)
    return PropertyUnitRead.model_validate(row)


@router.delete("/units/{unit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_unit(unit_id: UUID, db: Session = Depends(get_db)) -> None:
    row = db.query(PropertyUnit).filter(PropertyUnit.id == unit_id).first()
    if row is None:
        raise _not_found("Unit")
    db.delete(row)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise _conflict("Could not delete unit") from None


# --- Listings ---


@router.get("/listings", response_model=Paginated[PropertyListingRead])
def list_listings(
    db: Session = Depends(get_db),
    unit_id: UUID | None = None,
    is_public: bool | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
) -> Paginated[PropertyListingRead]:
    q = db.query(PropertyListing)
    if unit_id is not None:
        q = q.filter(PropertyListing.unit_id == unit_id)
    if is_public is not None:
        q = q.filter(PropertyListing.is_public.is_(is_public))
    total = q.count()
    rows = q.order_by(PropertyListing.title).offset(skip).limit(limit).all()
    return Paginated(items=[PropertyListingRead.model_validate(r) for r in rows], total=total)


@router.post("/listings", response_model=PropertyListingRead, status_code=status.HTTP_201_CREATED)
def create_listing(
    body: PropertyListingCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_active_user),
) -> PropertyListingRead:
    if db.query(PropertyUnit).filter(PropertyUnit.id == body.unit_id).first() is None:
        raise _not_found("Unit")
    if body.slug:
        slug = slugify(body.slug, max_length=480)
        if db.query(PropertyListing).filter(PropertyListing.slug == slug).first():
            raise _conflict("Listing slug already in use")
    else:
        slug = _allocate_listing_slug(db, body.title)
    row = PropertyListing(
        unit_id=body.unit_id,
        created_by_id=admin.id,
        title=body.title,
        slug=slug,
        description=body.description,
        city=body.city,
        area=body.area,
        is_featured=body.is_featured,
        is_public=body.is_public,
    )
    db.add(row)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise _conflict("Could not create listing") from None
    db.refresh(row)
    return PropertyListingRead.model_validate(row)


@router.get("/listings/{listing_id}", response_model=PropertyListingRead)
def get_listing(listing_id: UUID, db: Session = Depends(get_db)) -> PropertyListingRead:
    row = db.query(PropertyListing).filter(PropertyListing.id == listing_id).first()
    if row is None:
        raise _not_found("Listing")
    return PropertyListingRead.model_validate(row)


@router.patch("/listings/{listing_id}", response_model=PropertyListingRead)
def update_listing(
    listing_id: UUID,
    body: PropertyListingUpdate,
    db: Session = Depends(get_db),
) -> PropertyListingRead:
    row = db.query(PropertyListing).filter(PropertyListing.id == listing_id).first()
    if row is None:
        raise _not_found("Listing")
    data = body.model_dump(exclude_unset=True)
    if "slug" in data and data["slug"] is not None:
        data["slug"] = slugify(data["slug"], max_length=480)
        taken = (
            db.query(PropertyListing)
            .filter(PropertyListing.slug == data["slug"], PropertyListing.id != listing_id)
            .first()
        )
        if taken:
            raise _conflict("Listing slug already in use")
    for k, v in data.items():
        setattr(row, k, v)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise _conflict("Could not update listing") from None
    db.refresh(row)
    return PropertyListingRead.model_validate(row)


@router.delete("/listings/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_listing(listing_id: UUID, db: Session = Depends(get_db)) -> None:
    row = db.query(PropertyListing).filter(PropertyListing.id == listing_id).first()
    if row is None:
        raise _not_found("Listing")
    db.delete(row)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise _conflict("Could not delete listing") from None


@router.get("/listings/{listing_id}/images", response_model=list[PropertyImageRead])
def list_listing_images(listing_id: UUID, db: Session = Depends(get_db)) -> list[PropertyImageRead]:
    row = db.query(PropertyListing).filter(PropertyListing.id == listing_id).first()
    if row is None:
        raise _not_found("Listing")
    images = sorted(row.images, key=lambda i: (not i.is_primary, i.sort_order, i.id))
    return [PropertyImageRead.model_validate(i) for i in images]


@router.post(
    "/listings/{listing_id}/images",
    response_model=PropertyImageRead,
    status_code=status.HTTP_201_CREATED,
)
def add_listing_image(
    listing_id: UUID,
    body: PropertyImageCreate,
    db: Session = Depends(get_db),
) -> PropertyImageRead:
    row = db.query(PropertyListing).filter(PropertyListing.id == listing_id).first()
    if row is None:
        raise _not_found("Listing")
    if body.is_primary:
        for img in row.images:
            img.is_primary = False
    image = PropertyImage(
        listing_id=listing_id,
        url=body.url,
        public_id=body.public_id,
        sort_order=body.sort_order,
        is_primary=body.is_primary,
    )
    db.add(image)
    db.commit()
    db.refresh(image)
    return PropertyImageRead.model_validate(image)


@router.delete(
    "/listings/{listing_id}/images/{image_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_listing_image(
    listing_id: UUID,
    image_id: UUID,
    db: Session = Depends(get_db),
) -> None:
    image = (
        db.query(PropertyImage)
        .filter(PropertyImage.id == image_id, PropertyImage.listing_id == listing_id)
        .first()
    )
    if image is None:
        raise _not_found("Image")
    db.delete(image)
    db.commit()


# --- Location content ---


@router.get("/location-content", response_model=Paginated[LocationContentRead])
def list_location_content(
    db: Session = Depends(get_db),
    kind: str | None = Query(default=None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
) -> Paginated[LocationContentRead]:
    q = db.query(LocationContent)
    if kind in {"apartment", "shop"}:
        q = q.filter(LocationContent.kind == kind)
    total = q.count()
    rows = (
        q.order_by(LocationContent.kind, LocationContent.location_id)
        .offset(skip)
        .limit(limit)
        .all()
    )
    return Paginated(items=[LocationContentRead.model_validate(r) for r in rows], total=total)


@router.post(
    "/location-content",
    response_model=LocationContentRead,
    status_code=status.HTTP_201_CREATED,
)
def create_location_content(
    body: LocationContentCreate,
    db: Session = Depends(get_db),
) -> LocationContentRead:
    row = LocationContent(
        kind=body.kind,
        location_id=body.location_id,
        title=body.title,
        subtitle=body.subtitle,
        description=body.description,
        video_url=body.video_url,
        cards=[c.model_dump() for c in body.cards],
        is_public=body.is_public,
    )
    db.add(row)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise _conflict("Location content already exists for this location") from None
    db.refresh(row)
    return LocationContentRead.model_validate(row)


@router.patch("/location-content/{content_id}", response_model=LocationContentRead)
def update_location_content(
    content_id: UUID,
    body: LocationContentUpdate,
    db: Session = Depends(get_db),
) -> LocationContentRead:
    row = db.query(LocationContent).filter(LocationContent.id == content_id).first()
    if row is None:
        raise _not_found("Location content")
    data = body.model_dump(exclude_unset=True)
    if "cards" in data and data["cards"] is not None:
        data["cards"] = [c.model_dump() for c in body.cards or []]
    for k, v in data.items():
        setattr(row, k, v)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise _conflict("Could not update location content") from None
    db.refresh(row)
    return LocationContentRead.model_validate(row)


@router.delete("/location-content/{content_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_location_content(
    content_id: UUID,
    db: Session = Depends(get_db),
) -> None:
    row = db.query(LocationContent).filter(LocationContent.id == content_id).first()
    if row is None:
        raise _not_found("Location content")
    db.delete(row)
    db.commit()


@router.get("/location-content/{content_id}/media", response_model=list[LocationMediaRead])
def list_location_media(content_id: UUID, db: Session = Depends(get_db)) -> list[LocationMediaRead]:
    row = db.query(LocationContent).filter(LocationContent.id == content_id).first()
    if row is None:
        raise _not_found("Location content")
    media = sorted(row.media, key=lambda m: (not m.is_primary, m.sort_order, m.id))
    return [LocationMediaRead.model_validate(m) for m in media]


@router.post(
    "/location-content/{content_id}/media",
    response_model=LocationMediaRead,
    status_code=status.HTTP_201_CREATED,
)
def add_location_media(
    content_id: UUID,
    body: LocationMediaCreate,
    db: Session = Depends(get_db),
) -> LocationMediaRead:
    row = db.query(LocationContent).filter(LocationContent.id == content_id).first()
    if row is None:
        raise _not_found("Location content")
    if body.is_primary:
        for m in row.media:
            m.is_primary = False
    media = LocationMedia(
        location_content_id=content_id,
        url=body.url,
        media_type=body.media_type,
        caption=body.caption,
        sort_order=body.sort_order,
        is_primary=body.is_primary,
    )
    db.add(media)
    db.commit()
    db.refresh(media)
    return LocationMediaRead.model_validate(media)


@router.delete(
    "/location-content/{content_id}/media/{media_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_location_media(
    content_id: UUID,
    media_id: UUID,
    db: Session = Depends(get_db),
) -> None:
    row = (
        db.query(LocationMedia)
        .filter(
            LocationMedia.id == media_id,
            LocationMedia.location_content_id == content_id,
        )
        .first()
    )
    if row is None:
        raise _not_found("Location media")
    db.delete(row)
    db.commit()
