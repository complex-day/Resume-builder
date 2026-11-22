"use client";

import React, { useState } from "react";
import {
  ApplicationCreateRequest,
  ApplicationStatus,
  ResumeStyleTag,
} from "@/types/tracker";
import { X, Briefcase, Loader2, Plus } from "lucide-react";

interface LogApplicationModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: ApplicationCreateRequest) => Promise<void>;
  isSaving: boolean;
}

const PORTAL_CHOICES = [
  "linkedin",
  "internshala",
  "wellfound",
  "naukri",
  "unstop",
  "cutshort",
  "indeed",
  "foundit",
  "hirist",
  "instahyre",
  "turing",
  "upwork",
  "freelancer",
  "yc_waas",
  "aicte",
  "pmis",
  "nats",
  "ncs",
  "google_careers",
  "greenhouse",
  "lever",
  "workday",
  "company_careers",
  "other",
];

const STYLE_CHOICES: { value: ResumeStyleTag; label: string }[] = [
  { value: "metrics_heavy", label: "Metrics-heavy (Quantified impact)" },
  { value: "project_first", label: "Project-first (Architectural depth)" },
  { value: "skills_first", label: "Skills-first (Technical stack emphasis)" },
  { value: "concise_startup", label: "Concise startup (High-pace execution)" },
  { value: "formal_govt", label: "Formal Govt / PMIS (Mandatory compliance)" },
];

export function LogApplicationModal({
  userId,
  isOpen,
  onClose,
  onSave,
  isSaving,
}: LogApplicationModalProps) {
  const [companyName, setCompanyName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [detectedPortal, setDetectedPortal] = useState("linkedin");
  const [sourceUrl, setSourceUrl] = useState("");
  const [atsScore, setAtsScore] = useState<number>(85);
  const [styleTag, setStyleTag] = useState<ResumeStyleTag>("metrics_heavy");
  const [status, setStatus] = useState<ApplicationStatus>("applied");
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !roleTitle.trim()) {
      setErrorMsg("Company name and role title are required.");
      return;
    }

    setErrorMsg(null);
    try {
      await onSave({
        user_id: userId,
        company_name: companyName.trim(),
        role_title: roleTitle.trim(),
        detected_portal: detectedPortal,
        source_url: sourceUrl.trim() || null,
        ats_score: Number(atsScore) || 85,
        style_tag: styleTag,
        selected_project_ids: [],
        status: status,
        notes: notes.trim() || null,
      });

      // Reset and close
      setCompanyName("");
      setRoleTitle("");
      setSourceUrl("");
      setNotes("");
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to log application.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60">
      <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-lg max-w-lg w-full p-6 shadow-xl relative animate-in fade-in duration-150 transition-colors">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800 mb-4">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
              Log tailored application
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-200 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 text-xs bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 p-2.5 rounded-md">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Company Name */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                Company name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Razorpay, Stripe, CRED"
                className="w-full text-xs px-3 py-1.5 rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
              />
            </div>

            {/* Role Title */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                Role title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="e.g. Backend Software Engineer"
                className="w-full text-xs px-3 py-1.5 rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Job Portal */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                Detected / target portal
              </label>
              <select
                value={detectedPortal}
                onChange={(e) => setDetectedPortal(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
              >
                {PORTAL_CHOICES.map((p) => (
                  <option key={p} value={p} className="dark:bg-zinc-900">
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Application Status */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                Initial status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
                className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
              >
                <option value="applied" className="dark:bg-zinc-900">Applied</option>
                <option value="shortlisted" className="dark:bg-zinc-900">Shortlisted</option>
                <option value="interview" className="dark:bg-zinc-900">Interview</option>
                <option value="offer" className="dark:bg-zinc-900">Offer</option>
                <option value="rejected" className="dark:bg-zinc-900">Rejected</option>
                <option value="saved" className="dark:bg-zinc-900">Saved</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* ATS Score */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                ATS match score (0-100)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={atsScore}
                onChange={(e) => setAtsScore(Number(e.target.value))}
                className="w-full text-xs px-3 py-1.5 rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 font-mono tabular-nums focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
              />
            </div>

            {/* Resume Style Tag */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                Resume synthesis style
              </label>
              <select
                value={styleTag}
                onChange={(e) => setStyleTag(e.target.value as ResumeStyleTag)}
                className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
              >
                {STYLE_CHOICES.map((s) => (
                  <option key={s.value} value={s.value} className="dark:bg-zinc-900">
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Source URL */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
              Job posting URL (optional)
            </label>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://company.com/jobs/..."
              className="w-full text-xs px-3 py-1.5 rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 font-mono text-[11px] placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
              Notes (optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Recruiter contact, interview round dates, referral details..."
              className="w-full text-xs p-2.5 rounded-md border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-3 py-1.5 text-xs text-slate-600 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !companyName.trim() || !roleTitle.trim()}
              className="px-3.5 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Logging...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Application</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
