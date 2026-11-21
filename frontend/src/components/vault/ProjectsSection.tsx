"use client";

import React, { useState } from "react";
import { Project } from "@/types/vault";
import { GitHubSyncBar } from "./GitHubSyncBar";
import { SyncGitHubResponse } from "@/lib/api";
import {
  ExternalLink,
  Github,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Code,
  TrendingUp,
  FolderGit2,
} from "lucide-react";

interface ProjectsSectionProps {
  userId: string;
  defaultGithubUsername?: string | null;
  projects: Project[];
  onChange: (updatedProjects: Project[]) => void;
  onRefreshVault: () => void;
}

export function ProjectsSection({
  userId,
  defaultGithubUsername,
  projects,
  onChange,
  onRefreshVault,
}: ProjectsSectionProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<Project | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [techStackInput, setTechStackInput] = useState("");
  const [highlightInput, setHighlightInput] = useState("");
  const [metricInput, setMetricInput] = useState("");

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditFormData({ ...projects[index] });
    setTechStackInput("");
    setHighlightInput("");
    setMetricInput("");
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditFormData(null);
    setIsAddingNew(false);
  };

  const saveEdit = () => {
    if (!editFormData || !editFormData.name.trim() || !editFormData.description.trim()) {
      return;
    }

    const cleanProject: Project = {
      ...editFormData,
      name: editFormData.name.trim(),
      id: editFormData.id.trim() || editFormData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      description: editFormData.description.trim(),
      tagline: editFormData.tagline?.trim() || null,
      repo_url: editFormData.repo_url?.trim() || null,
      live_url: editFormData.live_url?.trim() || null,
      tech_stack: editFormData.tech_stack || [],
      highlights: editFormData.highlights || [],
      metrics: editFormData.metrics || [],
    };

    if (isAddingNew) {
      onChange([cleanProject, ...projects]);
      setIsAddingNew(false);
    } else if (editingIndex !== null) {
      const updated = [...projects];
      updated[editingIndex] = cleanProject;
      onChange(updated);
      setEditingIndex(null);
    }

    setEditFormData(null);
  };

  const handleDelete = (index: number) => {
    const updated = projects.filter((_, idx) => idx !== index);
    onChange(updated);
  };

  const handleStartAdd = () => {
    const emptyProj: Project = {
      id: `project-${Date.now().toString(36)}`,
      name: "",
      tagline: null,
      description: "",
      highlights: [],
      tech_stack: [],
      repo_url: null,
      live_url: null,
      metrics: [],
    };
    setEditFormData(emptyProj);
    setIsAddingNew(true);
    setEditingIndex(null);
    setTechStackInput("");
    setHighlightInput("");
    setMetricInput("");
  };

  const addTechStackItem = () => {
    if (!techStackInput.trim() || !editFormData) return;
    if (!editFormData.tech_stack.includes(techStackInput.trim())) {
      setEditFormData({
        ...editFormData,
        tech_stack: [...editFormData.tech_stack, techStackInput.trim()],
      });
    }
    setTechStackInput("");
  };

  const removeTechStackItem = (item: string) => {
    if (!editFormData) return;
    setEditFormData({
      ...editFormData,
      tech_stack: editFormData.tech_stack.filter((t) => t !== item),
    });
  };

  const addHighlightItem = () => {
    if (!highlightInput.trim() || !editFormData) return;
    setEditFormData({
      ...editFormData,
      highlights: [...editFormData.highlights, highlightInput.trim()],
    });
    setHighlightInput("");
  };

  const removeHighlightItem = (idx: number) => {
    if (!editFormData) return;
    setEditFormData({
      ...editFormData,
      highlights: editFormData.highlights.filter((_, i) => i !== idx),
    });
  };

  const addMetricItem = () => {
    if (!metricInput.trim() || !editFormData) return;
    setEditFormData({
      ...editFormData,
      metrics: [...editFormData.metrics, metricInput.trim()],
    });
    setMetricInput("");
  };

  const removeMetricItem = (idx: number) => {
    if (!editFormData) return;
    setEditFormData({
      ...editFormData,
      metrics: editFormData.metrics.filter((_, i) => i !== idx),
    });
  };

  return (
    <div className="space-y-6">
      {/* 1-Click GitHub Auto-Import Bar */}
      <GitHubSyncBar
        userId={userId}
        defaultUsername={defaultGithubUsername}
        onSyncSuccess={(syncData: SyncGitHubResponse) => {
          onRefreshVault();
        }}
      />

      {/* Projects Header & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold text-slate-900 tracking-tight flex items-center gap-1.5">
            <FolderGit2 className="w-4 h-4 text-emerald-600" /> Verified projects portfolio
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Real production repositories, implementations, and quantified engineering impact.
          </p>
        </div>

        {!isAddingNew && editingIndex === null && (
          <button
            type="button"
            onClick={handleStartAdd}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-900 hover:bg-slate-800 text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add project
          </button>
        )}
      </div>

      {/* Modal / Inline Editor for Add or Edit */}
      {(isAddingNew || editingIndex !== null) && editFormData && (
        <div className="bg-white border-2 border-slate-300 rounded-lg p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 className="text-sm font-semibold text-slate-900">
              {isAddingNew ? "Add technical project" : `Edit project: ${editFormData.name}`}
            </h4>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={saveEdit}
                disabled={!editFormData.name.trim() || !editFormData.description.trim()}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" /> Save project
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md text-slate-600 hover:bg-slate-100"
              >
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Project name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                placeholder="e.g. ChronoQueue"
                className="w-full text-xs px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:border-emerald-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Unique slug / identifier <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={editFormData.id}
                onChange={(e) => setEditFormData({ ...editFormData, id: e.target.value })}
                placeholder="e.g. chrono-queue"
                className="w-full text-xs px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:border-emerald-600 bg-white font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Tagline / pitch
              </label>
              <input
                type="text"
                value={editFormData.tagline || ""}
                onChange={(e) => setEditFormData({ ...editFormData, tagline: e.target.value })}
                placeholder="One-line elevator pitch"
                className="w-full text-xs px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:border-emerald-600 bg-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                value={editFormData.description}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, description: e.target.value })
                }
                placeholder="Comprehensive factual overview of the system..."
                className="w-full text-xs p-3 rounded-md border border-slate-300 focus:outline-none focus:border-emerald-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Repository URL
              </label>
              <input
                type="url"
                value={editFormData.repo_url || ""}
                onChange={(e) => setEditFormData({ ...editFormData, repo_url: e.target.value })}
                placeholder="https://github.com/org/repo"
                className="w-full text-xs px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:border-emerald-600 bg-white font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Live deployment URL
              </label>
              <input
                type="url"
                value={editFormData.live_url || ""}
                onChange={(e) => setEditFormData({ ...editFormData, live_url: e.target.value })}
                placeholder="https://app.demo.com"
                className="w-full text-xs px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:border-emerald-600 bg-white font-mono text-[11px]"
              />
            </div>
          </div>

          {/* Tech Stack Chips Editor */}
          <div className="pt-3 border-t border-slate-100">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Tech stack technologies
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {editFormData.tech_stack.map((tech) => (
                <span
                  key={tech}
                  className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200"
                >
                  {tech}
                  <button
                    type="button"
                    onClick={() => removeTechStackItem(tech)}
                    className="text-slate-400 hover:text-rose-600 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={techStackInput}
                onChange={(e) => setTechStackInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTechStackItem();
                  }
                }}
                placeholder="e.g. Python, Docker, Redis..."
                className="text-xs px-2.5 py-1.5 rounded-md border border-slate-300 focus:outline-none focus:border-emerald-600 w-64 bg-white"
              />
              <button
                type="button"
                onClick={addTechStackItem}
                disabled={!techStackInput.trim()}
                className="px-2.5 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md disabled:opacity-50"
              >
                Add tech
              </button>
            </div>
          </div>

          {/* Highlights (STAR bullets) Editor */}
          <div className="pt-3 border-t border-slate-100">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Implementation highlights
            </label>
            <div className="space-y-1.5 mb-2">
              {editFormData.highlights.map((highlight, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between gap-2 text-xs bg-slate-50 p-2 rounded-md border border-slate-200 text-slate-800"
                >
                  <span>&bull; {highlight}</span>
                  <button
                    type="button"
                    onClick={() => removeHighlightItem(idx)}
                    className="text-slate-400 hover:text-rose-600 shrink-0 rounded"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={highlightInput}
                onChange={(e) => setHighlightInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addHighlightItem();
                  }
                }}
                placeholder="Add verified achievement bullet point..."
                className="flex-1 text-xs px-2.5 py-1.5 rounded-md border border-slate-300 focus:outline-none focus:border-emerald-600 bg-white"
              />
              <button
                type="button"
                onClick={addHighlightItem}
                disabled={!highlightInput.trim()}
                className="px-2.5 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md disabled:opacity-50"
              >
                Add highlight
              </button>
            </div>
          </div>

          {/* Metrics Editor */}
          <div className="pt-3 border-t border-slate-100">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Verified quantitative metrics
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {editFormData.metrics.map((metric, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200 font-mono"
                >
                  {metric}
                  <button
                    type="button"
                    onClick={() => removeMetricItem(idx)}
                    className="text-emerald-500 hover:text-rose-600 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={metricInput}
                onChange={(e) => setMetricInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addMetricItem();
                  }
                }}
                placeholder="e.g. Sub-850ms latency or 15,000+ jobs/sec..."
                className="text-xs px-2.5 py-1.5 rounded-md border border-slate-300 focus:outline-none focus:border-emerald-600 w-80 bg-white"
              />
              <button
                type="button"
                onClick={addMetricItem}
                disabled={!metricInput.trim()}
                className="px-2.5 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md disabled:opacity-50"
              >
                Add metric
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Projects List Cards */}
      {projects.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
          <FolderGit2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <h4 className="text-xs font-semibold text-slate-700 mb-1">No projects in vault</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Use the 1-Click GitHub sync above to auto-import your repositories or add a project manually.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((proj, idx) => (
            <div
              key={proj.id}
              className="bg-white border border-slate-200 rounded-lg p-5 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-semibold text-slate-900 tracking-tight">
                      {proj.name}
                    </h4>
                    <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200">
                      {proj.id}
                    </span>
                  </div>

                  {proj.tagline && (
                    <p className="text-xs text-slate-600 mt-1 font-medium">
                      {proj.tagline}
                    </p>
                  )}

                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {proj.description}
                  </p>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => startEdit(idx)}
                    className="p-1.5 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                    title="Edit project"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(idx)}
                    className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                    title="Delete project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Tech Stack Pills */}
              {proj.tech_stack.length > 0 && (
                <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                  <Code className="w-3 h-3 text-slate-400 shrink-0" />
                  {proj.tech_stack.map((tech) => (
                    <span
                      key={tech}
                      className="text-xs font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              )}

              {/* STAR Highlights */}
              {proj.highlights.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                  {proj.highlights.map((bullet, bIdx) => (
                    <div key={bIdx} className="text-xs text-slate-600 flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">&bull;</span>
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Metrics & Links Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Metrics */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {proj.metrics.length > 0 && (
                    <>
                      <TrendingUp className="w-3 h-3 text-emerald-600 shrink-0" />
                      {proj.metrics.map((m, mIdx) => (
                        <span
                          key={mIdx}
                          className="text-xs font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 tabular-nums"
                        >
                          {m}
                        </span>
                      ))}
                    </>
                  )}
                </div>

                {/* External Links */}
                <div className="flex items-center gap-3 text-xs shrink-0">
                  {proj.repo_url && (
                    <a
                      href={proj.repo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium"
                    >
                      <Github className="w-3.5 h-3.5" />
                      <span>Code</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                  )}
                  {proj.live_url && (
                    <a
                      href={proj.live_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-medium"
                    >
                      <span>Live demo</span>
                      <ExternalLink className="w-3 h-3 text-emerald-600" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
