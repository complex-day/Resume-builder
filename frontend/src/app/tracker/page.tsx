"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@/context/UserContext";
import { api } from "@/lib/api";
import {
  ApplicationRecord,
  ApplicationStatus,
  ApplicationCreateRequest,
  TrackerAnalyticsResponse,
} from "@/types/tracker";
import { AnalyticsStrip } from "@/components/tracker/AnalyticsStrip";
import { ApplicationsTable } from "@/components/tracker/ApplicationsTable";
import { LogApplicationModal } from "@/components/tracker/LogApplicationModal";
import {
  Kanban,
  Plus,
  AlertTriangle,
  RefreshCw,
  Loader2,
  CheckCircle2,
} from "lucide-react";

export default function TrackerPage() {
  const { userId } = useUser();

  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [analytics, setAnalytics] = useState<TrackerAnalyticsResponse | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load applications and analytics from backend
  const loadTrackerData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [apps, stats] = await Promise.all([
        api.listApplications(userId),
        api.getTrackerAnalytics(userId),
      ]);
      setApplications(apps);
      setAnalytics(stats);
    } catch (err: any) {
      setErrorMessage(
        err?.message || `Failed to load application tracker data for user '${userId}'.`
      );
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadTrackerData();
  }, [loadTrackerData]);

  // Handle inline status update
  const handleStatusChange = async (
    applicationId: string,
    newStatus: ApplicationStatus
  ) => {
    setIsUpdatingId(applicationId);
    setErrorMessage(null);
    try {
      const updated = await api.updateApplicationStatus(userId, applicationId, {
        status: newStatus,
      });

      // Update local state instantly
      setApplications((prev) =>
        prev.map((a) => (a.application_id === applicationId ? updated : a))
      );

      // Refresh analytics in background
      api.getTrackerAnalytics(userId).then(setAnalytics).catch(() => {});

      setSuccessMessage(`Updated status to '${newStatus}'.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to update application status.");
    } finally {
      setIsUpdatingId(null);
    }
  };

  // Handle application delete
  const handleDelete = async (applicationId: string) => {
    if (!confirm("Are you sure you want to delete this application record?")) {
      return;
    }

    setErrorMessage(null);
    try {
      await api.deleteApplication(userId, applicationId);

      // Remove from local list
      setApplications((prev) => prev.filter((a) => a.application_id !== applicationId));

      // Refresh analytics in background
      api.getTrackerAnalytics(userId).then(setAnalytics).catch(() => {});

      setSuccessMessage("Application record deleted.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to delete application.");
    }
  };

  // Handle log new application
  const handleSaveNewApplication = async (payload: ApplicationCreateRequest) => {
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const created = await api.createApplication(payload);

      // Add to local list
      setApplications((prev) => [created, ...prev]);

      // Refresh analytics in background
      api.getTrackerAnalytics(userId).then(setAnalytics).catch(() => {});

      setSuccessMessage(`Logged application for ${created.company_name}.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to log new application.");
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white dark:bg-[#111114] border-b border-slate-200 dark:border-zinc-800 px-4 py-3 md:px-8 md:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <Kanban className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
              Application Tracker
            </h1>
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-mono bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-zinc-700 whitespace-nowrap">
              user: {userId}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Track tailored applications, update interview statuses, and monitor callback rates.
          </p>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={loadTrackerData}
            disabled={isLoading}
            className="p-1.5 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 border border-slate-200 dark:border-zinc-800 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors shrink-0"
            title="Refresh application tracker"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          {/* THE ONE PRIMARY EMERALD CTA BUTTON */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Application</span>
          </button>
        </div>
      </header>

      {/* Main Viewport Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-4 md:px-8 md:py-6">
        {/* Error banner */}
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

        {/* Success toast */}
        {successMessage && (
          <div className="mb-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-xs px-4 py-2.5 rounded-md flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Real Callback Analytics Strip (Data-Driven Only) */}
        <AnalyticsStrip analytics={analytics} isLoading={isLoading} />

        {/* Applications Filter Bar & Table */}
        {isLoading && applications.length === 0 ? (
          <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-lg p-12 text-center text-xs text-slate-500 dark:text-zinc-400 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600 dark:text-emerald-500" />
            <span>Loading applications from backend...</span>
          </div>
        ) : (
          <ApplicationsTable
            applications={applications}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
            isUpdatingId={isUpdatingId}
          />
        )}
      </div>

      {/* Log Application Modal */}
      <LogApplicationModal
        userId={userId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveNewApplication}
        isSaving={isSaving}
      />
    </div>
  );
}
