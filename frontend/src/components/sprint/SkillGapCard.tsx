"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, HelpCircle, ShieldCheck } from "lucide-react";
import { SkillGapSummary } from "@/types/sprint";

interface SkillGapCardProps {
  roleTitle: string;
  skillGap: SkillGapSummary;
}

export function SkillGapCard({ roleTitle, skillGap }: SkillGapCardProps) {
  const { existing_matching_skills, missing_must_have_skills, missing_nice_to_have_skills } =
    skillGap;

  return (
    <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-lg p-5 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">Skill gap breakdown</h3>
            <span className="text-xs font-mono text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
              {roleTitle}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Deterministic comparison against your Master Truth Vault facts.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-md">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Zero-hallucination analysis</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        {/* Verified Matching Skills */}
        <div className="bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-md p-3.5 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Verified in vault
            </span>
            <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md">
              {existing_matching_skills.length}
            </span>
          </div>
          <div className="flex-1">
            {existing_matching_skills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {existing_matching_skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-mono px-2 py-0.5 rounded-md bg-white dark:bg-zinc-900 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 dark:text-zinc-500 italic">No direct keyword overlap recorded.</p>
            )}
          </div>
        </div>

        {/* Missing Must-Have Skills */}
        <div className="bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-md p-3.5 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
              Missing must-have
            </span>
            <span className="text-xs font-mono text-red-700 dark:text-red-400 bg-red-100/60 dark:bg-red-950/60 px-1.5 py-0.5 rounded-md">
              {missing_must_have_skills.length}
            </span>
          </div>
          <div className="flex-1">
            {missing_must_have_skills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {missing_must_have_skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-mono px-2 py-0.5 rounded-md bg-white dark:bg-zinc-900 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-zinc-400 italic">
                Zero must-have skill gaps detected for this role.
              </p>
            )}
          </div>
        </div>

        {/* Missing Nice-to-Have Skills */}
        <div className="bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-md p-3.5 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
              Missing nice-to-have
            </span>
            <span className="text-xs font-mono text-slate-600 dark:text-zinc-400 bg-slate-200/60 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md">
              {missing_nice_to_have_skills.length}
            </span>
          </div>
          <div className="flex-1">
            {missing_nice_to_have_skills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {missing_nice_to_have_skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-mono px-2 py-0.5 rounded-md bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 dark:text-zinc-500 italic">No secondary skills missing.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
