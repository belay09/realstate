
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.main import app
from app.models.company import Company
from app.models.inventory import PropertyUnit
from app.models.payment import PaymentPlan

client = TestClient(app)


def test_public_lead_submit(db_available: None) -> None:
    r = client.post(
        "/api/v1/public/leads",
        json={
            "name": "Test Buyer",
            "phone": "+251911111111",
            "email": "buyer@example.com",
            "message": "Interested in this home",
            "listing_slug": "ayat-hills-3br-floor-5",
            "source": "website",
        },
    )
    if r.status_code == 404:
        return  # demo seed not loaded
    assert r.status_code == 201
    assert r.json()["status"] == "new"


def test_full_quote_generate(db_available: None, admin_auth_headers: dict[str, str]) -> None:
    h = admin_auth_headers
    db: Session = SessionLocal()
    try:
        company = db.query(Company).filter(Company.slug == "ayat-real-estate").first()
        if company is None:
            return
        plan = (
            db.query(PaymentPlan)
            .filter(PaymentPlan.company_id == company.id, PaymentPlan.code == "full")
            .first()
        )
        unit = (
            db.query(PropertyUnit)
            .join(PropertyUnit.block)
            .filter(PropertyUnit.unit_number == "501")
            .first()
        )
        if plan is None or unit is None:
            return
        r = client.post(
            "/api/v1/admin/quotes/generate",
            headers=h,
            json={
                "unit_id": str(unit.id),
                "payment_plan_id": str(plan.id),
                "sales_channel": "default",
                "persist_quote": True,
            },
        )
        assert r.status_code == 200
        body = r.json()
        assert body["pricing"]["final_price"]
        assert body["quote"] is not None
        assert body["installment_schedule"] is not None
        assert body["commission"] is not None
    finally:
        db.close()


def test_payment_plan_list(db_available: None, admin_auth_headers: dict[str, str]) -> None:
    h = admin_auth_headers
    db = SessionLocal()
    try:
        company = db.query(Company).filter(Company.slug == "ayat-real-estate").first()
        if company is None:
            return
        r = client.get(
            "/api/v1/admin/payment-plans",
            headers=h,
            params={"company_id": str(company.id)},
        )
        assert r.status_code == 200
        if r.json()["total"] > 0:
            codes = {i["code"] for i in r.json()["items"]}
            assert "full" in codes or "60_40" in codes
    finally:
        db.close()
