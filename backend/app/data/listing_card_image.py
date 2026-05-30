"""Pick listing images that work as browse-card thumbnails (not marketing flyers)."""

from __future__ import annotations

import re

_DIM_SUFFIX = re.compile(r"-\d+x\d+\.(jpe?g|png|webp)$", re.I)
_TEMPLATE_MARKETING = re.compile(r"/t-[a-z0-9_-]+\.(jpe?g|png|webp)$", re.I)
_NUMBERED_INTERIOR = re.compile(r"/\d{4}/\d{2}/\d+(?:-\d+)?\.(jpe?g|png|webp)$", re.I)

MIN_CARD_IMAGE_SCORE = 10

_INTERIOR_HINTS = (
    "livingroom",
    "kitchen",
    "bedroom",
    "interior",
    "modern",
    "hall",
    "dining",
)


def score_card_image_url(url: str) -> int:
    u = url.lower()
    score = 0
    if "-min" in u or "min.jpg" in u:
        score -= 25
    if "logo" in u or "banner" in u:
        score -= 20
    if "ayat-lomiyad" in u or "lomiyad" in u:
        score -= 15
    if "/photo_" in u:
        score -= 10
    if _TEMPLATE_MARKETING.search(u) or "cenetr" in u or "t-cenetr" in u:
        score -= 24
    if "-ads" in u or "goldmall" in u:
        score -= 14
    if re.search(r"/0\d{3}[-_]", u):
        score -= 10
    for hint in _INTERIOR_HINTS:
        if hint in u:
            score += 24
            break
    if _NUMBERED_INTERIOR.search(u):
        score += 18
    if "-1280x" in u or "-1920x" in u:
        score += 4
    if _DIM_SUFFIX.search(u) and "-1280" not in u:
        score -= 4
    return score


def is_card_image_usable(url: str | None) -> bool:
    if not url or not url.strip():
        return False
    return score_card_image_url(url) >= MIN_CARD_IMAGE_SCORE


def pick_best_card_image_url(urls: list[str]) -> str | None:
    if not urls:
        return None
    best = max(urls, key=score_card_image_url)
    if score_card_image_url(best) < MIN_CARD_IMAGE_SCORE:
        return None
    return best


def order_images_for_card(urls: list[str]) -> list[str]:
    if not urls:
        return []
    return sorted(urls, key=score_card_image_url, reverse=True)
