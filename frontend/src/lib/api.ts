import { MasterTruthVault } from "@/types/vault";
import {
  PipelineRunRequest,
  PipelineRunResponse,
  PDFGenerateRequest,
  PortalPackRequest,
  PortalApplicationPack,
  DecodedJD,
} from "@/types/tailor";
import {
  ApplicationRecord,
  ApplicationCreateRequest,
  ApplicationStatusUpdateRequest,
  TrackerAnalyticsResponse,
} from "@/types/tracker";
import { SkillSprintRequest, SkillSprintPlan } from "@/types/sprint";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";

export interface SaveVaultResponse {
  status: string;
  user_id: string;
  updated_at: string;
  project_count: number;
  vault: MasterTruthVault;
}

export interface SyncGitHubResponse {
  status: string;
  user_id: string;
  username: string;
  total_projects: number;
  newly_added_count: number;
  project_ids: string[];
  skipped_project_ids: string[];
}

export interface ApiError {
  message: string;
  status?: number;
  detail?: any;
}

/**
 * Universal fetch wrapper enforcing single-read `await res.text()` error handling
 * so response streams are never double-read.
 */
async function fetchClient<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options?.headers,
    },
  });

  // Single-read response text to safely handle JSON or text errors
  const rawText = await response.text();
  let parsedData: any = null;

  if (rawText) {
    try {
      parsedData = JSON.parse(rawText);
    } catch {
      parsedData = rawText;
    }
  }

  if (!response.ok) {
    let errorMessage = `HTTP error ${response.status}`;
    if (parsedData && typeof parsedData === "object") {
      if (typeof parsedData.detail === "string") {
        errorMessage = parsedData.detail;
      } else if (Array.isArray(parsedData.detail)) {
        errorMessage = parsedData.detail.map((d: any) => d.msg || JSON.stringify(d)).join(", ");
      } else if (parsedData.message) {
        errorMessage = parsedData.message;
      }
    } else if (typeof parsedData === "string" && parsedData.trim()) {
      errorMessage = parsedData;
    } else if (response.statusText) {
      errorMessage = response.statusText;
    }

    const error = new Error(errorMessage) as Error & ApiError;
    error.status = response.status;
    error.detail = parsedData;
    throw error;
  }

  return parsedData as T;
}

export const api = {
  /**
   * Retrieve the saved MasterTruthVault for a specific user.
   */
  async getVault(userId: string): Promise<MasterTruthVault> {
    return fetchClient<MasterTruthVault>(`/api/v1/vault/${encodeURIComponent(userId)}`, {
      method: "GET",
    });
  },

  /**
   * Persist or update a validated MasterTruthVault for a specific user.
   */
  async saveVault(userId: string, vault: MasterTruthVault): Promise<SaveVaultResponse> {
    return fetchClient<SaveVaultResponse>(`/api/v1/vault/${encodeURIComponent(userId)}`, {
      method: "PUT",
      body: JSON.stringify(vault),
    });
  },

  /**
   * 1-Click GitHub Auto-Import & Merge into Master Truth Vault.
   */
  async syncGitHub(
    userId: string,
    username: string,
    maxRepos: number = 6
  ): Promise<SyncGitHubResponse> {
    return fetchClient<SyncGitHubResponse>(
      `/api/v1/vault/${encodeURIComponent(userId)}/sync-github/${encodeURIComponent(username)}?max_repos=${maxRepos}`,
      {
        method: "POST",
      }
    );
  },

  /**
   * Execute the full 3-Agent LangGraph orchestration pipeline with automated retry loop.
   */
  async runResumePipeline(request: PipelineRunRequest): Promise<PipelineRunResponse> {
    return fetchClient<PipelineRunResponse>("/api/v1/pipeline/run", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },

  /**
   * Generate and download an ATS-proof single-column PDF resume.
   * Uses single-read error handling, reading res.blob() only when res.ok is true.
   */
  async downloadTailoredPdf(
    request: PDFGenerateRequest,
    defaultFilename: string = "tailored_resume.pdf"
  ): Promise<void> {
    const url = `${API_BASE_URL}/api/v1/pdf/generate`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const rawText = await response.text();
      let errorMessage = `PDF generation failed (${response.status})`;
      if (rawText) {
        try {
          const parsed = JSON.parse(rawText);
          errorMessage = parsed.detail || parsed.message || rawText;
        } catch {
          errorMessage = rawText;
        }
      }
      throw new Error(errorMessage);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = defaultFilename.endsWith(".pdf") ? defaultFilename : `${defaultFilename}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },

  /**
   * Generate portal-specific application collateral and eligibility checks.
   */
  async generatePortalPack(request: PortalPackRequest): Promise<PortalApplicationPack> {
    return fetchClient<PortalApplicationPack>("/api/v1/portal-pack/generate", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },

  /**
   * List all tracked applications for a user, optionally filtered by status.
   */
  async listApplications(userId: string, status?: string): Promise<ApplicationRecord[]> {
    const query = status && status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
    return fetchClient<ApplicationRecord[]>(
      `/api/v1/tracker/${encodeURIComponent(userId)}/applications${query}`,
      { method: "GET" }
    );
  },

  /**
   * Log a newly tailored job application.
   */
  async createApplication(request: ApplicationCreateRequest): Promise<ApplicationRecord> {
    return fetchClient<ApplicationRecord>("/api/v1/tracker/applications", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },

  /**
   * Update status and optional notes for an application.
   */
  async updateApplicationStatus(
    userId: string,
    applicationId: string,
    update: ApplicationStatusUpdateRequest
  ): Promise<ApplicationRecord> {
    return fetchClient<ApplicationRecord>(
      `/api/v1/tracker/${encodeURIComponent(userId)}/applications/${encodeURIComponent(applicationId)}`,
      {
        method: "PATCH",
        body: JSON.stringify(update),
      }
    );
  },

  /**
   * Delete an application record.
   */
  async deleteApplication(
    userId: string,
    applicationId: string
  ): Promise<{ status: string; application_id: string }> {
    return fetchClient<{ status: string; application_id: string }>(
      `/api/v1/tracker/${encodeURIComponent(userId)}/applications/${encodeURIComponent(applicationId)}`,
      { method: "DELETE" }
    );
  },

  /**
   * Fetch callback analytics, style rankings, and self-learning feedback insights.
   */
  async getTrackerAnalytics(userId: string): Promise<TrackerAnalyticsResponse> {
    return fetchClient<TrackerAnalyticsResponse>(
      `/api/v1/tracker/${encodeURIComponent(userId)}/analytics`,
      { method: "GET" }
    );
  },

  /**
   * Decode a raw job description into structured ATS keywords, skills, and constraints.
   */
  async decodeJobDescription(rawJdText: string, sourceUrl?: string | null): Promise<DecodedJD> {
    return fetchClient<DecodedJD>("/api/v1/pipeline/decode-jd", {
      method: "POST",
      body: JSON.stringify({ raw_jd_text: rawJdText, source_url: sourceUrl || null }),
    });
  },

  /**
   * Deterministically analyze skill gaps and generate a 48-Hour Proof-of-Work project and interview prep.
   */
  async generateSkillSprint(request: SkillSprintRequest): Promise<SkillSprintPlan> {
    return fetchClient<SkillSprintPlan>("/api/v1/skill-sprint/generate", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },

  /**
   * Lightweight health-check helper for live backend status indication.
   */
  async checkHealth(): Promise<boolean> {
    try {
      await fetchClient<{ status: string }>("/health", { method: "GET" });
      return true;
    } catch {
      return false;
    }
  },
};
