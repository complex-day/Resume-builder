"use client";

import React, { useState } from "react";
import { api, SyncGitHubResponse } from "@/lib/api";
import { Github, Loader2, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

interface GitHubSyncBarProps {
  userId: string;
  defaultUsername?: string | null;
  onSyncSuccess: (syncData: SyncGitHubResponse) => void;
}

export function GitHubSyncBar({
  userId,
  defaultUsername = "",
  onSyncSuccess,
}: GitHubSyncBarProps) {
  const [username, setUsername] = useState(defaultUsername || "");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(
    null
  );

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim();
    if (!cleanUser) {
      setMessage({ text: "Please enter a valid GitHub username.", type: "error" });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await api.syncGitHub(userId, cleanUser, 6);
      setMessage({
        text: `Synced ${response.total_projects} total projects (${response.newly_added_count} newly imported, ${response.skipped_project_ids.length} existing preserved).`,
        type: "success",
      });
      onSyncSuccess(response);
    } catch (err: any) {
      setMessage({
        text: err?.message || "Failed to sync GitHub repositories.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-lg p-4 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left description */}
        <div>
          <div className="flex items-center gap-2">
            <Github className="w-4 h-4 text-slate-800 dark:text-zinc-200" />
            <h3 className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
              1-Click GitHub repository sync
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Imports non-forked public repositories with verified tech stacks into your Master Truth Vault.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSync} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto shrink-0">
          <div className="relative flex-1 sm:flex-initial">
            <span className="absolute left-2.5 top-2 text-xs text-slate-400 dark:text-zinc-500 font-mono select-none">
              github.com/
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              disabled={isLoading}
              className="text-xs pl-[86px] pr-3 py-1.5 rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-[#18181B] text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-mono w-full sm:w-56"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !username.trim()}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900 dark:bg-zinc-100 hover:bg-slate-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Syncing repos...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync GitHub repos</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Status banner */}
      {message && (
        <div
          className={`mt-3 px-3 py-2 rounded-md text-xs flex items-center gap-2 border ${
            message.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}
    </div>
  );
}
