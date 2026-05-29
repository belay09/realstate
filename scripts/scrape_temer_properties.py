#!/usr/bin/env python3
"""Scrape public Temer Properties pages via Yoast sitemaps + BeautifulSoup.

Requires: pip install beautifulsoup4 lxml

Outputs backend/data/temer_scraped.json
Run: python3 scripts/scrape_temer_properties.py
Then: python3 scripts/build_temer_production_from_scrape.py
"""

from __future__ import annotations

import argparse
import json
import re
import time
import xml.etree.ElementTree as ET
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from html import unescape
from pathlib import Path
from urllib.parse import urljoin
from urllib.request import Request, urlopen

from bs4 import BeautifulSoup

BASE = "https://temerproperties.com"
UA = "Mozilla/5.0 (compatible; BelayPropertiesResearch/2.0; +https://belayproperties.com)"
NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
ROOT = Path(__file__).resolve().parents[1]
OUT_JSON = ROOT / "backend" / "data" / "temer_scraped.json"
ETHIOPIA_LAT = (8.0, 10.5)
ETHIOPIA_LNG = (38.0, 40.5)

FEATURE_GROUP_KEYS = {
    "interior": "interior",
    "outdoor": "outdoor",
    "utilities": "utilities",
    "other features": "other",
    "others": "other",
}


def fetch(url: str, timeout: int = 45) -> str:
    req = Request(url, headers={"User-Agent": UA})
    with urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8", errors="replace")


def sitemap_locs(url: str) -> list[str]:
    xml = fetch(url)
    root = ET.fromstring(xml)
    return [el.text.strip() for el in root.findall(".//sm:loc", NS) if el.text]


def _chapter_to_group(chapter_title: str) -> str:
    t = chapter_title.lower().strip()
    for needle, key in FEATURE_GROUP_KEYS.items():
        if needle in t:
            return key
    return "other"


def parse_feature_groups(soup: BeautifulSoup) -> dict[str, list[str]]:
    groups: dict[str, list[str]] = {
        "interior": [],
        "outdoor": [],
        "utilities": [],
        "other": [],
    }
    for row in soup.select("[class*='feature_block_']"):
        chapter = row.select_one(".feature_chapter_name")
        if not chapter:
            continue
        key = _chapter_to_group(chapter.get_text(strip=True))
        for item in row.select(".listing_detail.col-md-4"):
            text = item.get_text(" ", strip=True)
            if text and text not in groups[key]:
                groups[key].append(text)
    return {k: v for k, v in groups.items() if v}


def parse_map_coords(html: str) -> dict[str, float] | None:
    block = re.search(r"property_map[\s\S]{0,12000}", html, re.I)
    chunk = block.group(0) if block else html
    for lat_s, lng_s in re.findall(
        r'"latitude"\s*:\s*"?([0-9.]+)"?\s*,\s*"longitude"\s*:\s*"?([0-9.]+)"?',
        chunk,
        re.I,
    ):
        lat, lng = float(lat_s), float(lng_s)
        if ETHIOPIA_LAT[0] <= lat <= ETHIOPIA_LAT[1] and ETHIOPIA_LNG[0] <= abs(lng) <= ETHIOPIA_LNG[1]:
            return {"latitude": lat, "longitude": lng}
    return None


def parse_details(soup: BeautifulSoup) -> dict[str, str]:
    details: dict[str, str] = {}
    for strong in soup.select("strong"):
        label = strong.get_text(strip=True).rstrip(":")
        if not label:
            continue
        parent = strong.parent
        if parent is None:
            continue
        full = parent.get_text(" ", strip=True)
        prefix = f"{label}:"
        value = full[len(prefix) :].strip() if full.startswith(prefix) else full.replace(label, "", 1).strip()
        if value:
            details[label] = unescape(value)
    return details


def parse_size_sqm(details: dict[str, str], og_desc: str | None) -> str | None:
    raw = details.get("Property Size") or details.get("Building Size") or ""
    m = re.search(r"([\d,]+(?:\.\d+)?)\s*m\s*²?", raw, re.I)
    if m:
        return m.group(1).replace(",", "")
    if og_desc:
        m = re.search(r"(\d+(?:\s*[–-]\s*\d+)?)\s*m\s*²", og_desc, re.I)
        if m:
            return m.group(1).replace(" ", "").split("–")[0].split("-")[0]
    return None


def gallery_images(soup: BeautifulSoup, html: str) -> list[str]:
    urls: list[str] = []
    for img in soup.select(
        ".houzez-photos-slider img, .property-gallery img, .lightbox-slider img, img.wp-post-image"
    ):
        src = img.get("data-src") or img.get("src") or ""
        if "wp-content/uploads" in src and "logo" not in src.lower():
            urls.append(urljoin(BASE, src))
    if not urls:
        urls = list(
            dict.fromkeys(
                u
                for u in re.findall(
                    r"(https://temerproperties\.com/wp-content/uploads/[^\"\s]+\.(?:jpg|jpeg|png|webp))",
                    html,
                    re.I,
                )
                if "logo" not in u.lower() and "36x36" not in u and "105x70" not in u
            )
        )
    return urls[:16]


