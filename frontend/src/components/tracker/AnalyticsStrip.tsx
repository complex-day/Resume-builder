"use client";

import React from "react";
import { TrackerAnalyticsResponse } from "@/types/tracker";
import { Send, TrendingUp, Award, Sparkles } from "lucide-react";

interface AnalyticsStripProps {
  analytics: TrackerAnalyticsResponse | null;
  isLoading: boolean;
}

export function AnalyticsStrip({ analytics, isLoading }: AnalyticsStripProps) {
  const totalApps = analytics?.total_applications ?? 0;
  const callbackRate = analytics?.overall_callback_rate_pct ?? 0.0;
  const avgAts = analytics?.avg_ats_score ?? 0.0;
  const recommendedStyle = analytics?.recommended_style_tag;
  const topInsight = analytics?.feedback_insights?.[0];

  return (
    <div className="space-y-4 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Applications */}
        <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-lg p-4 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-600 dark:text-zinc-400">
              Total applications
            </span>
            <Send className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-zinc-100 tabular-nums">
              {isLoading ? "—" : totalApps}
            </span>
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-mono">tracked</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Across all portals and application stages
          </p>
        </div>

        {/* Callback Conversion Rate */}
        <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-lg p-4 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-600 dark:text-zinc-400">
              Callback conversion rate
            </span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-zinc-100 tabular-nums">
              {isLoading ? "—" : `${callbackRate}%`}
            </span>
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-mono">interviews/offers</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Positive responses over active submissions
          </p>
        </div>

        {/* Average ATS Score */}
        <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-lg p-4 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-600 dark:text-zinc-400">
              Average ATS match score
            </span>
            <Award className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-zinc-100 tabular-nums">
              {isLoading ? "—" : avgAts}
            </span>
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-mono">/ 100</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Computed by zero-hallucination critic
          </p>
        </div>

        {/* Self-Learning Style Recommendation */}
        <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-lg p-4 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-600 dark:text-zinc-400">
              Top resume style
            </span>
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-slate-900 dark:text-zinc-100 truncate">
              {isLoading
                ? "—"
                : recommendedStyle
                ? recommendedStyle.replace(/_/g, " ")
                : totalApps === 0
                ? "Awaiting data"
                : "Collecting callbacks"}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 truncate" title={topInsight}>
            {topInsight || "Submit applications to establish conversion rankings"}
          </p>
        </div>
      </div>

      {/* Self-Learning Feedback Loop Banner (when insights exist) */}
      {analytics && analytics.feedback_insights.length > 0 && totalApps > 0 && (
        <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-lg p-4 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
            <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
              Data-driven feedback loop insights
            </span>
          </div>
          <div className="space-y-1">
            {analytics.feedback_insights.map((insight, idx) => (
              <p key={idx} className="text-xs text-slate-600 dark:text-zinc-400 flex items-start gap-1.5 leading-relaxed">
                <span className="text-slate-400 dark:text-zinc-500">•</span>
                <span>{insight}</span>
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
