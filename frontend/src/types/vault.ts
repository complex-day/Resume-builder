/**
 * TypeScript types strictly mapped to backend Pydantic schemas in `backend/app/schemas/truth_vault.py`.
 * Enforces zero-hallucination boundaries and prevents 422 Unprocessable Entity errors.
 */

export interface Basics {
  full_name: string;
  email: string;
  phone: string;
  location: string;
  linkedin_url?: string | null;
  github_username?: string | null;
  portfolio_url?: string | null;
  summary?: string | null;
}

export interface Education {
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date?: string | null;
  cgpa_or_percentage?: number | string | null;
  graduation_year?: number | null;
}

export interface Experience {
  company: string;
  role: string;
  location?: string | null;
  start_date: string;
  end_date?: string | null;
  is_current: boolean;
  highlights: string[];
  tech_stack: string[];
}

export interface Project {
  id: string;
  name: string;
  tagline?: string | null;
  description: string;
  highlights: string[];
  tech_stack: string[];
  repo_url?: string | null;
  live_url?: string | null;
  metrics: string[];
}

export interface SkillCategory {
  category_name: string;
  skills: string[];
}

export interface Certification {
  name: string;
  issuer: string;
  issue_date?: string | null;
  credential_url?: string | null;
}

export interface MasterTruthVault {
  version: string;
  updated_at?: string;
  basics: Basics;
  education: Education[];
  experience: Experience[];
  projects: Project[];
  skills: SkillCategory[];
  certifications: Certification[];
}

export function createEmptyVault(): MasterTruthVault {
  return {
    version: "1.0",
    updated_at: new Date().toISOString(),
    basics: {
      full_name: "",
      email: "",
      phone: "",
      location: "",
      linkedin_url: null,
      github_username: null,
      portfolio_url: null,
      summary: null,
    },
    education: [],
    experience: [],
    projects: [],
    skills: [
      { category_name: "Languages", skills: [] },
      { category_name: "Frameworks & Libraries", skills: [] },
      { category_name: "Databases & Caching", skills: [] },
      { category_name: "DevOps & Tools", skills: [] },
    ],
    certifications: [],
  };
}
