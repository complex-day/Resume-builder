import { MasterTruthVault } from "./vault";
import { DecodedJD } from "./tailor";

export interface SkillGapSummary {
  existing_matching_skills: string[];
  missing_must_have_skills: string[];
  missing_nice_to_have_skills: string[];
}

export interface WeekendMiniProject {
  title: string;
  target_skills: string[];
  problem_statement: string;
  tech_stack: string[];
  day_1_milestones: string[];
  day_2_milestones: string[];
  post_completion_resume_bullet_template: string;
}

export type InterviewQuestionCategory =
  | "technical"
  | "system_design"
  | "project_deep_dive"
  | "behavioral";

export interface TargetedInterviewQuestion {
  question: string;
  category: InterviewQuestionCategory;
  why_asked: string;
  crisp_answer_guide: string;
}

export interface SkillSprintPlan {
  role_title: string;
  skill_gap: SkillGapSummary;
  mini_project: WeekendMiniProject;
  interview_questions: TargetedInterviewQuestion[];
  truth_vault_reminder: string;
}

export interface SkillSprintRequest {
  vault: MasterTruthVault;
  decoded_jd: DecodedJD;
}
