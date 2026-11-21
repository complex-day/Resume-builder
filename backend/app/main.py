"""FastAPI application entrypoint for the Multi-Agent ATS Resume Builder."""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.vault import router as vault_router
from app.api.pipeline import router as pipeline_router
from app.api.pdf import router as pdf_router
from app.api.portal_pack import router as portal_pack_router

app = FastAPI(
    title="Multi-Agent ATS Resume Builder API",
    description="Backend service orchestrating the 6-Step Multi-Agent ATS Resume Builder pipelines.",
    version="1.0.0",
)

# Load explicit CORS origins from environment (defaulting to local frontend ports)
cors_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
allowed_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]

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


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "resume-builder-api",
    }
