"use client";

import React from "react";
import { Download, Layers, Loader2, RotateCcw } from "lucide-react";

interface ActionBarProps {
  onDownloadPdf: () => void;
  onGeneratePortalPack: () => void;
  onReset: () => void;
  isDownloadingPdf: boolean;
  isGeneratingPack: boolean;
  hasPortalPack: boolean;
}

export function ActionBar({
  onDownloadPdf,
  onGeneratePortalPack,
  onReset,
  isDownloadingPdf,
  isGeneratingPack,
  hasPortalPack,
}: ActionBarProps) {
  return (
    <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-lg p-3.5 mb-5 flex flex-wrap items-center justify-between gap-3 transition-colors">
      {/* Left side actions */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Download ATS PDF Button */}
        <button
          type="button"
          onClick={onDownloadPdf}
          disabled={isDownloadingPdf}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md bg-slate-900 hover:bg-slate-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm whitespace-nowrap shrink-0"
        >
          {isDownloadingPdf ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Verifying & Generating PDF...</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5" />
              <span>Download ATS PDF</span>
            </>
          )}
        </button>

        {/* Generate Portal Pack Button */}
        <button
          type="button"
          onClick={onGeneratePortalPack}
          disabled={isGeneratingPack}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md border border-slate-300 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800/70 text-slate-700 dark:text-zinc-300 transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
        >
          {isGeneratingPack ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500 dark:text-zinc-400" />
              <span>Synthesizing Portal Pack...</span>
            </>
          ) : (
            <>
              <Layers className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
              <span>{hasPortalPack ? "Refresh Portal Pack" : "Generate Portal Pack"}</span>
            </>
          )}
        </button>
      </div>

      {/* Right side reset */}
      <button
        type="button"
        onClick={onReset}
        className="text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0"
        title="Clear results and start fresh"
      >
        <RotateCcw className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
        <span>New run</span>
      </button>
    </div>
  );
}
