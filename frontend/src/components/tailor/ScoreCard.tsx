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
  const score = Math.max(0, Math.min(100, Math.round(critique.score)));

  // Semicircle arc math: radius 46, circumference ~ 289.0, semicircle arc = pi * r = 144.5
  const arcRadius = 46;
  const arcLength = Math.PI * arcRadius; // ~ 144.51
  const strokeDashoffset = arcLength - (score / 100) * arcLength;

  // Arc stroke color: emerald (>= 85), amber (65-84), red (< 65)
  const strokeColor =
    score >= 85 ? "#059669" : score >= 65 ? "#D97706" : "#DC2626";

  return (
    <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-lg p-5 mb-5 space-y-4 transition-colors">
      {/* Top Header: Score & Status with Semicircular Gauge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-zinc-800">
        <div className="flex items-center gap-4">
          {/* Semicircular ATS Score Gauge */}
          <div className="relative w-28 h-16 shrink-0 flex items-end justify-center select-none">
            <svg
              viewBox="0 0 120 70"
              className="w-full h-full overflow-visible"
              aria-hidden="true"
            >
              {/* Background Arc */}
              <path
                d="M 14,60 A 46,46 0 0,1 106,60"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                className="text-slate-200 dark:text-zinc-800"
              />
              {/* Foreground Meter Arc */}
              <path
                d="M 14,60 A 46,46 0 0,1 106,60"
                fill="none"
                stroke={strokeColor}
                strokeWidth="8"
                strokeDasharray={arcLength}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-0.5">
              <span
                className="text-xl font-bold font-mono tabular-nums leading-none"
                style={{ color: strokeColor }}
              >
                {score}
              </span>
              <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 mt-0.5 leading-none">
                ATS score
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                  isPassed
                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                    : "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                }`}
              >
                {isPassed ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Passed (≥ 85)</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span>Best effort</span>
                  </>
                )}
              </span>

              <span className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
                Attempt {attempts} of 3
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              Evaluated strictly against target JD keywords and schema constraints
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 shrink-0">
          <Award className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
          <span>ATS Critic Assessment</span>
        </div>
      </div>

      {/* Hallucination Warning Flags (if any) */}
      {critique.hallucination_flags.length > 0 && (
        <div className="p-3 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-rose-900 dark:text-rose-100">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
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
          <span className="text-xs font-medium text-slate-700 dark:text-zinc-300 block mb-1.5">
            Verified matched keywords ({critique.matched_keywords.length})
          </span>
          <div className="flex flex-wrap gap-1.5">
            {critique.matched_keywords.map((kw) => (
              <span
                key={kw}
                className="text-xs font-medium px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-mono"
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
          <span className="text-xs font-medium text-amber-900 dark:text-amber-200 block mb-1.5 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Missing required skills (unverified in vault)
          </span>
          <div className="flex flex-wrap gap-1.5">
            {critique.missing_must_have_skills.map((skill) => (
              <span
                key={skill}
                className="text-xs font-medium px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 font-mono"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actionable Feedback */}
      {critique.actionable_feedback.length > 0 && (
        <div className="pt-2 border-t border-slate-100 dark:border-zinc-800">
          <span className="text-xs font-medium text-slate-700 dark:text-zinc-300 block mb-1">
            Critic suggestions
          </span>
          <div className="space-y-1">
            {critique.actionable_feedback.map((item, idx) => (
              <p key={idx} className="text-xs text-slate-600 dark:text-zinc-400 flex items-start gap-1.5">
                <span className="text-slate-400 dark:text-zinc-500">•</span>
                <span>{item}</span>
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
