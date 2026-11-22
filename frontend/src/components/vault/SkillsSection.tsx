"use client";

import React, { useState } from "react";
import { SkillCategory } from "@/types/vault";
import { Plus, X, Layers, Trash2, Check } from "lucide-react";

interface SkillsSectionProps {
  skills: SkillCategory[];
  onChange: (updatedSkills: SkillCategory[]) => void;
}

export function SkillsSection({ skills, onChange }: SkillsSectionProps) {
  const [newSkillInputs, setNewSkillInputs] = useState<Record<number, string>>({});
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const totalSkillCount = skills.reduce((acc, cat) => acc + cat.skills.length, 0);

  const handleAddSkill = (catIndex: number) => {
    const skillName = (newSkillInputs[catIndex] || "").trim();
    if (!skillName) return;

    const updated = [...skills];
    if (!updated[catIndex].skills.includes(skillName)) {
      updated[catIndex] = {
        ...updated[catIndex],
        skills: [...updated[catIndex].skills, skillName],
      };
      onChange(updated);
    }

    setNewSkillInputs((prev) => ({ ...prev, [catIndex]: "" }));
  };

  const handleRemoveSkill = (catIndex: number, skillToRemove: string) => {
    const updated = [...skills];
    updated[catIndex] = {
      ...updated[catIndex],
      skills: updated[catIndex].skills.filter((s) => s !== skillToRemove),
    };
    onChange(updated);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newCategoryName.trim();
    if (!cleanName) return;

    if (!skills.some((c) => c.category_name.toLowerCase() === cleanName.toLowerCase())) {
      onChange([...skills, { category_name: cleanName, skills: [] }]);
    }
    setNewCategoryName("");
    setIsAddingCategory(false);
  };

  const handleRemoveCategory = (catIndex: number) => {
    const updated = skills.filter((_, idx) => idx !== catIndex);
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      {/* Top Overview Bar */}
      <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-lg p-4 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold text-slate-900 dark:text-zinc-100 tracking-tight flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-500" /> Categorized skills taxonomy
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Verified technical competencies indexed for ATS keyword coverage and gap detection.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-medium text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-zinc-700 tabular-nums">
            Total: {totalSkillCount} skills
          </span>
          {!isAddingCategory && (
            <button
              type="button"
              onClick={() => setIsAddingCategory(true)}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md bg-slate-900 dark:bg-zinc-100 hover:bg-slate-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add category
            </button>
          )}
        </div>
      </div>

      {/* Add Category Form */}
      {isAddingCategory && (
        <form
          onSubmit={handleAddCategory}
          className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-lg p-4 flex items-center gap-3"
        >
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="e.g. Cloud & DevOps or Machine Learning"
            className="flex-1 text-xs px-3 py-1.5 rounded-md border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-emerald-600 bg-white dark:bg-[#18181B] text-slate-900 dark:text-zinc-100"
            autoFocus
          />
          <button
            type="submit"
            disabled={!newCategoryName.trim()}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" /> Save category
          </button>
          <button
            type="button"
            onClick={() => setIsAddingCategory(false)}
            className="text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 px-2 py-1.5"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {skills.map((category, catIndex) => (
          <div
            key={category.category_name}
            className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-lg p-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800 mb-3.5">
                <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100 tracking-tight">
                  {category.category_name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400 dark:text-zinc-500 tabular-nums">
                    {category.skills.length} skills
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCategory(catIndex)}
                    className="text-slate-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors p-1"
                    title={`Delete ${category.category_name} category`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Skill chips */}
              <div className="flex flex-wrap gap-1.5 min-h-[48px] content-start">
                {category.skills.length === 0 ? (
                  <span className="text-xs text-slate-400 dark:text-zinc-500 italic">No skills added yet</span>
                ) : (
                  category.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-800 dark:text-zinc-200 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200/80 dark:hover:bg-zinc-700 px-2.5 py-1 rounded-md border border-slate-200 dark:border-zinc-700 transition-colors"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(catIndex, skill)}
                        className="text-slate-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 rounded"
                        title={`Remove ${skill}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Inline Add Skill Input */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center gap-2">
              <input
                type="text"
                value={newSkillInputs[catIndex] || ""}
                onChange={(e) =>
                  setNewSkillInputs((prev) => ({ ...prev, [catIndex]: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSkill(catIndex);
                  }
                }}
                placeholder={`Add to ${category.category_name}...`}
                className="flex-1 text-xs px-2.5 py-1 rounded-md border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-emerald-600 bg-white dark:bg-[#18181B] text-slate-900 dark:text-zinc-100"
              />
              <button
                type="button"
                onClick={() => handleAddSkill(catIndex)}
                disabled={!(newSkillInputs[catIndex] || "").trim()}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 disabled:opacity-40 transition-colors"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
