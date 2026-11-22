"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@/context/UserContext";
import { api } from "@/lib/api";
import { MasterTruthVault } from "@/types/vault";
import { PipelineRunResponse, PortalApplicationPack } from "@/types/tailor";
import { JobInputColumn } from "@/components/tailor/JobInputColumn";
import { ScoreCard } from "@/components/tailor/ScoreCard";
import { ActionBar } from "@/components/tailor/ActionBar";
import { ResumePreview } from "@/components/tailor/ResumePreview";
import { PipelineStepper, PipelineStage } from "@/components/tailor/PipelineStepper";
import {
  Wand2,
  AlertTriangle,
  FileCheck2,
  ArrowRight,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export default function TailorStudioPage() {
  const { userId } = useUser();

  const [vault, setVault] = useState<MasterTruthVault | null>(null);
  const [isVaultLoading, setIsVaultLoading] = useState(true);

  // Form states
  const [rawJdText, setRawJdText] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [selectedPortal, setSelectedPortal] = useState("general");
  const [candidateAge, setCandidateAge] = useState("");
  const [candidateDomicile, setCandidateDomicile] = useState("");

  // Pipeline execution & results
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>("idle");
  const [pipelineResult, setPipelineResult] = useState<PipelineRunResponse | null>(null);
  const [portalPack, setPortalPack] = useState<PortalApplicationPack | null>(null);

  // Action states
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isGeneratingPack, setIsGeneratingPack] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load user's truth vault
  const loadVault = useCallback(async () => {
    setIsVaultLoading(true);
    try {
      const data = await api.getVault(userId);
      setVault(data);
      if (data.basics.location && !candidateDomicile) {
        setCandidateDomicile(data.basics.location);
      }
    } catch {
      setErrorMessage(
        `Could not load Master Truth Vault for user '${userId}'. Please verify your profile in Truth Vault first.`
      );
    } finally {
      setIsVaultLoading(false);
    }
  }, [userId, candidateDomicile]);

  useEffect(() => {
    loadVault();
  }, [loadVault]);

  // Execute the 3-Agent Pipeline
  const handleRunPipeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawJdText.trim() || rawJdText.trim().length < 50) {
      setErrorMessage("Job description must contain at least 50 characters.");
      return;
    }

    setIsRunningPipeline(true);
    setPipelineStage("decoder");
    setErrorMessage(null);
    setPortalPack(null);

    // Realistic progressive step advancement while backend processes
    const stepTimer1 = setTimeout(() => setPipelineStage("architect"), 3000);
    const stepTimer2 = setTimeout(() => setPipelineStage("critic"), 8000);

    try {
      const result = await api.runResumePipeline({
        user_id: userId,
        vault: vault || undefined,
        raw_jd_text: rawJdText.trim(),
        source_url: sourceUrl.trim() || undefined,
      });

      setPipelineStage("complete");
      setPipelineResult(result);
    } catch (err: any) {
      setPipelineStage("idle");
      setErrorMessage(err?.message || "Failed to execute resume tailoring pipeline.");
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setIsRunningPipeline(false);
    }
  };

  // Download ATS-compliant single-column PDF
  const handleDownloadPdf = async () => {
    if (!pipelineResult || !vault) return;
    setIsDownloadingPdf(true);
    setErrorMessage(null);

    try {
      const filename = `${pipelineResult.tailored_resume.target_role
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")}_resume.pdf`;

      await api.downloadTailoredPdf(
        {
          vault,
          tailored_resume: pipelineResult.tailored_resume,
        },
        filename
      );
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to generate ATS PDF.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Synthesize Portal Application Pack
  const handleGeneratePortalPack = async () => {
    if (!pipelineResult || !vault) return;
    setIsGeneratingPack(true);
    setErrorMessage(null);

    try {
      const pack = await api.generatePortalPack({
        vault,
        decoded_jd: pipelineResult.decoded_jd,
        candidate_age: candidateAge ? parseInt(candidateAge, 10) : null,
        candidate_domicile: candidateDomicile.trim() || null,
      });

      setPortalPack(pack);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to synthesize portal application pack.");
    } finally {
      setIsGeneratingPack(false);
    }
  };

  const handleReset = () => {
    setPipelineResult(null);
    setPortalPack(null);
    setPipelineStage("idle");
    setRawJdText("");
    setSourceUrl("");
    setErrorMessage(null);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Top Header */}
      <header className="sticky top-0 z-20 bg-white dark:bg-[#111114] border-b border-slate-200 dark:border-zinc-800 px-8 py-3.5 flex items-center justify-between transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
              Tailor Studio
            </h1>
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-mono bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-zinc-700">
              user: {userId}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            3-agent ATS alignment engine &bull; Zero-hallucination resume tailoring
          </p>
        </div>

        <Link
          href="/"
          className="text-xs text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-zinc-100 font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
          <span>Truth Vault</span>
          <ArrowRight className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
        </Link>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-8 py-6">
        {/* Error notification banner */}
        {errorMessage && (
          <div className="mb-6 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs px-4 py-3 rounded-md flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-rose-500 hover:text-rose-800 dark:hover:text-rose-300 font-bold ml-2"
            >
              &times;
            </button>
          </div>
        )}

        {isVaultLoading ? (
          <div className="flex items-center justify-center py-20 text-xs text-slate-500 dark:text-zinc-400 gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600 dark:text-emerald-500" />
            <span>Loading user Master Truth Vault...</span>
          </div>
        ) : (
          /* Desktop 2-Column Workspace Grid */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Job Input (5 cols) */}
            <div className="lg:col-span-5">
              <JobInputColumn
                rawJdText={rawJdText}
                sourceUrl={sourceUrl}
                selectedPortal={selectedPortal}
                candidateAge={candidateAge}
                candidateDomicile={candidateDomicile}
                isLoading={isRunningPipeline}
                onJdChange={setRawJdText}
                onUrlChange={setSourceUrl}
                onPortalChange={setSelectedPortal}
                onAgeChange={setCandidateAge}
                onDomicileChange={setCandidateDomicile}
                onSubmit={handleRunPipeline}
              />
            </div>

            {/* Right Column: Tailored Result & Collateral (7 cols) */}
            <div className="lg:col-span-7">
              {/* Active Pipeline Stepper */}
              {isRunningPipeline && (
                <PipelineStepper currentStage={pipelineStage} />
              )}

              {!pipelineResult && !isRunningPipeline ? (
                /* Empty state before running the pipeline */
                <div className="bg-white dark:bg-[#111114] bg-blueprint-grid border border-slate-200 dark:border-zinc-800 rounded-lg p-8 transition-colors">
                  <div className="max-w-md">
                    <FileCheck2 className="w-8 h-8 text-slate-300 dark:text-zinc-600 mb-3" />
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 mb-1">
                      No tailored resume generated yet
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed mb-6">
                      Paste a target job description on the left and click &ldquo;Tailor ATS Resume&rdquo; to trigger the 3-agent alignment pipeline.
                    </p>

                    <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-zinc-800">
                      <div className="flex items-start gap-2.5">
                        <span className="text-xs font-mono font-medium text-slate-400 dark:text-zinc-500">1</span>
                        <div>
                          <span className="text-xs font-medium text-slate-800 dark:text-zinc-200 block">JD Decoder</span>
                          <span className="text-xs text-slate-500 dark:text-zinc-400">Extracts hard technical constraints, core responsibilities, and eligibility keywords.</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <span className="text-xs font-mono font-medium text-slate-400 dark:text-zinc-500">2</span>
                        <div>
                          <span className="text-xs font-medium text-slate-800 dark:text-zinc-200 block">Resume Architect</span>
                          <span className="text-xs text-slate-500 dark:text-zinc-400">Selects and prioritizes verified projects and achievements from your Master Truth Vault.</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <span className="text-xs font-mono font-medium text-slate-400 dark:text-zinc-500">3</span>
                        <div>
                          <span className="text-xs font-medium text-slate-800 dark:text-zinc-200 block">ATS Critic</span>
                          <span className="text-xs text-slate-500 dark:text-zinc-400">Evaluates keyword density and formatting, performing iterative refinement.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : pipelineResult ? (
                /* Tailored Result View */
                <div>
                  {/* Action Bar (Download PDF & Generate Portal Pack) */}
                  <ActionBar
                    onDownloadPdf={handleDownloadPdf}
                    onGeneratePortalPack={handleGeneratePortalPack}
                    onReset={handleReset}
                    isDownloadingPdf={isDownloadingPdf}
                    isGeneratingPack={isGeneratingPack}
                    hasPortalPack={portalPack !== null}
                  />

                  {/* ATS Critique & Score Card */}
                  <ScoreCard
                    critique={pipelineResult.ats_critique}
                    attempts={pipelineResult.attempts}
                    status={pipelineResult.status}
                  />

                  {/* Structured Resume Preview & Portal Pack */}
                  <ResumePreview
                    tailoredResume={pipelineResult.tailored_resume}
                    decodedJd={pipelineResult.decoded_jd}
                    atsCritique={pipelineResult.ats_critique}
                    portalPack={portalPack}
                    onGeneratePortalPack={handleGeneratePortalPack}
                    isGeneratingPack={isGeneratingPack}
                  />
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
