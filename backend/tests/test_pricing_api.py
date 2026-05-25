from datetime import date
from decimal import Decimal

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.main import app
from app.models.company import Company
from app.models.inventory import Block, Project, PropertyUnit, UnitType
from app.models.pricing import PricingVersion

client = TestClient(app)


def test_pricing_calculate_requires_auth(db_available: None) -> None:
    r = client.post(
        "/api/v1/admin/pricing/calculate",
        json={"unit_id": "00000000-0000-0000-0000-000000000000"},
    )
    assert r.status_code == 401


def test_pricing_calculate_with_published_version(
    db_available: None,
    admin_auth_headers: dict[str, str],
) -> None:
    h = admin_auth_headers
    db: Session = SessionLocal()
    unit_id = None
    try:
        company = db.query(Company).filter(Company.slug == "ayat-real-estate").first()
        if company is None:
            return  # demo seed not run; skip

        unit = (
            db.query(PropertyUnit)
            .join(Block, PropertyUnit.block_id == Block.id)
            .join(Project, Block.project_id == Project.id)
            .join(UnitType, PropertyUnit.unit_type_id == UnitType.id)
            .filter(
                Project.company_id == company.id,
                PropertyUnit.unit_number == "501",
            )
            .first()
        )
        if unit is None:
            return
        unit_id = unit.id

        version = (
            db.query(PricingVersion)
            .filter(
                PricingVersion.company_id == company.id,
                PricingVersion.status == "published",
            )
            .first()
        )
        if version is None:
            return

        r = client.post(
            "/api/v1/admin/pricing/calculate",
            headers=h,
            json={"unit_id": str(unit_id), "as_of_date": date.today().isoformat()},
        )
        assert r.status_code == 200
        body = r.json()
        assert body["currency"] == "ETB"
        assert Decimal(body["final_price"]) > 0
        assert body["matched_row_id"] is not None

        r2 = client.post(
            "/api/v1/admin/pricing/calculate",
            headers=h,
            json={
                "unit_id": str(unit_id),
                "persist_quote": True,
            },
        )
        assert r2.status_code == 200
        assert "quote_id" in r2.json()["snapshot"]

        r3 = client.get("/api/v1/admin/pricing/quotes", headers=h, params={"unit_id": str(unit_id)})
        assert r3.status_code == 200
        assert r3.json()["total"] >= 1
    finally:
        db.close()


def test_publish_version_requires_rows(
    db_available: None,
    admin_auth_headers: dict[str, str],
) -> None:
    h = admin_auth_headers
    company = SessionLocal().query(Company).filter(Company.slug == "ayat-real-estate").first()
    if company is None:
        return
    r = client.post(
        "/api/v1/admin/pricing-versions",
        headers=h,
        json={
            "company_id": str(company.id),
            "name": "Empty draft for test",
            "effective_from": "2025-01-01",
        },
    )
    assert r.status_code == 201
    vid = r.json()["id"]
    r2 = client.post(f"/api/v1/admin/pricing-versions/{vid}/publish", headers=h)
    assert r2.status_code == 400
