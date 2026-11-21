"use client";

import React from "react";
import { ATSCritique } from "@/types/tailor";
import { CheckCircle2, AlertTriangle, ShieldAlert, Award } from "lucide-react";

interface ScoreCardProps {
  critique: ATSCritique;
  attempts: number;
  status: "passed" | "best_effort_after_max_retries";
}

export function ScoreCard({ critique, attempts, status }: ScoreCardProps) {
  const isPassed = critique.passed || status === "passed" || critique.score >= 85;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 mb-5 space-y-4">
      {/* Top Header: Score & Status */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="flex items-baseline gap-1">
            <span
              className={`text-2xl font-bold font-mono tabular-nums ${
                isPassed ? "text-emerald-700" : "text-amber-700"
              }`}
            >
              {critique.score}
            </span>
            <span className="text-xs font-mono text-slate-400">/ 100</span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                isPassed
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-amber-50 text-amber-800 border-amber-200"
              }`}
            >
              {isPassed ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Passed (≥ 85)</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  <span>Best effort</span>
                </>
              )}
            </span>

            <span className="text-xs text-slate-500 font-mono">
              Attempt {attempts} of 3
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Award className="w-3.5 h-3.5 text-slate-400" />
          <span>ATS Critic Assessment</span>
        </div>
      </div>

      {/* Hallucination Warning Flags (if any) */}
      {critique.hallucination_flags.length > 0 && (
        <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-rose-900">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>Zero-hallucination alerts flagged</span>
          </div>
          {critique.hallucination_flags.map((flag, idx) => (
            <p key={idx} className="text-xs pl-5">
              &bull; {flag}
            </p>
          ))}
        </div>
      )}

      {/* Matched Keywords */}
      {critique.matched_keywords.length > 0 && (
        <div>
          <span className="text-xs font-medium text-slate-700 block mb-1.5">
            Verified matched keywords ({critique.matched_keywords.length})
          </span>
          <div className="flex flex-wrap gap-1.5">
            {critique.matched_keywords.map((kw) => (
              <span
                key={kw}
                className="text-xs font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Missing Must-Have Skills (Honest Gap Disclosure) */}
      {critique.missing_must_have_skills.length > 0 && (
        <div>
          <span className="text-xs font-medium text-amber-900 block mb-1.5 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-600" /> Missing required skills (unverified in vault)
          </span>
          <div className="flex flex-wrap gap-1.5">
            {critique.missing_must_have_skills.map((skill) => (
              <span
                key={skill}
                className="text-xs font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-mono"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actionable Feedback */}
      {critique.actionable_feedback.length > 0 && (
        <div className="pt-2 border-t border-slate-100">
          <span className="text-xs font-medium text-slate-700 block mb-1">
            Critic suggestions
          </span>
          <div className="space-y-1">
            {critique.actionable_feedback.map((item, idx) => (
              <p key={idx} className="text-xs text-slate-600 flex items-start gap-1.5">
                <span className="text-slate-400">•</span>
                <span>{item}</span>
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
