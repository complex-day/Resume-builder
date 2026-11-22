"use client";

import React, { useState } from "react";
import {
  Calendar,
  Layers,
  Copy,
  Check,
  AlertTriangle,
  Github,
  CheckSquare,
} from "lucide-react";
import { WeekendMiniProject } from "@/types/sprint";

interface MiniProjectCardProps {
  miniProject: WeekendMiniProject;
  truthVaultReminder: string;
}

export function MiniProjectCard({
  miniProject,
  truthVaultReminder,
}: MiniProjectCardProps) {
  const [copiedBullet, setCopiedBullet] = useState(false);

  const handleCopyBullet = async () => {
    try {
      await navigator.clipboard.writeText(
        miniProject.post_completion_resume_bullet_template
      );
      setCopiedBullet(true);
      setTimeout(() => setCopiedBullet(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-lg p-5 space-y-6 transition-colors">
      {/* Title & Core Stack Header */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Weekend proof of work
            </span>
            <span className="text-xs text-slate-500 dark:text-zinc-400">48-hour build target</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {miniProject.tech_stack.map((tech, idx) => (
              <span
                key={idx}
                className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">{miniProject.title}</h3>
        <p className="text-xs text-slate-600 dark:text-zinc-300 mt-2 leading-relaxed bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-md p-3">
          <span className="font-semibold text-slate-800 dark:text-zinc-200">Problem statement: </span>
          {miniProject.problem_statement}
        </p>
      </div>

      {/* Target Skills Addressed */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Layers className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
          <h4 className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
            Competencies demonstrated
          </h4>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {miniProject.target_skills.map((skill, idx) => (
            <span
              key={idx}
              className="text-xs font-mono px-2.5 py-1 rounded-md bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 border border-slate-300 dark:border-zinc-700 font-medium"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* 2-Day Milestones Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Day 1 (Saturday) */}
        <div className="border border-slate-200 dark:border-zinc-800 rounded-md p-4 bg-slate-50/60 dark:bg-zinc-900/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-200 dark:border-zinc-800">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-400" />
                <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
                  Day 1 (Saturday)
                </span>
              </div>
              <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">
                Scaffold & core logic
              </span>
            </div>
            <ul className="space-y-2">
              {miniProject.day_1_milestones.map((milestone, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-xs text-slate-700 dark:text-zinc-300 leading-normal"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 mt-0.5 shrink-0" />
                  <span>{milestone}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-zinc-800 text-xs text-slate-500 dark:text-zinc-400 font-mono">
            Output: Runnable repo with OpenAPI contracts
          </div>
        </div>

        {/* Day 2 (Sunday) */}
        <div className="border border-slate-200 dark:border-zinc-800 rounded-md p-4 bg-slate-50/60 dark:bg-zinc-900/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-200 dark:border-zinc-800">
              <div className="flex items-center gap-1.5">
                <Github className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-400" />
                <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
                  Day 2 (Sunday)
                </span>
              </div>
              <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">
                Tests & GitHub deploy
              </span>
            </div>
            <ul className="space-y-2">
              {miniProject.day_2_milestones.map((milestone, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-xs text-slate-700 dark:text-zinc-300 leading-normal"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 mt-0.5 shrink-0" />
                  <span>{milestone}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-zinc-800 text-xs text-slate-500 dark:text-zinc-400 font-mono">
            Output: Public GitHub repo & automated test suite
          </div>
        </div>
      </div>

      {/* Post-Completion Resume Bullet Template */}
      <div className="border border-slate-200 dark:border-zinc-800 rounded-md p-4 bg-white dark:bg-[#111114]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
              Post-completion resume bullet template
            </span>
            <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">STAR / XYZ format</span>
          </div>
          <button
            type="button"
            onClick={handleCopyBullet}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-zinc-100 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-md transition-colors"
          >
            {copiedBullet ? (
              <>
                <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-slate-500 dark:text-zinc-400" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
        <p className="text-xs font-mono text-slate-700 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-md p-2.5 leading-relaxed">
          {miniProject.post_completion_resume_bullet_template}
        </p>
      </div>

      {/* Truth Vault Zero-Hallucination Warning Banner */}
      <div className="bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-md p-3.5 flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400 mt-0.5 shrink-0" />
        <div className="text-xs leading-relaxed text-amber-900 dark:text-amber-200">
          <span className="font-semibold block mb-0.5">Truth vault guardrail:</span>
          {truthVaultReminder ||
            "This 48-hour proof-of-work sprint is a forward-looking action plan. You must not add this mini-project, its tech stack, or unverified skills to your Master Truth Vault until you have actually written the code, verified tests, and pushed a public GitHub repository."}
        </div>
      </div>
    </div>
  );
}
