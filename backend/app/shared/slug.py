import re
import secrets


def slugify(value: str, *, max_length: int = 240) -> str:
    s = value.lower().strip()
    s = re.sub(r"[^\w\s-]", "", s, flags=re.UNICODE)
    s = re.sub(r"[-\s]+", "-", s, flags=re.UNICODE).strip("-")
    if not s:
        s = "item"
    return s[:max_length]


def unique_slug_candidate(existing: set[str], base: str) -> str:
    if base not in existing:
        return base
    for _ in range(12):
        candidate = f"{base}-{secrets.token_hex(3)}"
        if candidate not in existing:
            return candidate
    return f"{base}-{secrets.token_hex(8)}"
