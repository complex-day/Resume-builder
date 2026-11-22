# Free-Tier Cloud Deployment Guide (₹0 / $0 Cost)

This guide walks you through deploying the complete **Multi-Agent ATS Resume Builder** stack across 100% Free Tier cloud providers:
- **Backend (`backend/`)**: [Render Free Web Service](https://render.com) (Docker Runtime)
- **Frontend (`frontend/`)**: [Vercel Hobby](https://vercel.com) (Next.js Edge/Serverless)
- **Chrome Extension (`extension/`)**: Built once, dynamically configured to live cloud backend via `chrome.storage.local`

---

## Architecture & Zero-Cost Tier Limits

| Component | Host / Platform | Free Tier Specifications & Quotas |
| :--- | :--- | :--- |
| **Backend** | Render Free Web Service | 512 MB RAM, 0.1 CPU, spins down after 15m inactivity, 750 free instance hours/month |
| **Frontend** | Vercel Hobby | Unlimited static deployments, 100 GB bandwidth, automatic SSL/TLS |
| **Extension** | Local Chrome Extension | Runs locally in browser, connects to Render Free URL via popup configuration |
| **LLM Engine**| Google Gemini Free Tier | Gemini 1.5 Flash / Flash Lite: 15 Requests Per Minute (RPM), 1M Tokens/min |

> [!NOTE]
> **Render Free Cold-Start Notice**:  
> Render Free web services spin down automatically after 15 minutes of inactivity. When a new request arrives, Render spins up the container, taking approximately **30 to 50 seconds** to complete its cold start. Once awake, subsequent requests respond immediately. The frontend includes a health check helper (`GET /health`) to detect backend readiness.

---

## Step 1: Deploy Backend to Render Free

You can deploy the backend using Render's Infrastructure-as-Code Blueprint (`render.yaml`) or manually via the Render dashboard.

### Option A: 1-Click Render Blueprint (Recommended)
1. Push your repository to GitHub.
2. In the [Render Dashboard](https://dashboard.render.com), click **New +** > **Blueprint**.
3. Connect your GitHub repository. Render reads `render.yaml` from the root and automatically detects the service:
   - **Service Name**: `resume-builder-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Docker` (`backend/Dockerfile`)
   - **Plan**: `Free`
   - **Health Check Path**: `/health`
4. Enter the required environment variables when prompted (see table below).
5. Click **Apply**. Render builds the Docker image and provisions the web service.

### Option B: Manual Web Service Setup
1. In Render Dashboard, click **New +** > **Web Service**.
2. Select **Build and deploy from a Git repository**.
3. Set the following configuration:
   - **Name**: `resume-builder-backend`
   - **Language**: `Docker`
   - **Root Directory**: `backend`
   - **Dockerfile Path**: `Dockerfile`
   - **Instance Type**: `Free`
   - **Health Check Path**: `/health`
4. Under **Environment Variables**, add the variables listed below.
5. Click **Create Web Service**.

### Backend Environment Variables

| Variable | Required | Value / Description | Example |
| :--- | :---: | :--- | :--- |
| `GEMINI_API_KEY` | **Yes** | Google AI Studio Gemini API Key | `AIzaSy...` |
| `GEMINI_MODEL` | No | Target Gemini model (default: `gemini-3.5-flash-lite`) | `gemini-3.5-flash-lite` |
| `CORS_ORIGINS` | **Yes** | Comma-separated list of allowed origins (Vercel URL + local dev) | `https://your-frontend.vercel.app,http://localhost:3000` |
| `RATE_LIMIT_ENABLED` | No | Enables per-IP protection against quota exhaustion (default: `true`) | `true` |
| `RATE_LIMIT_PER_MINUTE` | No | Maximum requests per minute per IP for LLM endpoints (default: `5`) | `5` |
| `GITHUB_TOKEN` | Optional | GitHub Personal Access Token to raise GitHub API rate limits (60/hr -> 5000/hr) | `ghp_...` |
| `BOT_WEBHOOK_SECRET` | Optional | Shared authentication secret for bot webhook endpoints | `your-secret-token` |

After deployment completes, note your public Render URL:
`https://resume-builder-backend.onrender.com`

Verify with a quick health check:
```bash
curl https://resume-builder-backend.onrender.com/health
# Expected output: {"status":"ok","service":"resume-builder-api"}
```

---

## Step 2: Deploy Frontend to Vercel Hobby

1. In the [Vercel Dashboard](https://vercel.com/new), click **Add New...** > **Project**.
2. Import your GitHub repository.
3. Configure the project:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: click **Edit** and select `frontend`
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
4. Under **Environment Variables**, add:
   - **Key**: `NEXT_PUBLIC_API_BASE_URL`
   - **Value**: `https://resume-builder-backend.onrender.com` (your live Render backend URL from Step 1)
5. Click **Deploy**. Vercel will build and deploy the Next.js frontend in under a minute.
6. Note your live frontend URL (e.g., `https://your-frontend.vercel.app`).

### Update Render CORS
Return to your Render backend service > **Environment** tab, and ensure `CORS_ORIGINS` includes your live Vercel URL:
```text
CORS_ORIGINS=https://your-frontend.vercel.app,http://localhost:3000,http://127.0.0.1:3000
```
Render will trigger an instant zero-downtime redeploy with the updated CORS origins.

---

## Step 3: Configure Chrome Extension for Production

The Chrome Extension (`extension/`) is engineered to work across local development and production cloud backends without needing to recompile or modify code:

1. Build the extension locally:
   ```bash
   cd extension
   npm run build
   ```
   The production-ready assets are emitted into `extension/dist/`.
2. Load the extension in Google Chrome:
   - Navigate to `chrome://extensions/`
   - Enable **Developer mode** (toggle in upper right).
   - Click **Load unpacked** and select the `extension/dist` folder.
3. Configure Production Backend URL:
   - Click the **Resumme Builder** extension icon in your Chrome toolbar.
   - Click **Config** in the popup footer (or the gear icon in the header).
   - Change **Backend URL** from `http://127.0.0.1:8000` to your live Render backend URL:
     ```text
     https://resume-builder-backend.onrender.com
     ```
   - Enter your **Truth Vault User ID** (e.g. `test-user` or your saved profile ID).
   - Click **Verify Vault** to test connection against the live cloud instance.
   - Click **Save & Apply**.
4. The extension will now route all DOM scraping, 3-Agent LangGraph synthesis, and ATS PDF generation through your live cloud backend.

---

## Step 4: Local Development & Free-Tier Guardrails

The repository maintains seamless dual-compatibility: zero config changes are needed to switch between cloud production and local development.

### Running Locally
```bash
# Terminal 1: Backend
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

# Terminal 2: Frontend
cd frontend
npm run dev
# Open http://localhost:3000
```

### Free-Tier Quota Protections
- **IP Rate Limiting**: LLM-heavy endpoints (`/api/v1/pipeline/run`, `/api/v1/portal-pack/generate`, `/api/v1/skill-sprint/generate`, `/api/v1/bot/webhook`) are governed by `slowapi` rate limiting set to `5/minute` per IP. This strictly prevents accidental exhaustion of Gemini Free Tier's 15 RPM quota.
- **Toggleable Rate Limiter**: Set `RATE_LIMIT_ENABLED=false` in local environments or during automated test runs to prevent test flakiness.
- **Security Headers**: Standard defense-in-depth headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`) are injected automatically on every response.
- **CORS Trailing Slash & Whitespace Sanitization**: Origins in `CORS_ORIGINS` are cleanly trimmed, while Chrome extension regex (`allow_origin_regex=r"^chrome-extension://.*$"`) ensures browser extensions can communicate reliably from any Chrome instance.
