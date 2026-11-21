"use client";

import React, { useState } from "react";
import {
  ApplicationCreateRequest,
  ApplicationStatus,
  ResumeStyleTag,
} from "@/types/tracker";
import { X, Loader2, Plus, Briefcase } from "lucide-react";

interface LogApplicationModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: ApplicationCreateRequest) => Promise<void>;
  isSaving: boolean;
}

const PORTAL_CHOICES = [
  { value: "linkedin", label: "LinkedIn" },
  { value: "internshala", label: "Internshala" },
  { value: "wellfound", label: "Wellfound (AngelList)" },
  { value: "unstop", label: "Unstop" },
  { value: "naukri", label: "Naukri.com" },
  { value: "indeed", label: "Indeed" },
  { value: "instahyre", label: "Instahyre" },
  { value: "cutshort", label: "Cutshort" },
  { value: "ycombinator", label: "Work at a Startup (YC)" },
  { value: "pmis", label: "PMIS / AICTE Portal" },
  { value: "nats", label: "NATS Apprentice Portal" },
  { value: "ncs", label: "National Career Service (NCS)" },
  { value: "glassdoor", label: "Glassdoor" },
  { value: "hirist", label: "Hirist" },
  { value: "foundit", label: "Foundit (Monster)" },
  { value: "google_careers", label: "Google Careers" },
  { value: "amazon_jobs", label: "Amazon Jobs" },
  { value: "tcs_ion", label: "TCS iON / NextStep" },
  { value: "direct_portal", label: "Direct Company Careers Page" },
  { value: "other", label: "Other Portal" },
];

const STYLE_CHOICES: { value: ResumeStyleTag; label: string }[] = [
  { value: "metrics_heavy", label: "Metrics Heavy (High Quantified Impact)" },
  { value: "project_first", label: "Project First (Hands-on Repos)" },
  { value: "skills_first", label: "Skills First (Keyword Clustered)" },
  { value: "concise_startup", label: "Concise Startup (1-Page Punchy)" },
  { value: "formal_govt", label: "Formal Govt (PMIS/AICTE/PSU)" },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-lg max-w-lg w-full p-6 shadow-xl relative animate-in fade-in duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-semibold text-slate-900">
              Log tailored application
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 text-xs bg-rose-50 border border-rose-200 text-rose-800 p-2.5 rounded-md">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Company Name */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Company name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Swiggy"
                required
                className="w-full text-xs px-3 py-1.5 rounded-md border border-slate-300 focus:outline-none focus:border-emerald-600 bg-white"
                autoFocus
              />
            </div>

            {/* Role Title */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Role title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="e.g. Backend Engineer"
                required
                className="w-full text-xs px-3 py-1.5 rounded-md border border-slate-300 focus:outline-none focus:border-emerald-600 bg-white"
              />
            </div>

            {/* Portal */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Job portal
              </label>
              <select
                value={detectedPortal}
                onChange={(e) => setDetectedPortal(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-emerald-600"
              >
                {PORTAL_CHOICES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Lifecycle status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
                className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-emerald-600"
              >
                <option value="applied">Applied</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="interview">Interview</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
                <option value="saved">Saved (Draft)</option>
              </select>
            </div>

            {/* ATS Match Score */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ATS match score (0-100)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={atsScore}
                onChange={(e) => setAtsScore(Number(e.target.value))}
                className="w-full text-xs px-3 py-1.5 rounded-md border border-slate-300 bg-white font-mono tabular-nums focus:outline-none focus:border-emerald-600"
              />
            </div>

            {/* Resume Style Tag */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Resume synthesis style
              </label>
              <select
                value={styleTag}
                onChange={(e) => setStyleTag(e.target.value as ResumeStyleTag)}
                className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-emerald-600"
              >
                {STYLE_CHOICES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Source URL */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Job posting URL (optional)
            </label>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://company.com/jobs/..."
              className="w-full text-xs px-3 py-1.5 rounded-md border border-slate-300 bg-white font-mono text-[11px] focus:outline-none focus:border-emerald-600"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Recruiter contact, interview round dates, referral details..."
              className="w-full text-xs p-2.5 rounded-md border border-slate-300 focus:outline-none focus:border-emerald-600 bg-white"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 rounded-md"
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
