"use client";

import React, { useState } from "react";
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Code2,
  Cpu,
  FolderGit2,
  Users,
} from "lucide-react";
import {
  TargetedInterviewQuestion,
  InterviewQuestionCategory,
} from "@/types/sprint";

interface InterviewPrepSectionProps {
  questions: TargetedInterviewQuestion[];
}

const CATEGORY_LABELS: Record<InterviewQuestionCategory, { label: string; icon: any }> = {
  technical: { label: "Technical", icon: Code2 },
  system_design: { label: "System design", icon: Cpu },
  project_deep_dive: { label: "Project deep dive", icon: FolderGit2 },
  behavioral: { label: "Behavioral", icon: Users },
};

export function InterviewPrepSection({ questions }: InterviewPrepSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedIndices, setExpandedIndices] = useState<Record<number, boolean>>({
    0: true,
    1: true,
  });
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const toggleExpand = (idx: number) => {
    setExpandedIndices((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleCopy = async (q: TargetedInterviewQuestion, idx: number) => {
    const textToCopy = `Question: ${q.question}\nCategory: ${q.category}\nWhy asked: ${q.why_asked}\nAnswer Guide:\n${q.crisp_answer_guide}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // Fallback
    }
  };

  const filteredQuestions = questions.filter((q) => {
    if (selectedCategory === "all") return true;
    return q.category === selectedCategory;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-emerald-600" />
            Targeted interview preparation
            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              {questions.length} questions
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Grounded directly in target JD expectations and candidate vault projects.
          </p>
        </div>

        {/* Category filter tabs */}
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
              selectedCategory === "all"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All ({questions.length})
          </button>
          {(
            ["technical", "system_design", "project_deep_dive", "behavioral"] as InterviewQuestionCategory[]
          ).map((cat) => {
            const count = questions.filter((q) => q.category === cat).length;
            const config = CATEGORY_LABELS[cat];
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  selectedCategory === cat
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {config.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Questions list */}
      <div className="space-y-3 pt-4">
        {filteredQuestions.map((q, idx) => {
          const isExpanded = expandedIndices[idx] ?? false;
          const config = CATEGORY_LABELS[q.category] || { label: q.category, icon: HelpCircle };
          const Icon = config.icon;

          return (
            <div
              key={idx}
              className="border border-slate-200 rounded-md bg-white hover:border-slate-300 transition-colors"
            >
              <div
                onClick={() => toggleExpand(idx)}
                className="p-3.5 flex items-start justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex items-start gap-2.5 flex-1">
                  <span className="text-xs font-mono text-slate-400 mt-0.5 shrink-0">
                    Q{idx + 1}
                  </span>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        <Icon className="w-3 h-3 text-slate-500" />
                        {config.label}
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-slate-900 leading-snug">
                      {q.question}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(q, idx);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors"
                    title="Copy question and answer"
                  >
                    {copiedIndex === idx ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="px-3.5 pb-4 pt-1 border-t border-slate-100 bg-slate-50/50 space-y-2.5 text-xs">
                  <div>
                    <span className="font-semibold text-slate-700 block mb-0.5">
                      Interviewer intent:
                    </span>
                    <p className="text-slate-600 leading-relaxed">{q.why_asked}</p>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-md p-3">
                    <span className="font-semibold text-slate-800 block mb-1">
                      Crisp answer guide:
                    </span>
                    <p className="text-slate-700 font-mono leading-relaxed text-xs">
                      {q.crisp_answer_guide}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
