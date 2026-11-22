"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useUser } from "@/context/UserContext";
import { api } from "@/lib/api";
import { MasterTruthVault, createEmptyVault } from "@/types/vault";
import { TopBar } from "@/components/vault/TopBar";
import { ProfileSection } from "@/components/vault/ProfileSection";
import { SkillsSection } from "@/components/vault/SkillsSection";
import { ProjectsSection } from "@/components/vault/ProjectsSection";
import { ExperienceEducationSection } from "@/components/vault/ExperienceEducationSection";
import {
  UserCheck,
  FolderGit2,
  Cpu,
  GraduationCap,
  AlertTriangle,
  Loader2,
  CheckCircle2,
} from "lucide-react";

type ActiveTab = "profile" | "skills" | "projects" | "experience";

export default function VaultStudioPage() {
  const { userId } = useUser();

  const [vault, setVault] = useState<MasterTruthVault | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("profile");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  // Health-check backend connectivity
  const checkBackend = useCallback(async () => {
    const isUp = await api.checkHealth();
    setIsBackendConnected(isUp);
    return isUp;
  }, []);

  // Fetch or initialize vault for active user
  const loadVault = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await checkBackend();
      const data = await api.getVault(userId);
      setVault(data);
      setIsDirty(false);
      setLastSavedAt(data.updated_at || null);
    } catch (err: any) {
      if (err?.status === 404) {
        // Clean empty state if user_id returns 404
        const empty = createEmptyVault();
        setVault(empty);
        setIsDirty(false);
        setLastSavedAt(null);
      } else {
        setErrorMessage(err?.message || `Failed to connect to backend for user '${userId}'.`);
        setIsBackendConnected(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId, checkBackend]);

  useEffect(() => {
    loadVault();
  }, [loadVault]);

  // Periodic health check ping every 15s
  useEffect(() => {
    const interval = setInterval(checkBackend, 15000);
    return () => clearInterval(interval);
  }, [checkBackend]);

  const handleSave = async () => {
    if (!vault) return;
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessNotice(null);

    try {
      const response = await api.saveVault(userId, vault);
      setIsDirty(false);
      setLastSavedAt(response.updated_at);
      setSuccessNotice(`Vault saved successfully (${response.project_count} projects).`);
      setTimeout(() => setSuccessNotice(null), 4000);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to persist Master Truth Vault.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12">
        <Loader2 className="w-5 h-5 animate-spin text-emerald-600 dark:text-emerald-500 mb-3" />
        <span className="text-xs font-medium text-slate-600 dark:text-zinc-400">
          Loading Master Truth Vault for <span className="font-mono text-slate-900 dark:text-zinc-100">{userId}</span>...
        </span>
      </div>
    );
  }

  if (!vault) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-lg p-6 text-rose-800 dark:text-rose-200">
          <div className="flex items-center gap-2 font-semibold text-sm mb-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            Backend Connection Blocked
          </div>
          <p className="text-xs leading-relaxed mb-4">
            Could not retrieve data from <code className="font-mono bg-rose-100 dark:bg-rose-900/60 px-1 py-0.5 rounded">http://127.0.0.1:8000</code>.
            Ensure the FastAPI server is running.
          </p>
          <button
            type="button"
            onClick={loadVault}
            className="text-xs font-medium bg-rose-800 hover:bg-rose-900 text-white px-3 py-1.5 rounded-md"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const tabs: { id: ActiveTab; label: string; icon: React.ElementType; count?: number }[] = [
    {
      id: "profile",
      label: "Profile & Eligibility",
      icon: UserCheck,
    },
    {
      id: "skills",
      label: "Skills",
      icon: Cpu,
      count: vault.skills.reduce((acc, cat) => acc + cat.skills.length, 0),
    },
    {
      id: "projects",
      label: "Projects",
      icon: FolderGit2,
      count: vault.projects.length,
    },
    {
      id: "experience",
      label: "Experience & Education",
      icon: GraduationCap,
      count: vault.experience.length + vault.education.length,
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Top Bar with candidate name, connection pill, user switcher & save button */}
      <TopBar
        vault={vault}
        userId={userId}
        isBackendConnected={isBackendConnected}
        isSaving={isSaving}
        isDirty={isDirty}
        onSave={handleSave}
        onReload={loadVault}
        lastSavedAt={lastSavedAt}
      />

      {/* Main Body */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-8 py-6">
        {/* Alerts / Banners */}
        {errorMessage && (
          <div className="mb-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs px-4 py-3 rounded-md flex items-center justify-between">
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

        {successNotice && (
          <div className="mb-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-xs px-4 py-3 rounded-md flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Clean Section Tabs */}
        <div className="border-b border-slate-200 dark:border-zinc-800 mb-6">
          <nav className="flex space-x-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group inline-flex items-center gap-2 py-3 px-1 border-b-2 text-xs font-medium transition-colors ${
                    isActive
                      ? "border-emerald-600 text-slate-900 dark:text-zinc-100"
                      : "border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:border-slate-300 dark:hover:border-zinc-700"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? "text-emerald-600 dark:text-emerald-500" : "text-slate-400 dark:text-zinc-500 group-hover:text-slate-600 dark:group-hover:text-zinc-300"
                    }`}
                  />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`text-[11px] font-mono font-medium px-1.5 py-0.5 rounded-md tabular-nums ${
                        isActive
                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                          : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content Panels */}
        <div className="pb-16">
          {activeTab === "profile" && (
            <ProfileSection
              basics={vault.basics}
              education={vault.education}
              onChange={(updatedBasics) => {
                setVault({ ...vault, basics: updatedBasics });
                setIsDirty(true);
              }}
            />
          )}

          {activeTab === "skills" && (
            <SkillsSection
              skills={vault.skills}
              onChange={(updatedSkills) => {
                setVault({ ...vault, skills: updatedSkills });
                setIsDirty(true);
              }}
            />
          )}

          {activeTab === "projects" && (
            <ProjectsSection
              userId={userId}
              defaultGithubUsername={vault.basics.github_username}
              projects={vault.projects}
              onChange={(updatedProjects) => {
                setVault({ ...vault, projects: updatedProjects });
                setIsDirty(true);
              }}
              onRefreshVault={loadVault}
            />
          )}

          {activeTab === "experience" && (
            <ExperienceEducationSection
              experience={vault.experience}
              education={vault.education}
              certifications={vault.certifications}
              onChangeExperience={(updatedExp) => {
                setVault({ ...vault, experience: updatedExp });
                setIsDirty(true);
              }}
              onChangeEducation={(updatedEdu) => {
                setVault({ ...vault, education: updatedEdu });
                setIsDirty(true);
              }}
              onChangeCertifications={(updatedCert) => {
                setVault({ ...vault, certifications: updatedCert });
                setIsDirty(true);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
