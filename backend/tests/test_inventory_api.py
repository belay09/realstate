import uuid

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_admin_inventory_requires_auth(db_available: None) -> None:
    r = client.get("/api/v1/admin/companies")
    assert r.status_code == 401


def test_inventory_chain_and_public_listings(
    db_available: None,
    admin_auth_headers: dict[str, str],
) -> None:
    h = admin_auth_headers
    suf = uuid.uuid4().hex[:10]
    company_id = None
    try:
        r = client.post(
            "/api/v1/admin/companies",
            headers=h,
            json={"name": f"Test Co {suf}", "is_active": True},
        )
        assert r.status_code == 201
        company_id = r.json()["id"]
        company_slug = r.json()["slug"]

        r = client.post(
            "/api/v1/admin/projects",
            headers=h,
            json={
                "company_id": company_id,
                "name": f"Ayar Tower {suf}",
                "city": "Addis Ababa",
                "area": "Ayat",
                "status": "active",
            },
        )
        assert r.status_code == 201
        project_id = r.json()["id"]

        r = client.post(
            "/api/v1/admin/blocks",
            headers=h,
            json={"project_id": project_id, "name": f"Block A {suf}"},
        )
        assert r.status_code == 201
        block_id = r.json()["id"]

        r = client.post(
            "/api/v1/admin/unit-types",
            headers=h,
            json={
                "company_id": company_id,
                "code": f"T3-{suf}",
                "name": "Three bedroom",
                "category": "residential",
                "bedrooms": 3,
            },
        )
        assert r.status_code == 201
        unit_type_id = r.json()["id"]

        r = client.post(
            "/api/v1/admin/units",
            headers=h,
            json={
                "block_id": block_id,
                "unit_type_id": unit_type_id,
                "unit_number": "101",
                "status": "draft",
            },
        )
        assert r.status_code == 201
        unit_id = r.json()["id"]

        r = client.post(
            f"/api/v1/admin/units/{unit_id}/status",
            headers=h,
            json={"to_status": "available"},
        )
        assert r.status_code == 200

        r = client.post(
            "/api/v1/admin/listings",
            headers=h,
            json={
                "unit_id": unit_id,
                "title": f"Bright corner unit {suf}",
                "description": "Test listing",
                "city": "Addis Ababa",
                "area": "Ayat",
                "is_public": True,
            },
        )
        assert r.status_code == 201
        listing_slug = r.json()["slug"]

        r = client.get("/api/v1/public/listings")
        assert r.status_code == 200
        body = r.json()
        assert body["total"] >= 1
        slugs = {item["slug"] for item in body["items"]}
        assert listing_slug in slugs

        r = client.get(f"/api/v1/public/listings/{listing_slug}")
        assert r.status_code == 200
        detail = r.json()
        assert detail["slug"] == listing_slug
        assert detail["unit_status"] == "available"
        assert detail["company_slug"] == company_slug

        r = client.get(
            "/api/v1/public/listings",
            params={"bedrooms": 3, "company_slug": company_slug},
        )
        assert r.status_code == 200
        assert listing_slug in {x["slug"] for x in r.json()["items"]}

        r = client.post(
            f"/api/v1/admin/units/{unit_id}/status",
            headers=h,
            json={"to_status": "sold", "note": "test sale"},
        )
        assert r.status_code == 200

        r = client.get("/api/v1/public/listings", params={"company_slug": company_slug})
        assert r.status_code == 200
        assert listing_slug not in {x["slug"] for x in r.json()["items"]}

        r = client.get(f"/api/v1/public/listings/{listing_slug}")
        assert r.status_code == 404
    finally:
        if company_id is not None:
            client.delete(f"/api/v1/admin/companies/{company_id}", headers=h)
