"use client";

import React from "react";
import { MasterTruthVault } from "@/types/vault";
import { Check, Loader2, Save, RefreshCw } from "lucide-react";

interface TopBarProps {
  vault: MasterTruthVault;
  userId: string;
  isBackendConnected: boolean;
  isSaving: boolean;
  isDirty: boolean;
  onSave: () => void;
  onReload: () => void;
  lastSavedAt: string | null;
}

export function TopBar({
  vault,
  userId,
  isBackendConnected,
  isSaving,
  isDirty,
  onSave,
  onReload,
  lastSavedAt,
}: TopBarProps) {
  const candidateName = vault.basics.full_name?.trim() || "Untitled Candidate";

  return (
    <header className="sticky top-0 z-20 bg-white dark:bg-[#111114] border-b border-slate-200 dark:border-zinc-800 px-8 py-3.5 flex items-center justify-between transition-colors">
      {/* Left: Candidate identity & user context */}
      <div className="flex items-center gap-3 min-w-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-slate-900 dark:text-zinc-100 truncate">
              {candidateName}
            </h1>
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-mono bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-zinc-700">
              user: {userId}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Manage your verified projects, skills, and education used to tailor resumes.
          </p>
        </div>
      </div>

      {/* Right: Actions and Live Status */}
      <div className="flex items-center gap-4">
        {/* Minimal Quiet Connection Status (No Pill, No Glow, No Pulse) */}
        <div
          className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-zinc-400"
          title={
            isBackendConnected
              ? "Connected to FastAPI backend at http://127.0.0.1:8000"
              : "Cannot reach backend at http://127.0.0.1:8000"
          }
        >
          <span
            className={`w-2 h-2 rounded-sm ${
              isBackendConnected ? "bg-emerald-600" : "bg-rose-500"
            }`}
          />
          <span className="font-medium text-slate-700 dark:text-zinc-300">
            {isBackendConnected ? "Connected" : "Offline"}
          </span>
        </div>

        {/* Reload / Discard Button */}
        <button
          type="button"
          onClick={onReload}
          className="p-1.5 rounded-md text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700 transition-colors"
          title="Reload from backend"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

        {/* Save Status */}
        {lastSavedAt && !isDirty && (
          <span className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-400 dark:text-zinc-500 font-mono tabular-nums">
            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            Saved {new Date(lastSavedAt).toLocaleTimeString()}
          </span>
        )}

        {/* The ONE Bright Emerald Primary CTA Button */}
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving || !isBackendConnected}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Saving Vault...</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>{isDirty ? "Save Changes" : "Save Vault"}</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
