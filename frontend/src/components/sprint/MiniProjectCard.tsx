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
    <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-6">
      {/* Title & Core Stack Header */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
              Weekend proof of work
            </span>
            <span className="text-xs text-slate-500">48-hour build target</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {miniProject.tech_stack.map((tech, idx) => (
              <span
                key={idx}
                className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        <h3 className="text-base font-bold text-slate-900">{miniProject.title}</h3>
        <p className="text-xs text-slate-600 mt-2 leading-relaxed bg-slate-50 border border-slate-200 rounded-md p-3">
          <span className="font-semibold text-slate-800">Problem statement: </span>
          {miniProject.problem_statement}
        </p>
      </div>

      {/* Target Skills Addressed */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Layers className="w-3.5 h-3.5 text-slate-500" />
          <h4 className="text-xs font-semibold text-slate-800">
            Competencies demonstrated
          </h4>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {miniProject.target_skills.map((skill, idx) => (
            <span
              key={idx}
              className="text-xs font-mono px-2.5 py-1 rounded-md bg-white text-slate-800 border border-slate-300 font-medium"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* 2-Day Milestones Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Day 1 (Saturday) */}
        <div className="border border-slate-200 rounded-md p-4 bg-slate-50/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-200">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-600" />
                <span className="text-xs font-semibold text-slate-900">
                  Day 1 (Saturday)
                </span>
              </div>
              <span className="text-xs font-mono text-slate-500">
                Scaffold & core logic
              </span>
            </div>
            <ul className="space-y-2">
              {miniProject.day_1_milestones.map((milestone, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-xs text-slate-700 leading-normal"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <span>{milestone}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-500 font-mono">
            Output: Runnable repo with OpenAPI contracts
          </div>
        </div>

        {/* Day 2 (Sunday) */}
        <div className="border border-slate-200 rounded-md p-4 bg-slate-50/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-200">
              <div className="flex items-center gap-1.5">
                <Github className="w-3.5 h-3.5 text-slate-600" />
                <span className="text-xs font-semibold text-slate-900">
                  Day 2 (Sunday)
                </span>
              </div>
              <span className="text-xs font-mono text-slate-500">
                Tests & GitHub deploy
              </span>
            </div>
            <ul className="space-y-2">
              {miniProject.day_2_milestones.map((milestone, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-xs text-slate-700 leading-normal"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <span>{milestone}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-500 font-mono">
            Output: Public GitHub repo & automated test suite
          </div>
        </div>
      </div>

      {/* Post-Completion Resume Bullet Template */}
      <div className="border border-slate-200 rounded-md p-4 bg-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-800">
              Post-completion resume bullet template
            </span>
            <span className="text-xs font-mono text-slate-500">STAR / XYZ format</span>
          </div>
          <button
            type="button"
            onClick={handleCopyBullet}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
          >
            {copiedBullet ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-700 font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-slate-500" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
        <p className="text-xs font-mono text-slate-700 bg-slate-50 border border-slate-200 rounded-md p-2.5 leading-relaxed">
          {miniProject.post_completion_resume_bullet_template}
        </p>
      </div>

      {/* Truth Vault Zero-Hallucination Warning Banner */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-md p-3.5 flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
        <div className="text-xs leading-relaxed text-amber-900">
          <span className="font-semibold block mb-0.5">Truth vault guardrail:</span>
          {truthVaultReminder ||
            "This 48-hour proof-of-work sprint is a forward-looking action plan. You must not add this mini-project, its tech stack, or unverified skills to your Master Truth Vault until you have actually written the code, verified tests, and pushed a public GitHub repository."}
        </div>
      </div>
    </div>
  );
}