def primary_area_slug(areas: list[str]) -> str | None:
    skip = {"apartment", "shops", "for-sale", "ethiopia", "addis-ababa"}
    for a in areas:
        if a in skip:
            continue
        if a == "sarbet" or a.endswith("-area"):
            return a
    for a in areas:
        if a not in skip:
            return a
    return None


def parse_property(url: str, html: str) -> dict:
    soup = BeautifulSoup(html, "lxml")
    title_tag = soup.find("title")
    title = re.sub(r"\s*\|.*$", "", title_tag.get_text(strip=True) if title_tag else "").strip()
    h1 = soup.find("h1")
    display_title = unescape(h1.get_text(strip=True) if h1 else title)

    details = parse_details(soup)
    meta = soup.find("meta", attrs={"name": "description"})
    meta_desc = meta.get("content") if meta else None
    og = soup.find("meta", property="og:description")
    og_desc = unescape(og["content"].replace("&#038;", "&")) if og and og.get("content") else None
    og_img_tag = soup.find("meta", property="og:image")
    og_image = og_img_tag["content"] if og_img_tag and og_img_tag.get("content") else None

    images = gallery_images(soup, html)
    if og_image and og_image not in images:
        images.insert(0, og_image)

    areas = list(
        dict.fromkeys(
            re.findall(r'href="https://temerproperties\.com/For-Sale/([^"/]+)/"', html)
            + re.findall(r'href="https://temerproperties\.com/property_area/([^"/]+)/"', html)
        )
    )
    categories = re.findall(
        r'href="https://temerproperties\.com/property_category/([^"/]+)/"',
        html,
    )
    feature_groups = parse_feature_groups(soup)
    features_flat = [f for group in feature_groups.values() for f in group]
    map_coords = parse_map_coords(html)

    size_sqm = parse_size_sqm(details, og_desc)
    if size_sqm and "Property Size" not in details:
        details["Property Size"] = f"{size_sqm} m²"

    slug = url.rstrip("/").split("/")[-1]
    beds = details.get("Bedrooms") or first_group(r"(\d+)\s*BD", html)
    baths = details.get("Bathrooms") or first_group(r"(\d+)\s*BA", html)

    is_shop = "shops" in areas or any("shop" in c for c in categories) or "shop" in display_title.lower()

    body_text = soup.get_text(" ", strip=True)
    desc_parts: list[str] = []
    for needle in ("The one-bedroom", "The two-bedroom", "The three-bedroom", "Located in", "This "):
        idx = body_text.find(needle)
        if idx >= 0:
            chunk = body_text[idx : idx + 600]
            if len(chunk) > 80:
                desc_parts.append(chunk.split("Features")[0].split("Map")[0].strip())
                break
    description = desc_parts[0] if desc_parts else (og_desc or meta_desc)

    return {
        "url": url,
        "slug": slug,
        "title": display_title,
        "page_title": unescape(title),
        "meta_description": meta_desc,
        "og_description": og_desc,
        "property_id": details.get("Property Id"),
        "bedrooms": beds,
        "bathrooms": baths,
        "property_size_sqm": size_sqm,
        "rooms": details.get("rooms") or details.get("Rooms"),
        "delivery_time": details.get("Delivery Time"),
        "parking_type": details.get("Parking Type"),
        "garage_size": details.get("Garage Size"),
        "location_label": details.get("Location"),
        "basement": details.get("Basement"),
        "building_size": details.get("Building Size"),
        "building_type": details.get("Building Type"),
        "category": details.get("Category"),
        "details": details,
        "features": features_flat,
        "feature_groups": feature_groups,
        "areas": areas,
        "area_slug": primary_area_slug(areas),
        "property_categories": list(dict.fromkeys(categories)),
        "is_commercial": is_shop,
        "description": description,
        "og_image": og_image,
        "images": images,
        "map": map_coords,
    }


def first_group(pattern: str, html: str, flags: int = re.I | re.S) -> str | None:
    m = re.search(pattern, html, flags)
    return m.group(1).strip() if m else None


def parse_page(url: str, html: str) -> dict:
    soup = BeautifulSoup(html, "lxml")
    title = soup.find("title")
    title_text = re.sub(r"\s*\|.*$", "", title.get_text(strip=True) if title else "")
    h1 = soup.find("h1")
    meta = soup.find("meta", attrs={"name": "description"})
    slug = url.rstrip("/").split("/")[-1]
    text = soup.get_text(" ", strip=True)
    images = gallery_images(soup, html)
    return {
        "url": url,
        "slug": slug,
        "title": unescape(h1.get_text(strip=True) if h1 else title_text),
        "meta_description": meta.get("content") if meta else None,
        "content_excerpt": text[:1200] if text else None,
        "images": images[:8],
    }


@dataclass
class ScrapeResult:
    scraped_at: str
    source: str
    company: dict
    sitemaps: dict
    areas: list[dict]
    pages: list[dict]
    blog_posts: list[dict]
    properties: list[dict]
    project_pages: list[dict]
    notes: list[str] = field(default_factory=list)


