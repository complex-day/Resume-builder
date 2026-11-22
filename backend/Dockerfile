# Lightweight Python 3.11 base image for Render Free Tier
FROM python:3.11-slim

# Prevent Python from writing .pyc files and enable unbuffered output for live cloud logs
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code and sample data fixtures
COPY app/ ./app
COPY sample_vault.json* ./

# Ensure data directories exist for local JSON vault and tracker file stores
RUN mkdir -p data/vaults data/applications

# Expose default HTTP port (Render injects $PORT at container runtime)
EXPOSE 8000

# Start Uvicorn bound to 0.0.0.0 and dynamic PORT (falling back to 8000 for local container testing)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
