"""Rate limiting configuration and utilities using slowapi.

Protects Gemini Free Tier quotas with configurable per-IP rate limits.
"""

import os
from starlette.requests import Request
from starlette.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded


def get_client_ip(request: Request) -> str:
    """Extract client IP, inspecting X-Forwarded-For if available behind a proxy (e.g. Render)."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        # First IP in comma-separated list is the original client
        return forwarded.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "127.0.0.1"


def is_rate_limit_exempt(request: Request) -> bool:
    """Check if rate limiting is disabled via RATE_LIMIT_ENABLED=false."""
    val = os.getenv("RATE_LIMIT_ENABLED", "true").lower().strip()
    return val in ("false", "0", "no", "off")


def get_rate_limit_str() -> str:
    """Retrieve per-minute rate limit string (default: 5/minute)."""
    per_minute = os.getenv("RATE_LIMIT_PER_MINUTE", "5").strip()
    try:
        limit_val = int(per_minute)
    except ValueError:
        limit_val = 5
    return f"{limit_val}/minute"


# Instantiate shared Limiter
limiter = Limiter(
    key_func=get_client_ip,
    default_limits=[],
)


def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """Clean JSON HTTP 429 response when rate limit is exceeded."""
    return JSONResponse(
        status_code=429,
        content={
            "detail": f"Rate limit exceeded: {exc.detail}. Please slow down.",
            "error": "rate_limit_exceeded",
        },
        headers={"Retry-After": str(exc.detail)},
    )
