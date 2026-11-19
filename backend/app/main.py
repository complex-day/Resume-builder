"""FastAPI application entrypoint for the Multi-Agent ATS Resume Builder."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.vault import router as vault_router

app = FastAPI(
    title="Multi-Agent ATS Resume Builder API",
    description="Backend service orchestrating the 6-Step Multi-Agent ATS Resume Builder pipelines.",
    version="1.0.0",
)

# Enable CORS for Next.js frontend and Chrome extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(vault_router)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "resume-builder-api",
    }
