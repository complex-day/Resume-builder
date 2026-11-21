"use client";

import React, { useState } from "react";
import { Loader2, Sparkles, FileText } from "lucide-react";

interface SprintInputPanelProps {
  onGenerate: (targetRole: string, rawJd: string, sourceUrl?: string) => Promise<void>;
  isLoading: boolean;
  loadingStep?: string;
}

const SAMPLE_JD = `Role: Senior Backend Systems Engineer
Company: Razorpay
Location: Bengaluru, India (Hybrid)

About the Role:
We are looking for an experienced Senior Backend Systems Engineer to architect and scale our real-time payment ingestion and distributed settlement pipelines. You will lead the transition toward event-driven architectures with high reliability and ultra-low latency.

Mandatory Requirements:
- 3+ years experience with Go (Golang) and Python.
- Deep expertise in Kubernetes, Docker containerization, and Kafka / RabbitMQ event brokers.
- Production experience with PostgreSQL, Redis distributed caching, and database partitioning.
- Strong knowledge of microservice architectures, fault tolerance, and API gateways.

Nice to Have:
- Experience with Terraform, Prometheus, Grafana, and AWS cloud infrastructure.
- Familiarity with UPI settlement cycles, NPCI specs, or fintech fraud prevention.

Key Responsibilities:
- Build fault-tolerant event processing microservices capable of handling 20,000 requests/sec.
- Architect high-throughput distributed transaction workers with idempotent retry policies.
- Collaborate with platform and DevOps teams to containerize, deploy, and monitor scalable services.`;

export function SprintInputPanel({
  onGenerate,
  isLoading,
  loadingStep,
}: SprintInputPanelProps) {
  const [targetRole, setTargetRole] = useState("Senior Backend Systems Engineer");
  const [sourceUrl, setSourceUrl] = useState("https://razorpay.com/careers/backend-systems");
  const [rawJd, setRawJd] = useState(SAMPLE_JD);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawJd.trim() || rawJd.trim().length < 50 || isLoading) return;
    await onGenerate(targetRole.trim(), rawJd.trim(), sourceUrl.trim() || undefined);
  };

  const handleLoadSample = () => {
    setTargetRole("Senior Backend Systems Engineer");
    setSourceUrl("https://razorpay.com/careers/backend-systems");
    setRawJd(SAMPLE_JD);
  };

  const isMinLengthMet = rawJd.trim().length >= 50;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Target job description</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Paste target role requirements to extract skill gaps and generate a weekend build.
          </p>
        </div>
        <button
          type="button"
          onClick={handleLoadSample}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors whitespace-nowrap"
        >
          <FileText className="w-3.5 h-3.5 text-slate-400" />
          Load sample JD
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Target role title
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Senior Backend Engineer"
              disabled={isLoading}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Job posting URL (optional)
            </label>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://company.com/careers/job-id"
              disabled={isLoading}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-slate-700">
              Raw job description text
            </label>
            <span
              className={`text-xs font-mono ${
                isMinLengthMet ? "text-slate-400" : "text-amber-600"
              }`}
            >
              {rawJd.trim().length} chars {isMinLengthMet ? "" : "(min 50)"}
            </span>
          </div>
          <textarea
            value={rawJd}
            onChange={(e) => setRawJd(e.target.value)}
            rows={7}
            disabled={isLoading}
            placeholder="Paste entire job description text here..."
            className="w-full text-xs font-mono px-3 py-2 border border-slate-200 rounded-md bg-slate-50 text-slate-800 leading-relaxed focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            {isLoading && loadingStep ? (
              <span className="flex items-center gap-2 text-slate-700">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                {loadingStep}
              </span>
            ) : (
              <span>Deterministic skill comparison with your active Master Truth Vault</span>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !isMinLengthMet}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Synthesizing sprint plan...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate 48-Hr Sprint</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
