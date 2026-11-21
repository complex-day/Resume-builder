"use client";

import React, { useState } from "react";
import { Loader2, Wand2, Sparkles, Globe, FileText, User } from "lucide-react";

interface JobInputColumnProps {
  rawJdText: string;
  sourceUrl: string;
  selectedPortal: string;
  candidateAge: string;
  candidateDomicile: string;
  isLoading: boolean;
  onJdChange: (text: string) => void;
  onUrlChange: (url: string) => void;
  onPortalChange: (portal: string) => void;
  onAgeChange: (age: string) => void;
  onDomicileChange: (domicile: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const SAMPLE_JD = `Role: Backend Software Engineer
Company: Razorpay
Location: Bengaluru, Karnataka, India
Level: Junior / Mid-Level

Responsibilities:
- Build high-throughput, low-latency REST and gRPC microservices in Go and Python.
- Design idempotent webhook dispatches and distributed transaction workflows.
- Manage and optimize relational data in PostgreSQL and distributed caching in Redis.
- Collaborate with platform reliability teams to instrument Prometheus metrics and Grafana alerting.
- Write strict unit tests, integration tests, and CI/CD deployment pipelines using Docker and GitHub Actions.

Requirements:
- Bachelor's degree in Computer Science, Information Technology, or related discipline (Minimum 6.5 CGPA).
- 2024 or 2025 graduation batches preferred.
- Hands-on experience with Go, Python, FastAPI, Docker, and PostgreSQL.
- Understanding of distributed systems, message queues (Kafka, Redis Streams), and concurrency.`;

export function JobInputColumn({
  rawJdText,
  sourceUrl,
  selectedPortal,
  candidateAge,
  candidateDomicile,
  isLoading,
  onJdChange,
  onUrlChange,
  onPortalChange,
  onAgeChange,
  onDomicileChange,
  onSubmit,
}: JobInputColumnProps) {
  const [showEligibilityOptions, setShowEligibilityOptions] = useState(false);
  const charCount = rawJdText.length;
  const isJdValid = charCount >= 50;

  const handleLoadSample = () => {
    onJdChange(SAMPLE_JD);
    onUrlChange("https://jobs.lever.co/razorpay/backend-engineer");
    onPortalChange("general");
    if (!candidateDomicile) onDomicileChange("Karnataka");
    if (!candidateAge) onAgeChange("22");
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" /> Target job description
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Paste target role details to trigger 3-agent ATS alignment.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLoadSample}
          disabled={isLoading}
          className="text-xs text-slate-600 hover:text-slate-900 font-medium px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          title="Fill sample job description for instant testing"
        >
          <Sparkles className="w-3.5 h-3.5 text-slate-500" />
          Load sample JD
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Portal Archetype Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Target portal type
            </label>
            <select
              value={selectedPortal}
              onChange={(e) => onPortalChange(e.target.value)}
              disabled={isLoading}
              className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-emerald-600"
            >
              <option value="general">General / Auto-Detect</option>
              <option value="internshala">Internshala</option>
              <option value="unstop">Unstop</option>
              <option value="linkedin">LinkedIn</option>
              <option value="wellfound">Wellfound (AngelList)</option>
              <option value="cutshort">YC / Cutshort</option>
              <option value="pmis">PMIS / AICTE / NATS / NCS</option>
            </select>
          </div>

          {/* Source URL (optional) */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Source URL (optional)
            </label>
            <div className="relative">
              <Globe className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => onUrlChange(e.target.value)}
                placeholder="https://internshala.com/job/..."
                disabled={isLoading}
                className="w-full text-xs pl-8 pr-2.5 py-1.5 rounded-md border border-slate-300 bg-white font-mono text-[11px] focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>
        </div>

        {/* Large Clean JD Textarea with Live Character Counter */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-slate-700">
              Raw job description <span className="text-rose-500">*</span>
            </label>
            <span
              className={`text-xs font-mono tabular-nums ${
                isJdValid ? "text-emerald-700" : "text-slate-400"
              }`}
            >
              {charCount} / 50 min chars
            </span>
          </div>

          <textarea
            rows={12}
            value={rawJdText}
            onChange={(e) => onJdChange(e.target.value)}
            disabled={isLoading}
            placeholder="Paste complete job description, requirements, responsibilities, and qualifications..."
            className="w-full text-xs p-3 rounded-md border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white font-sans leading-relaxed text-slate-800"
          />
        </div>

        {/* Collapsible Candidate Eligibility Options (for PMIS/Govt packs) */}
        <div>
          <button
            type="button"
            onClick={() => setShowEligibilityOptions(!showEligibilityOptions)}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1"
          >
            <User className="w-3 h-3 text-slate-400" />
            <span>{showEligibilityOptions ? "Hide portal filters" : "Set portal filter parameters (Age / Domicile)"}</span>
          </button>

          {showEligibilityOptions && (
            <div className="mt-2 p-3 bg-slate-50 rounded-md border border-slate-200 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Candidate age
                </label>
                <input
                  type="number"
                  value={candidateAge}
                  onChange={(e) => onAgeChange(e.target.value)}
                  placeholder="22"
                  min={16}
                  max={65}
                  className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-300 bg-white font-mono tabular-nums focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Candidate domicile / state
                </label>
                <input
                  type="text"
                  value={candidateDomicile}
                  onChange={(e) => onDomicileChange(e.target.value)}
                  placeholder="e.g. Karnataka"
                  className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-300 bg-white focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>
          )}
        </div>

        {/* THE ONE PRIMARY EMERALD CTA BUTTON */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading || !isJdValid}
            className="w-full py-2.5 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running 3-agent ATS alignment pipeline...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>Tailor ATS Resume</span>
              </>
            )}
          </button>
          {!isJdValid && charCount > 0 && (
            <p className="text-xs text-amber-700 mt-1.5 text-center">
              Please enter at least 50 characters of job description text.
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
