"use client";

import React, { useState } from "react";
import {
  TailoredResume,
  DecodedJD,
  PortalApplicationPack,
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
  portalPack: PortalApplicationPack | null;
  onGeneratePortalPack: () => void;
  isGeneratingPack: boolean;
}

type PreviewTab = "summary" | "projects" | "portal_pack";

export function ResumePreview({
  tailoredResume,
  decodedJd,
  portalPack,
  onGeneratePortalPack,
  isGeneratingPack,
}: ResumePreviewProps) {
  const [activeTab, setActiveTab] = useState<PreviewTab>("summary");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="bg-paper-sheet rounded-lg p-6 space-y-5">
      {/* Tab Navigation */}
      <div className="border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <nav className="flex space-x-6">
          <button
            type="button"
            onClick={() => setActiveTab("summary")}
            className={`pb-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "summary"
                ? "border-emerald-600 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800"
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
                ? "border-emerald-600 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            <span>Selected projects & bullets</span>
            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200 tabular-nums">
              {tailoredResume.projects.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("portal_pack")}
            className={`pb-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "portal_pack"
                ? "border-emerald-600 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">Portal pack</span>
            {portalPack && (
              <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200 whitespace-nowrap">
                Ready
              </span>
            )}
          </button>
        </nav>

        <span className="text-xs font-mono text-slate-400 pb-3 whitespace-nowrap truncate max-w-[200px]">
          Target: {tailoredResume.target_role}
        </span>
      </div>

      {/* TAB 1: Summary & Skills */}
      {activeTab === "summary" && (
        <div className="space-y-6">
          {/* Target Role & Summary */}
          <div>
            <h3 className="text-xs font-semibold text-slate-900 block mb-1">
              Professional summary (ATS optimized)
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-md border border-slate-200">
              {tailoredResume.professional_summary}
            </p>
          </div>

          {/* Categorized Tailored Skills */}
          <div>
            <h3 className="text-xs font-semibold text-slate-900 block mb-2">
              Categorized skills relevant to {decodedJd.role_title}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tailoredResume.skills.map((grp) => (
                <div
                  key={grp.category_name}
                  className="p-3 bg-slate-50 rounded-md border border-slate-200"
                >
                  <span className="text-xs font-semibold text-slate-800 block mb-1.5">
                    {grp.category_name}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {grp.skills.map((skill) => {
                      const isMatched = tailoredResume.matched_ats_keywords.some(
                        (k) => k.toLowerCase() === skill.toLowerCase()
                      );
                      return (
                        <span
                          key={skill}
                          className={`text-xs px-2 py-0.5 rounded-md border ${
                            isMatched
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200 font-medium"
                              : "bg-white text-slate-700 border-slate-200"
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
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 font-mono">
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
            <h3 className="text-xs font-semibold text-slate-900 block mb-3 flex items-center gap-1.5">
              <FolderGit2 className="w-3.5 h-3.5 text-emerald-600" />
              Tailored project highlights (selected strictly from truth vault)
            </h3>

            <div className="space-y-4">
              {tailoredResume.projects.map((proj) => (
                <div
                  key={proj.source_project_id}
                  className="bg-slate-50 border border-slate-200 rounded-md p-4"
                >
                  <div className="flex items-baseline justify-between gap-2 mb-2">
                    <h4 className="text-xs font-semibold text-slate-900">
                      {proj.name}
                    </h4>
                    <span className="text-[11px] font-mono text-slate-400">
                      source: {proj.source_project_id}
                    </span>
                  </div>

                  {proj.tech_stack.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap mb-2.5">
                      <Code className="w-3 h-3 text-slate-400 shrink-0" />
                      {proj.tech_stack.map((t) => (
                        <span
                          key={t}
                          className="text-[11px] font-mono bg-white text-slate-600 px-1.5 py-0.5 rounded-md border border-slate-200"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="space-y-1">
                    {proj.bullets.map((b, bIdx) => (
                      <p key={bIdx} className="text-xs text-slate-700 flex items-start gap-1.5 leading-relaxed">
                        <span className="text-emerald-600 font-bold shrink-0">•</span>
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
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-semibold text-slate-900 block mb-3 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-600" />
                Tailored professional experience bullets
              </h3>

              <div className="space-y-4">
                {tailoredResume.experience.map((exp, eIdx) => (
                  <div
                    key={eIdx}
                    className="bg-slate-50 border border-slate-200 rounded-md p-4"
                  >
                    <div className="flex items-baseline justify-between gap-2 mb-2">
                      <h4 className="text-xs font-semibold text-slate-900">
                        {exp.role} &bull; <span className="font-normal text-slate-600">{exp.company}</span>
                      </h4>
                      <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                        {exp.start_date} &mdash; {exp.end_date || "Present"}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {exp.bullets.map((bullet, bIdx) => (
                        <p key={bIdx} className="text-xs text-slate-700 flex items-start gap-1.5 leading-relaxed">
                          <span className="text-emerald-600 font-bold shrink-0">•</span>
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
            <div className="text-center py-10 bg-slate-50 rounded-md border border-slate-200 p-6">
              <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <h4 className="text-xs font-semibold text-slate-800 mb-1">
                Portal Application Pack Not Generated
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                Generate portal-specific screening answers, founder outreach emails, and deterministic eligibility verification.
              </p>
              <button
                type="button"
                onClick={onGeneratePortalPack}
                disabled={isGeneratingPack}
                className="px-3.5 py-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white rounded-md transition-colors"
              >
                {isGeneratingPack ? "Synthesizing..." : "Generate Portal Pack"}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Eligibility Check Outcome */}
              <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900">
                    Deterministic eligibility check ({portalPack.detected_portal})
                  </span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                      portalPack.eligibility.status === "eligible"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : portalPack.eligibility.status === "review_required"
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : "bg-rose-50 text-rose-800 border-rose-200"
                    }`}
                  >
                    {portalPack.eligibility.status === "eligible" ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Eligible</span>
                      </>
                    ) : portalPack.eligibility.status === "review_required" ? (
                      <>
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        <span>Review Required</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 text-rose-600" />
                        <span>Ineligible</span>
                      </>
                    )}
                  </span>
                </div>

                {portalPack.eligibility.passed_checks.length > 0 && (
                  <div className="space-y-1">
                    {portalPack.eligibility.passed_checks.map((check, idx) => (
                      <p key={idx} className="text-xs text-emerald-800 flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>{check}</span>
                      </p>
                    ))}
                  </div>
                )}

                {portalPack.eligibility.failed_checks.length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-slate-200">
                    {portalPack.eligibility.failed_checks.map((check, idx) => (
                      <p key={idx} className="text-xs text-rose-700 flex items-center gap-1.5">
                        <XCircle className="w-3 h-3 text-rose-600" />
                        <span>{check}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Screening Answers (if any) */}
              {portalPack.screening_answers.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-900">
                    Portal screening questions & truthful responses
                  </h4>
                  {portalPack.screening_answers.map((sa, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50 border border-slate-200 rounded-md p-3.5 space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-medium text-slate-800">
                          Q: {sa.question}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(sa.answer, `sa-${idx}`)}
                          className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 shrink-0 p-1 rounded hover:bg-slate-200"
                          title="Copy answer to clipboard"
                        >
                          {copiedKey === `sa-${idx}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed pl-2 border-l-2 border-slate-300">
                        {sa.answer}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Cold Email Outreach Collateral (if present) */}
              {portalPack.cold_email_body && (
                <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-600" />
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
                      className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 p-1 rounded hover:bg-slate-200"
                    >
                      {copiedKey === "cold-email" ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-400" />
                          <span>Copy email</span>
                        </>
                      )}
                    </button>
                  </div>

                  {portalPack.cold_email_subject && (
                    <div className="text-xs text-slate-800 font-mono bg-white p-2 rounded-md border border-slate-200">
                      <span className="text-slate-400">Subject: </span>
                      {portalPack.cold_email_subject}
                    </div>
                  )}

                  <div className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-md border border-slate-200 whitespace-pre-line font-sans">
                    {portalPack.cold_email_body}
                  </div>
                </div>
              )}

              {/* LinkedIn DM (if present) */}
              {portalPack.linkedin_dm && (
                <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-slate-600" />
                      <span className="text-xs font-semibold text-slate-900">
                        LinkedIn DM message
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                        ({portalPack.linkedin_dm.length} chars)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(portalPack.linkedin_dm || "", "linkedin-dm")}
                      className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 p-1 rounded hover:bg-slate-200"
                    >
                      {copiedKey === "linkedin-dm" ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-400" />
                          <span>Copy DM</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="text-xs text-slate-700 bg-white p-2.5 rounded-md border border-slate-200 leading-relaxed">
                    {portalPack.linkedin_dm}
                  </div>
                </div>
              )}

              {/* Tactical Portal Application Tips */}
              {portalPack.portal_tips.length > 0 && (
                <div className="p-3.5 bg-slate-50 rounded-md border border-slate-200">
                  <span className="text-xs font-semibold text-slate-900 block mb-1.5 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                    Tactical application tips for {portalPack.detected_portal}
                  </span>
                  <div className="space-y-1">
                    {portalPack.portal_tips.map((tip, idx) => (
                      <p key={idx} className="text-xs text-slate-600 flex items-start gap-1.5">
                        <span className="text-slate-400">•</span>
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
