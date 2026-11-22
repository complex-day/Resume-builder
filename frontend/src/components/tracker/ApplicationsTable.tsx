"use client";

import React, { useState } from "react";
import {
  ApplicationRecord,
  ApplicationStatus,
} from "@/types/tracker";
import {
  Search,
  ExternalLink,
  Trash2,
  Calendar,
  Layers,
} from "lucide-react";

interface ApplicationsTableProps {
  applications: ApplicationRecord[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  onStatusChange: (applicationId: string, newStatus: ApplicationStatus) => void;
  onDelete: (applicationId: string) => void;
  isUpdatingId: string | null;
}

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: "applied", label: "Applied" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
  { value: "saved", label: "Saved" },
];

export function ApplicationsTable({
  applications,
  activeFilter,
  onFilterChange,
  onStatusChange,
  onDelete,
  isUpdatingId,
}: ApplicationsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filterTabs = [
    { id: "all", label: "All" },
    { id: "applied", label: "Applied" },
    { id: "shortlisted", label: "Shortlisted" },
    { id: "interview", label: "Interview" },
    { id: "offer", label: "Offer" },
    { id: "rejected", label: "Rejected" },
    { id: "saved", label: "Saved" },
  ];

  const filteredApps = applications.filter((app) => {
    // 1. Filter by status tab
    if (activeFilter !== "all" && app.status.toLowerCase() !== activeFilter) {
      return false;
    }

    // 2. Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCompany = app.company_name.toLowerCase().includes(q);
      const matchRole = app.role_title.toLowerCase().includes(q);
      const matchPortal = app.detected_portal.toLowerCase().includes(q);
      return matchCompany || matchRole || matchPortal;
    }

    return true;
  });

  const getStatusBadgeStyle = (status: ApplicationStatus) => {
    switch (status) {
      case "offer":
        return "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
      case "interview":
        return "bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800";
      case "shortlisted":
        return "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800";
      case "rejected":
        return "bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800";
      case "saved":
        return "bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800";
      case "applied":
      default:
        return "bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-300 border-slate-200 dark:border-zinc-700";
    }
  };

  return (
    <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden transition-colors">
      {/* Top Filter and Search Bar */}
      <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab.id;
            const count =
              tab.id === "all"
                ? applications.length
                : applications.filter((a) => a.status.toLowerCase() === tab.id).length;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onFilterChange(tab.id)}
                className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? "bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[11px] font-mono tabular-nums px-1 rounded ${
                    isActive ? "bg-slate-800 dark:bg-zinc-200 text-emerald-300 dark:text-emerald-700" : "text-slate-400 dark:text-zinc-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative shrink-0">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400 dark:text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search company or role..."
            className="text-xs pl-8 pr-3 py-1.5 rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 w-full sm:w-56"
          />
        </div>
      </div>

      {/* Table Content */}
      {filteredApps.length === 0 ? (
        <div className="py-12 px-6 text-center bg-blueprint-grid">
          <Layers className="w-8 h-8 text-slate-300 dark:text-zinc-600 mx-auto mb-2" />
          <h4 className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
            No applications match this view
          </h4>
          <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
            {applications.length === 0
              ? "You haven't logged any applications yet. Click 'Log Application' above to record your tailored submissions."
              : "Try switching to the 'All' filter or clearing your search query."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/50 text-slate-500 dark:text-zinc-400 font-medium">
                <th className="py-2.5 px-4 font-medium">Company & role</th>
                <th className="py-2.5 px-3 font-medium">Portal</th>
                <th className="py-2.5 px-3 font-medium">ATS score</th>
                <th className="py-2.5 px-3 font-medium">Style</th>
                <th className="py-2.5 px-3 font-medium">Applied date</th>
                <th className="py-2.5 px-4 font-medium">Status lifecycle</th>
                <th className="py-2.5 px-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
              {filteredApps.map((app) => {
                const isUpdating = isUpdatingId === app.application_id;

                return (
                  <tr key={app.application_id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-850 transition-colors">
                    {/* Company & Role */}
                    <td className="py-3 px-4">
                      <div className="flex items-start gap-2">
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-zinc-100 block">
                            {app.company_name}
                          </span>
                          <span className="text-xs text-slate-600 dark:text-zinc-400 block">
                            {app.role_title}
                          </span>
                          {app.notes && (
                            <span className="text-[11px] text-slate-400 dark:text-zinc-500 block mt-0.5 truncate max-w-xs" title={app.notes}>
                              Note: {app.notes}
                            </span>
                          )}
                        </div>
                        {app.source_url && (
                          <a
                            href={app.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-slate-700 dark:hover:text-zinc-300 mt-0.5"
                            title="Open job link"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Portal */}
                    <td className="py-3 px-3">
                      <span className="font-mono text-xs text-slate-600 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-zinc-700">
                        {app.detected_portal}
                      </span>
                    </td>

                    {/* ATS Score */}
                    <td className="py-3 px-3 font-mono tabular-nums">
                      <span
                        className={`font-semibold ${
                          app.ats_score >= 85
                            ? "text-emerald-700 dark:text-emerald-400"
                            : app.ats_score >= 70
                            ? "text-slate-700 dark:text-zinc-300"
                            : "text-amber-700 dark:text-amber-400"
                        }`}
                      >
                        {app.ats_score}%
                      </span>
                    </td>

                    {/* Resume Style */}
                    <td className="py-3 px-3 text-slate-500 dark:text-zinc-400 font-mono text-[11px]">
                      {app.style_tag.replace(/_/g, " ")}
                    </td>

                    {/* Applied Date */}
                    <td className="py-3 px-3 font-mono text-slate-500 dark:text-zinc-400 tabular-nums text-[11px]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
                        {app.created_at ? app.created_at.split("T")[0] : "—"}
                      </span>
                    </td>

                    {/* Status Dropdown */}
                    <td className="py-3 px-4">
                      <div className="relative inline-block">
                        <select
                          value={app.status}
                          disabled={isUpdating}
                          onChange={(e) =>
                            onStatusChange(app.application_id, e.target.value as ApplicationStatus)
                          }
                          className={`text-xs font-medium px-2 py-1 pr-6 rounded-md border appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-600 disabled:opacity-50 ${getStatusBadgeStyle(
                            app.status
                          )}`}
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value} className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200">
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        {isUpdating && (
                          <span className="absolute right-2 top-2 text-[10px] text-slate-400">...</span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => onDelete(app.application_id)}
                        className="p-1.5 text-slate-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                        title="Delete application record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
