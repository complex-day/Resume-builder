"""FastAPI application entrypoint for the Multi-Agent ATS Resume Builder."""

import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded

from app.limiter import limiter, rate_limit_exceeded_handler
from app.api.vault import router as vault_router
from app.api.pipeline import router as pipeline_router
from app.api.pdf import router as pdf_router
from app.api.portal_pack import router as portal_pack_router
from app.api.skill_sprint import router as skill_sprint_router
from app.api.tracker import router as tracker_router
from app.api.bot import router as bot_router

app = FastAPI(
    title="Multi-Agent ATS Resume Builder API",
    description="Backend service orchestrating the 6-Step Multi-Agent ATS Resume Builder pipelines.",
    version="1.0.0",
)

# Attach rate limiter to app state and register 429 exception handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)


# Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Inject standard security headers to protect against clickjacking, sniffing, and referrer leaks."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


# Load explicit CORS origins from environment (defaulting to local frontend ports)
cors_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
allowed_origins = [
    origin.strip().rstrip("/")
    for origin in cors_origins_env.split(",")
    if origin.strip().rstrip("/")
]

# Configure CORS: explicit origins for web + regex for Chrome extensions (WC-1)
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^chrome-extension://.*$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(vault_router)
app.include_router(pipeline_router)
app.include_router(pdf_router)
app.include_router(portal_pack_router)
app.include_router(skill_sprint_router)
app.include_router(tracker_router)
app.include_router(bot_router)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "resume-builder-api",
    }
