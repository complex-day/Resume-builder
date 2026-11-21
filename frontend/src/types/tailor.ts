import { MasterTruthVault } from "./vault";

export interface EligibilityConstraints {
  min_cgpa?: number | null;
  graduation_years: number[];
  max_age?: number | null;
  domicile_required?: string | null;
  other_notes: string[];
}

export interface DecodedJD {
  role_title: string;
  company_name?: string | null;
  role_level: "intern" | "fresher" | "junior" | "mid" | "senior" | "unknown";
  company_vibe: "startup" | "corporate" | "govt" | "unknown";
  detected_portal: string;
  must_have_skills: string[];
  nice_to_have_skills: string[];
  ats_keywords: string[];
  key_responsibilities: string[];
  eligibility_constraints: EligibilityConstraints;
}

export interface TailoredExperience {
  company: string;
  role: string;
  location?: string | null;
  start_date: string;
  end_date?: string | null;
  bullets: string[];
}

export interface TailoredProject {
  source_project_id: string;
  name: string;
  tech_stack: string[];
  repo_url?: string | null;
  live_url?: string | null;
  bullets: string[];
}

export interface TailoredSkillGroup {
  category_name: string;
  skills: string[];
}

export interface TailoredResume {
  target_role: string;
  professional_summary: string;
  selected_project_ids: string[];
  experience: TailoredExperience[];
  projects: TailoredProject[];
  skills: TailoredSkillGroup[];
  matched_ats_keywords: string[];
}

export interface ATSCritique {
  score: number;
  passed: boolean;
  matched_keywords: string[];
  missing_must_have_skills: string[];
  missing_ats_keywords: string[];
  actionable_feedback: string[];
  hallucination_flags: string[];
}

export interface PipelineRunRequest {
  user_id?: string | null;
  vault?: MasterTruthVault | null;
  raw_jd_text: string;
  source_url?: string | null;
}

export interface PipelineRunResponse {
  decoded_jd: DecodedJD;
  tailored_resume: TailoredResume;
  ats_critique: ATSCritique;
  attempts: number;
  status: "passed" | "best_effort_after_max_retries";
}

export interface EligibilityCheckResult {
  status: "eligible" | "review_required" | "ineligible";
  passed_checks: string[];
  failed_checks: string[];
  warnings: string[];
}

export interface ScreeningAnswer {
  question: string;
  answer: string;
}

export interface PortalApplicationPack {
  portal_category:
    | "internship_screening"
    | "startup_outreach"
    | "govt_apprenticeship"
    | "standard_corporate";
  detected_portal: string;
  eligibility: EligibilityCheckResult;
  screening_answers: ScreeningAnswer[];
  cold_email_subject?: string | null;
  cold_email_body?: string | null;
  linkedin_dm?: string | null;
  portal_tips: string[];
}

export interface PortalPackRequest {
  vault: MasterTruthVault;
  decoded_jd: DecodedJD;
  candidate_age?: number | null;
  candidate_domicile?: string | null;
}

export interface PDFGenerateRequest {
  vault: MasterTruthVault;
  tailored_resume: TailoredResume;
}
