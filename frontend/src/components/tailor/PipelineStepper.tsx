"use client";

import React from "react";
import { FileSearch, Layers, ShieldCheck, Check, Loader2 } from "lucide-react";

export type PipelineStage = "idle" | "decoder" | "architect" | "critic" | "complete";

interface PipelineStepperProps {
  currentStage: PipelineStage;
}

const STEPS = [
  {
    id: "decoder",
    stepNum: "01",
    label: "JD Decoder",
    role: "Extracts hard constraints, keywords, and eligibility filters",
    icon: FileSearch,
  },
  {
    id: "architect",
    stepNum: "02",
    label: "Resume Architect",
    role: "Synthesizes tailored STAR/XYZ bullets from Truth Vault",
    icon: Layers,
  },
  {
    id: "critic",
    stepNum: "03",
    label: "ATS Critic",
    role: "Audits score, verifies facts, and refines keyword density",
    icon: ShieldCheck,
  },
] as const;

export function PipelineStepper({ currentStage }: PipelineStepperProps) {
  const getStepStatus = (stepId: string, index: number) => {
    if (currentStage === "complete") return "complete";

    const stageOrder: Record<PipelineStage, number> = {
      idle: 0,
      decoder: 1,
      architect: 2,
      critic: 3,
      complete: 4,
    };

    const currentOrder = stageOrder[currentStage] || 0;
    const stepOrder = index + 1;

    if (currentOrder > stepOrder) return "complete";
    if (currentOrder === stepOrder) return "active";
    return "pending";
  };

  return (
    <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-lg p-5 mb-5 transition-colors">
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
            3-Agent Alignment Pipeline
          </span>
          <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-md">
            Live execution
          </span>
        </div>
        <span className="text-xs font-mono text-slate-400 dark:text-zinc-500">
          Step {currentStage === "decoder" ? "1/3" : currentStage === "architect" ? "2/3" : currentStage === "critic" ? "3/3" : "Active"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {STEPS.map((step, idx) => {
          const status = getStepStatus(step.id, idx);
          const Icon = step.icon;

          return (
            <div
              key={step.id}
              className={`p-3.5 rounded-md border transition-all ${
                status === "active"
                  ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500/70 dark:border-emerald-600/60 shadow-xs"
                  : status === "complete"
                  ? "bg-slate-50 dark:bg-zinc-900/60 border-slate-200 dark:border-zinc-800"
                  : "bg-slate-50/40 dark:bg-zinc-900/20 border-slate-200/80 dark:border-zinc-800/50 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-medium text-slate-400 dark:text-zinc-500">
                    {step.stepNum}
                  </span>
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center border text-xs ${
                      status === "active"
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : status === "complete"
                        ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                        : "bg-white dark:bg-zinc-900 text-slate-400 dark:text-zinc-500 border-slate-200 dark:border-zinc-800"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                </div>

                {status === "active" && (
                  <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Running
                  </span>
                )}
                {status === "complete" && (
                  <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    Passed
                  </span>
                )}
                {status === "pending" && (
                  <span className="text-[11px] font-mono text-slate-400 dark:text-zinc-600">
                    Queued
                  </span>
                )}
              </div>

              <h4 className="text-xs font-semibold text-slate-900 dark:text-zinc-100 mb-0.5">
                {step.label}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-snug">
                {step.role}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
