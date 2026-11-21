export type ApplicationStatus =
  | "saved"
  | "applied"
  | "shortlisted"
  | "interview"
  | "rejected"
  | "offer";

export type ResumeStyleTag =
  | "metrics_heavy"
  | "project_first"
  | "skills_first"
  | "concise_startup"
  | "formal_govt";

export interface ApplicationCreateRequest {
  user_id: string;
  company_name: string;
  role_title: string;
  detected_portal: string;
  source_url?: string | null;
  ats_score: number;
  style_tag: ResumeStyleTag;
  selected_project_ids: string[];
  status: ApplicationStatus;
  notes?: string | null;
}

export interface ApplicationRecord extends ApplicationCreateRequest {
  application_id: string;
  created_at: string;
  updated_at: string;
}

export interface ApplicationStatusUpdateRequest {
  status: ApplicationStatus;
  notes?: string | null;
}

export interface StylePerformanceMetric {
  style_tag: ResumeStyleTag;
  total_applications: number;
  positive_callbacks: number;
  callback_rate_pct: number;
  avg_ats_score: number;
}

export interface TrackerAnalyticsResponse {
  user_id: string;
  total_applications: number;
  status_breakdown: Record<string, number>;
  portal_breakdown: Record<string, number>;
  overall_callback_rate_pct: number;
  avg_ats_score: number;
  style_performance: StylePerformanceMetric[];
  recommended_style_tag?: ResumeStyleTag | null;
  feedback_insights: string[];
}
