"""Simple in-memory rate limiting for development/small deployments."""

from __future__ import annotations

import time
from collections import defaultdict

from fastapi import HTTPException, Request, status

_WINDOW_SECONDS = 60
_MAX_LOGIN_ATTEMPTS = 10
_attempts: dict[str, list[float]] = defaultdict(list)


def check_login_rate_limit(request: Request) -> None:
    key = request.client.host if request.client else "unknown"
    now = time.time()
    window_start = now - _WINDOW_SECONDS
    hits = [t for t in _attempts[key] if t >= window_start]
    if len(hits) >= _MAX_LOGIN_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "code": "RATE_LIMITED",
                "message": "Too many login attempts. Try again in a minute.",
            },
        )
    hits.append(now)
    _attempts[key] = hits
