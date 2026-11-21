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
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold text-slate-900 tracking-tight flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-600" /> Categorized skills taxonomy
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified technical competencies indexed for ATS keyword coverage and gap detection.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 tabular-nums">
            Total: {totalSkillCount} skills
          </span>
          {!isAddingCategory && (
            <button
              type="button"
              onClick={() => setIsAddingCategory(true)}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md bg-slate-900 hover:bg-slate-800 text-white transition-colors"
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
          className="bg-white border border-slate-200 rounded-lg p-4 flex items-center gap-3"
        >
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="e.g. Cloud & DevOps or Machine Learning"
            className="flex-1 text-xs px-3 py-1.5 rounded-md border border-slate-300 focus:outline-none focus:border-emerald-600 bg-white"
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
            className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1.5"
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
            className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3.5">
                <span className="text-xs font-semibold text-slate-900 tracking-tight">
                  {category.category_name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400 tabular-nums">
                    {category.skills.length} skills
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCategory(catIndex)}
                    className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                    title={`Delete ${category.category_name} category`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Skill chips */}
              <div className="flex flex-wrap gap-1.5 min-h-[48px] content-start">
                {category.skills.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">No skills added yet</span>
                ) : (
                  category.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1 rounded-md border border-slate-200 transition-colors"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(catIndex, skill)}
                        className="text-slate-400 hover:text-rose-600 rounded"
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
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
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
                className="flex-1 text-xs px-2.5 py-1 rounded-md border border-slate-200 focus:outline-none focus:border-emerald-600 bg-white"
              />
              <button
                type="button"
                onClick={() => handleAddSkill(catIndex)}
                disabled={!(newSkillInputs[catIndex] || "").trim()}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 transition-colors"
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
