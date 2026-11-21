"use client";

import React, { useState } from "react";
import { useUser } from "@/context/UserContext";
import { api } from "@/lib/api";
import { SkillSprintPlan } from "@/types/sprint";
import { DecodedJD } from "@/types/tailor";
import { SprintInputPanel } from "@/components/sprint/SprintInputPanel";
import { SkillGapCard } from "@/components/sprint/SkillGapCard";
import { MiniProjectCard } from "@/components/sprint/MiniProjectCard";
import { InterviewPrepSection } from "@/components/sprint/InterviewPrepSection";
import {
  Zap,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Code2,
  Layers,
  Terminal,
} from "lucide-react";
import Link from "next/link";

export default function SkillSprintPage() {
  const { userId } = useUser();

  const [sprintPlan, setSprintPlan] = useState<SkillSprintPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleGenerate = async (
    targetRole: string,
    rawJd: string,
    sourceUrl?: string
  ) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoadingStep("Loading Master Truth Vault facts...");

    try {
      // 1. Fetch active candidate Truth Vault
      const vault = await api.getVault(userId);

      // 2. Decode JD requirements
      setLoadingStep("Decoding job competencies and constraints...");
      let decodedJd: DecodedJD;
      try {
        decodedJd = await api.decodeJobDescription(rawJd, sourceUrl);
        if (targetRole && targetRole.trim()) {
          decodedJd.role_title = targetRole.trim();
        }
      } catch {
        // Fallback: minimal structured DecodedJD if decoder encounters network issues
        decodedJd = {
          role_title: targetRole.trim() || "Target Role",
          company_name: null,
          role_level: "mid",
          company_vibe: "startup",
          detected_portal: "unknown",
          must_have_skills: [],
          nice_to_have_skills: [],
          ats_keywords: [],
          key_responsibilities: [],
          eligibility_constraints: {
            graduation_years: [],
            other_notes: [],
          },
        };
      }

      // 3. Synthesize Skill Sprint Plan
      setLoadingStep("Synthesizing 48-hour build milestones & 10 interview questions...");
      const plan = await api.generateSkillSprint({
        vault,
        decoded_jd: decodedJd,
      });

      setSprintPlan(plan);
      setSuccessMessage(
        `48-Hour Sprint generated for ${plan.role_title} with ${plan.interview_questions.length} interview questions.`
      );
    } catch (err: any) {
      setErrorMessage(
        err?.message || "Failed to generate skill sprint. Ensure backend and Gemini API are reachable."
      );
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">48-Hr Skill Sprint</h1>
            <span className="text-xs font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
              Proof-of-work generator
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Identify missing JD skills and generate a weekend proof-of-work project with targeted interview prep.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Active profile:</span>
          <span className="text-xs font-mono font-medium text-slate-800 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
            {userId}
          </span>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3.5 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
          <div className="flex-1 text-xs text-red-800 leading-normal">{errorMessage}</div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-xs text-red-500 hover:text-red-700 ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3.5 flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          <div className="flex-1 text-xs text-emerald-800 leading-normal">{successMessage}</div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-xs text-emerald-600 hover:text-emerald-800 ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Input Section */}
      <SprintInputPanel
        onGenerate={handleGenerate}
        isLoading={isLoading}
        loadingStep={loadingStep}
      />

      {/* Results or Empty State */}
      {sprintPlan ? (
        <div className="space-y-6">
          {/* Section 1: Skill Gap */}
          <SkillGapCard
            roleTitle={sprintPlan.role_title}
            skillGap={sprintPlan.skill_gap}
          />

          {/* Section 2: Mini-Project Blueprint */}
          <MiniProjectCard
            miniProject={sprintPlan.mini_project}
            truthVaultReminder={sprintPlan.truth_vault_reminder}
          />

          {/* Section 3: 10 Interview Questions */}
          <InterviewPrepSection questions={sprintPlan.interview_questions} />
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white bg-blueprint-grid border border-slate-200 rounded-lg p-8">
          <div className="max-w-2xl">
            <h2 className="text-sm font-semibold text-slate-900 mb-1">
              How the 48-hour proof-of-work sprint works
            </h2>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              When target job descriptions require competencies not verified in your Truth Vault,
              this generator synthesizes a verifiable weekend build and 10 targeted interview responses.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="p-4 rounded-md border border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2 mb-2 text-slate-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-semibold">1. Deterministic gap</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Compares target JD requirements directly against facts in your Master Truth Vault without LLM fabrication.
                </p>
              </div>

              <div className="p-4 rounded-md border border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2 mb-2 text-slate-800">
                  <Code2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-semibold">2. Scoped weekend build</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Structures Saturday scaffolding and Sunday testing/deployment milestones for a standalone GitHub proof of concept.
                </p>
              </div>

              <div className="p-4 rounded-md border border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2 mb-2 text-slate-800">
                  <Terminal className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-semibold">3. Targeted interview guide</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Generates 10 sharp technical, system design, and behavioral questions with interviewer intent and answer templates.
                </p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5 flex items-center justify-between text-xs text-slate-500">
              <span>Wired live to FastAPI /api/v1/skill-sprint/generate</span>
              <Link
                href="/tailor"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-900 hover:text-emerald-700 transition-colors"
              >
                Go to Tailor Studio
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