def _load_existing() -> dict | None:
    if OUT_JSON.is_file():
        return json.loads(OUT_JSON.read_text(encoding="utf-8"))
    return None


def main() -> None:
    parser = argparse.ArgumentParser(description="Scrape Temer Properties public site")
    parser.add_argument(
        "--properties-only",
        action="store_true",
        help="Only refresh estate_property listings (fast); keep pages/posts/areas from prior scrape.",
    )
    args = parser.parse_args()

    scraped_at = datetime.now(timezone.utc).isoformat()
    prior = _load_existing() if args.properties_only else None
    notes = [
        "WordPress REST API (/wp-json/) returns 403 — scrape uses Yoast sitemaps + BeautifulSoup.",
        "Features parsed from Houzez feature_block sections; map from property_map JSON when in Ethiopia bbox.",
        "Public listing pages rarely show ETB prices; confirm pricing with Temer sales.",
    ]

    property_urls = [
        u
        for u in sitemap_locs(f"{BASE}/estate_property-sitemap.xml")
        if u.rstrip("/") != f"{BASE}/apartment-for-sale"
    ]
    page_urls = sitemap_locs(f"{BASE}/page-sitemap.xml")
    post_urls = sitemap_locs(f"{BASE}/post-sitemap.xml")
    area_urls = sitemap_locs(f"{BASE}/property_area-sitemap.xml")

    properties: list[dict] = []
    for i, url in enumerate(property_urls):
        print(f"property [{i + 1}/{len(property_urls)}] {url}")
        try:
            html = fetch(url)
            properties.append(parse_property(url, html))
        except Exception as e:  # noqa: BLE001
            properties.append({"url": url, "error": str(e)})
        time.sleep(0.3)

    if prior and args.properties_only:
        pages = prior.get("pages", [])
        project_pages = prior.get("project_pages", [])
        blog_posts = prior.get("blog_posts", [])
        areas = prior.get("areas", [])
        company_data = prior.get("company")
    else:
        pages = []
        project_pages = []
        blog_posts = []
        areas = []
        company_data = None

    project_keywords = (
        "project",
        "aware",
        "ayat",
        "sarbet",
        "lycee",
        "gelan",
        "achante",
        "burat",
    )

    if not args.properties_only:
        for url in page_urls:
            if url.rstrip("/") == BASE:
                continue
            print(f"page {url}")
            try:
                html = fetch(url)
                row = parse_page(url, html)
                slug = row["slug"].lower()
                if any(k in slug for k in project_keywords) or slug.endswith("-project"):
                    project_pages.append(row)
                else:
                    pages.append(row)
            except Exception as e:  # noqa: BLE001
                pages.append({"url": url, "error": str(e)})
            time.sleep(0.2)

        for url in post_urls:
            print(f"post {url}")
            try:
                html = fetch(url)
                blog_posts.append(parse_page(url, html))
            except Exception as e:  # noqa: BLE001
                blog_posts.append({"url": url, "error": str(e)})
            time.sleep(0.2)

        for url in area_urls:
            try:
                html = fetch(url)
                areas.append(parse_page(url, html))
            except Exception as e:  # noqa: BLE001
                areas.append({"url": url, "error": str(e)})
            time.sleep(0.2)

    contact_url = f"{BASE}/contact-us-2/"
    if company_data is None:
        contact_html = fetch(contact_url)
        contact_text = BeautifulSoup(contact_html, "lxml").get_text(" ", strip=True)
    else:
        contact_text = company_data.get("positioning_excerpt")

    company = company_data or {
        "brand_name": "Temer Properties",
        "legal_name": "Temer Properties",
        "suggested_slug": "temer-properties",
        "website": BASE + "/",
        "address": "Sarbet to Kera Road, Woldemaryam Building, Addis Ababa, Ethiopia",
        "hotline": "6033",
        "phones": ["+251975666699", "+251939555558"],
        "email": "info@temerproperties.com",
        "logo_urls": [
            f"{BASE}/wp-content/uploads/2025/06/Temer-logo-png.png",
        ],
        "contact_page": contact_url,
        "about_page": f"{BASE}/about-us/",
        "tagline": "Make your next move with us",
        "positioning_excerpt": (contact_text or "")[:600] if contact_text else None,
    }

    ok = [p for p in properties if "error" not in p]
    with_features = sum(1 for p in ok if p.get("feature_groups"))
    with_map = sum(1 for p in ok if p.get("map"))
    notes.append(f"Parsed {len(ok)} properties; {with_features} with feature groups; {with_map} with map coords.")

    result = ScrapeResult(
        scraped_at=scraped_at,
        source=BASE,
        company=company,
        sitemaps={
            "properties_count": len(property_urls),
            "pages_count": len(page_urls),
            "posts_count": len(post_urls),
            "areas_count": len(area_urls),
        },
        areas=areas,
        pages=pages,
        blog_posts=blog_posts,
        properties=properties,
        project_pages=project_pages,
        notes=notes,
    )

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(asdict(result), indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {OUT_JSON} ({len(properties)} properties, {len(ok)} ok)")


if __name__ == "__main__":
    main()
