"use client";

import React, { useState, useMemo } from "react";
import {
  TailoredResume,
  DecodedJD,
  PortalApplicationPack,
  ATSCritique,
} from "@/types/tailor";
import {
  FileText,
  FolderGit2,
  Briefcase,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Mail,
  Send,
  Lightbulb,
  Code,
  Layers,
} from "lucide-react";

interface ResumePreviewProps {
  tailoredResume: TailoredResume;
  decodedJd: DecodedJD;
  atsCritique?: ATSCritique | null;
  portalPack: PortalApplicationPack | null;
  onGeneratePortalPack: () => void;
  isGeneratingPack: boolean;
}

type PreviewTab = "summary" | "projects" | "portal_pack";

export function ResumePreview({
  tailoredResume,
  decodedJd,
  atsCritique,
  portalPack,
  onGeneratePortalPack,
  isGeneratingPack,
}: ResumePreviewProps) {
  const [activeTab, setActiveTab] = useState<PreviewTab>("summary");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Exact case-insensitive normalized match strictly against verified ATS critique keywords
  const verifiedMatchedKeywords = useMemo(() => {
    const set = new Set<string>();
    if (atsCritique?.matched_keywords) {
      for (const kw of atsCritique.matched_keywords) {
        if (typeof kw === "string" && kw.trim()) {
          set.add(kw.trim().toLowerCase());
        }
      }
    }
    return set;
  }, [atsCritique?.matched_keywords]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="bg-paper-sheet rounded-lg p-6 space-y-5 transition-colors">
      {/* Tab Navigation */}
      <div className="border-b border-slate-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
        <nav className="flex space-x-4 sm:space-x-6 overflow-x-auto whitespace-nowrap pb-0.5">
          <button
            type="button"
            onClick={() => setActiveTab("summary")}
            className={`pb-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "summary"
                ? "border-emerald-600 text-slate-900 dark:text-zinc-100"
                : "border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Summary & skills</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("projects")}
            className={`pb-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "projects"
                ? "border-emerald-600 text-slate-900 dark:text-zinc-100"
                : "border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            <span>Selected projects & bullets</span>
            <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-zinc-700 tabular-nums">
              {tailoredResume.projects.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("portal_pack")}
            className={`pb-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "portal_pack"
                ? "border-emerald-600 text-slate-900 dark:text-zinc-100"
                : "border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">Portal pack</span>
            {portalPack && (
              <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 whitespace-nowrap">
                Ready
              </span>
            )}
          </button>
        </nav>

        <span className="text-xs font-mono text-slate-400 dark:text-zinc-500 pb-3 whitespace-nowrap truncate max-w-[200px]">
          Target: {tailoredResume.target_role}
        </span>
      </div>

      {/* TAB 1: Summary & Skills */}
      {activeTab === "summary" && (
        <div className="space-y-6">
          {/* Target Role & Summary */}
          <div>
            <h3 className="text-xs font-semibold text-slate-900 dark:text-zinc-100 block mb-1">
              Professional summary (ATS optimized)
            </h3>
            <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed bg-slate-50 dark:bg-zinc-900/60 p-3.5 rounded-md border border-slate-200 dark:border-zinc-800">
              {tailoredResume.professional_summary}
            </p>
          </div>

          {/* Categorized Tailored Skills */}
          <div>
            <h3 className="text-xs font-semibold text-slate-900 dark:text-zinc-100 block mb-2">
              Categorized skills relevant to {decodedJd.role_title}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tailoredResume.skills.map((grp) => (
                <div
                  key={grp.category_name}
                  className="p-3 bg-slate-50 dark:bg-zinc-900/60 rounded-md border border-slate-200 dark:border-zinc-800"
                >
                  <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 block mb-1.5">
                    {grp.category_name}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {grp.skills.map((skill) => {
                      const isMatched = verifiedMatchedKeywords.has(
                        skill.trim().toLowerCase()
                      );
                      return (
                        <span
                          key={skill}
                          className={`text-xs px-2 py-0.5 rounded-md border ${
                            isMatched
                              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 font-medium"
                              : "bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700"
                          }`}
                        >
                          {skill}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Decoded JD Metadata Overview */}
          <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-zinc-400 font-mono">
            <span>Detected company vibe: {decodedJd.company_vibe}</span>
            <span>Seniority level: {decodedJd.role_level}</span>
            <span>Target portal: {decodedJd.detected_portal}</span>
          </div>
        </div>
      )}

      {/* TAB 2: Selected Projects & Bullets */}
      {activeTab === "projects" && (
        <div className="space-y-6">
          {/* Selected Projects */}
          <div>
            <h3 className="text-xs font-semibold text-slate-900 dark:text-zinc-100 block mb-3 flex items-center gap-1.5">
              <FolderGit2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
              Tailored project highlights (selected strictly from truth vault)
            </h3>

            <div className="space-y-4">
              {tailoredResume.projects.map((proj) => (
                <div
                  key={proj.source_project_id}
                  className="bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-md p-4"
                >
                  <div className="flex items-baseline justify-between gap-2 mb-2">
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
                      {proj.name}
                    </h4>
                    <span className="text-[11px] font-mono text-slate-400 dark:text-zinc-500">
                      source: {proj.source_project_id}
                    </span>
                  </div>

                  {proj.tech_stack.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap mb-2.5">
                      <Code className="w-3 h-3 text-slate-400 dark:text-zinc-500 shrink-0" />
                      {proj.tech_stack.map((t) => (
                        <span
                          key={t}
                          className="text-[11px] font-mono bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-zinc-700"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="space-y-1">
                    {proj.bullets.map((b, bIdx) => (
                      <p key={bIdx} className="text-xs text-slate-700 dark:text-zinc-300 flex items-start gap-1.5 leading-relaxed">
                        <span className="text-emerald-600 dark:text-emerald-500 font-bold shrink-0">•</span>
                        <span>{b}</span>
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tailored Experience Entries */}
          {tailoredResume.experience.length > 0 && (
            <div className="pt-4 border-t border-slate-100 dark:border-zinc-800">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-zinc-100 block mb-3 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-400" />
                Tailored professional experience bullets
              </h3>

              <div className="space-y-4">
                {tailoredResume.experience.map((exp, eIdx) => (
                  <div
                    key={eIdx}
                    className="bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-md p-4"
                  >
                    <div className="flex items-baseline justify-between gap-2 mb-2">
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
                        {exp.role} &bull; <span className="font-normal text-slate-600 dark:text-zinc-400">{exp.company}</span>
                      </h4>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 tabular-nums">
                        {exp.start_date} &mdash; {exp.end_date || "Present"}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {exp.bullets.map((bullet, bIdx) => (
                        <p key={bIdx} className="text-xs text-slate-700 dark:text-zinc-300 flex items-start gap-1.5 leading-relaxed">
                          <span className="text-emerald-600 dark:text-emerald-500 font-bold shrink-0">•</span>
                          <span>{bullet}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Portal Pack */}
      {activeTab === "portal_pack" && (
        <div className="space-y-6">
          {!portalPack ? (
            <div className="text-center py-10 bg-slate-50 dark:bg-zinc-900/60 rounded-md border border-slate-200 dark:border-zinc-800 p-6">
              <Layers className="w-8 h-8 text-slate-300 dark:text-zinc-600 mx-auto mb-2" />
              <h4 className="text-xs font-semibold text-slate-800 dark:text-zinc-200 mb-1">
                Portal Application Pack Not Generated
              </h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto mb-4">
                Generate portal-specific screening answers, founder outreach emails, and deterministic eligibility verification.
              </p>
              <button
                type="button"
                onClick={onGeneratePortalPack}
                disabled={isGeneratingPack}
                className="px-3.5 py-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-md transition-colors"
              >
                {isGeneratingPack ? "Synthesizing..." : "Generate Portal Pack"}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Eligibility Check Outcome */}
              <div className="bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-md p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
                    Deterministic eligibility check ({portalPack.detected_portal})
                  </span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                      portalPack.eligibility.status === "eligible"
                        ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                        : portalPack.eligibility.status === "review_required"
                        ? "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                        : "bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                    }`}
                  >
                    {portalPack.eligibility.status === "eligible" ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>Eligible</span>
                      </>
                    ) : portalPack.eligibility.status === "review_required" ? (
                      <>
                        <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        <span>Review Required</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                        <span>Ineligible</span>
                      </>
                    )}
                  </span>
                </div>

                {portalPack.eligibility.passed_checks.length > 0 && (
                  <div className="space-y-1">
                    {portalPack.eligibility.passed_checks.map((check, idx) => (
                      <p key={idx} className="text-xs text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>{check}</span>
                      </p>
                    ))}
                  </div>
                )}

                {portalPack.eligibility.failed_checks.length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-slate-200 dark:border-zinc-800">
                    {portalPack.eligibility.failed_checks.map((check, idx) => (
                      <p key={idx} className="text-xs text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                        <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                        <span>{check}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Screening Answers (if any) */}
              {portalPack.screening_answers.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
                    Portal screening questions & truthful responses
                  </h4>
                  {portalPack.screening_answers.map((sa, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-md p-3.5 space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-medium text-slate-800 dark:text-zinc-200">
                          Q: {sa.question}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(sa.answer, `sa-${idx}`)}
                          className="text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 flex items-center gap-1 shrink-0 p-1 rounded hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors"
                          title="Copy answer to clipboard"
                        >
                          {copiedKey === `sa-${idx}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed pl-2 border-l-2 border-slate-300 dark:border-zinc-700">
                        {sa.answer}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Cold Email Outreach Collateral (if present) */}
              {portalPack.cold_email_body && (
                <div className="bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-md p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-400" />
                      Founder / CTO cold email outreach
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          `Subject: ${portalPack.cold_email_subject || ""}\n\n${portalPack.cold_email_body || ""}`,
                          "cold-email"
                        )
                      }
                      className="text-xs text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 flex items-center gap-1 p-1 rounded hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors"
                    >
                      {copiedKey === "cold-email" ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
                          <span>Copy email</span>
                        </>
                      )}
                    </button>
                  </div>

                  {portalPack.cold_email_subject && (
                    <div className="text-xs text-slate-800 dark:text-zinc-200 font-mono bg-white dark:bg-zinc-900 p-2 rounded-md border border-slate-200 dark:border-zinc-800">
                      <span className="text-slate-400 dark:text-zinc-500">Subject: </span>
                      {portalPack.cold_email_subject}
                    </div>
                  )}

                  <div className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed bg-white dark:bg-zinc-900 p-3 rounded-md border border-slate-200 dark:border-zinc-800 whitespace-pre-line font-sans">
                    {portalPack.cold_email_body}
                  </div>
                </div>
              )}

              {/* LinkedIn DM (if present) */}
              {portalPack.linkedin_dm && (
                <div className="bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-md p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-400" />
                      <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
                        LinkedIn DM message
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 dark:text-zinc-500 tabular-nums">
                        ({portalPack.linkedin_dm.length} chars)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(portalPack.linkedin_dm || "", "linkedin-dm")}
                      className="text-xs text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 flex items-center gap-1 p-1 rounded hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors"
                    >
                      {copiedKey === "linkedin-dm" ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
                          <span>Copy DM</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="text-xs text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 p-2.5 rounded-md border border-slate-200 dark:border-zinc-800 leading-relaxed">
                    {portalPack.linkedin_dm}
                  </div>
                </div>
              )}

              {/* Tactical Portal Application Tips */}
              {portalPack.portal_tips.length > 0 && (
                <div className="p-3.5 bg-slate-50 dark:bg-zinc-900/60 rounded-md border border-slate-200 dark:border-zinc-800">
                  <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100 block mb-1.5 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
                    Tactical application tips for {portalPack.detected_portal}
                  </span>
                  <div className="space-y-1">
                    {portalPack.portal_tips.map((tip, idx) => (
                      <p key={idx} className="text-xs text-slate-600 dark:text-zinc-400 flex items-start gap-1.5">
                        <span className="text-slate-400 dark:text-zinc-500">•</span>
                        <span>{tip}</span>
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
