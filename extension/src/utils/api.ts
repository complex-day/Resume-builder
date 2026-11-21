/**
 * API service for communicating with FastAPI backend.
 * Handles Vault fetching, Pipeline execution, and ATS-proof PDF generation/download.
 */

export interface ExtensionSettings {
  backendUrl: string
  userId: string
}

export interface DecodedJD {
  role_title: string
  company_name?: string | null
  experience_level?: string | null
  min_years_experience?: number | null
  must_have_skills: string[]
  nice_to_have_skills: string[]
  ats_keywords: string[]
  key_responsibilities: string[]
}

export interface TailoredExperience {
  company: string
  role: string
  location?: string | null
  start_date: string
  end_date?: string | null
  bullets: string[]
}

export interface TailoredProject {
  source_project_id: string
  name: string
  tech_stack: string[]
  repo_url?: string | null
  live_url?: string | null
  bullets: string[]
}

export interface TailoredSkillGroup {
  category_name: string
  skills: string[]
}

export interface TailoredResume {
  target_role: string
  professional_summary: string
  selected_project_ids: string[]
  experience: TailoredExperience[]
  projects: TailoredProject[]
  skills: TailoredSkillGroup[]
  matched_ats_keywords: string[]
}

export interface ATSCritique {
  score: number
  passed: boolean
  matched_keywords: string[]
  missing_must_have_skills: string[]
  missing_ats_keywords: string[]
  actionable_feedback: string[]
  hallucination_flags: string[]
}

export interface PipelineRunResponse {
  decoded_jd: DecodedJD
  tailored_resume: TailoredResume
  ats_critique: ATSCritique
  attempts: number
  status: 'passed' | 'best_effort_after_max_retries'
}

const DEFAULT_BACKEND_URL = 'http://localhost:8000'
const DEFAULT_USER_ID = 'test-user'

/**
 * Retrieve saved configuration from chrome.storage.local.
 */
export async function getSettings(): Promise<ExtensionSettings> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
      resolve({ backendUrl: DEFAULT_BACKEND_URL, userId: DEFAULT_USER_ID })
      return
    }

    chrome.storage.local.get(['backendUrl', 'userId'], (res) => {
      resolve({
        backendUrl: (res.backendUrl as string) || DEFAULT_BACKEND_URL,
        userId: (res.userId as string) || DEFAULT_USER_ID,
      })
    })
  })
}

/**
 * Save configuration to chrome.storage.local.
 */
export async function saveSettings(settings: ExtensionSettings): Promise<void> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
      resolve()
      return
    }

    chrome.storage.local.set(settings, () => {
      resolve()
    })
  })
}

/**
 * Fetch candidate's Master Truth Vault to verify existence.
 */
export async function fetchUserVault(backendUrl: string, userId: string): Promise<any> {
  const cleanUrl = backendUrl.replace(/\/+$/, '')
  const resp = await fetch(`${cleanUrl}/api/v1/vault/${encodeURIComponent(userId)}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  })

  if (!resp.ok) {
    if (resp.status === 404) {
      throw new Error(`Master Truth Vault not found for user '${userId}'.`)
    }
    const text = await resp.text()
    throw new Error(`Vault API error (${resp.status}): ${text}`)
  }

  return await resp.json()
}

/**
 * Execute 3-Agent LangGraph resume synthesis pipeline.
 */
export async function runResumePipeline(
  backendUrl: string,
  userId: string,
  rawJdText: string,
  sourceUrl?: string
): Promise<PipelineRunResponse> {
  const cleanUrl = backendUrl.replace(/\/+$/, '')
  const payload = {
    user_id: userId,
    raw_jd_text: rawJdText,
    source_url: sourceUrl || undefined,
  }

  const resp = await fetch(`${cleanUrl}/api/v1/pipeline/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!resp.ok) {
    const errorBody = await resp.json().catch(() => null)
    const errorMsg = errorBody?.detail || (await resp.text()) || `HTTP ${resp.status}`
    throw new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg))
  }

  return (await resp.json()) as PipelineRunResponse
}

/**
 * Request ATS PDF generation and trigger 1-click browser download.
 */
export async function generateAndDownloadPDF(
  backendUrl: string,
  vault: any,
  tailoredResume: TailoredResume,
  filename: string = 'Tailored_ATS_Resume.pdf'
): Promise<void> {
  const cleanUrl = backendUrl.replace(/\/+$/, '')
  const resp = await fetch(`${cleanUrl}/api/v1/pdf/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/pdf',
    },
    body: JSON.stringify({
      vault,
      tailored_resume: tailoredResume,
    }),
  })

  if (!resp.ok) {
    const errorBody = await resp.json().catch(() => null)
    const errorMsg = errorBody?.detail || (await resp.text()) || `HTTP ${resp.status}`
    throw new Error(`PDF Generation failed: ${errorMsg}`)
  }

  const blob = await resp.blob()
  const blobUrl = window.URL.createObjectURL(blob)

  // Trigger instant download via temporary DOM anchor
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Revoke object URL after short delay
  setTimeout(() => {
    window.URL.revokeObjectURL(blobUrl)
  }, 10000)
}
