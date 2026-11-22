"use client";

import React, { useState } from "react";
import { Experience, Education, Certification } from "@/types/vault";
import {
  Briefcase,
  GraduationCap,
  Award,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  MapPin,
  ExternalLink,
} from "lucide-react";

interface ExperienceEducationSectionProps {
  experience: Experience[];
  education: Education[];
  certifications: Certification[];
  onChangeExperience: (exp: Experience[]) => void;
  onChangeEducation: (edu: Education[]) => void;
  onChangeCertifications: (cert: Certification[]) => void;
}

export function ExperienceEducationSection({
  experience,
  education,
  certifications,
  onChangeExperience,
  onChangeEducation,
  onChangeCertifications,
}: ExperienceEducationSectionProps) {
  // Experience State
  const [editingExpIdx, setEditingExpIdx] = useState<number | null>(null);
  const [expFormData, setExpFormData] = useState<Experience | null>(null);
  const [isAddingExp, setIsAddingExp] = useState(false);

  // Education State
  const [editingEduIdx, setEditingEduIdx] = useState<number | null>(null);
  const [eduFormData, setEduFormData] = useState<Education | null>(null);
  const [isAddingEdu, setIsAddingEdu] = useState(false);

  // Certifications State
  const [editingCertIdx, setEditingCertIdx] = useState<number | null>(null);
  const [certFormData, setCertFormData] = useState<Certification | null>(null);
  const [isAddingCert, setIsAddingCert] = useState(false);

  // Experience handlers
  const handleStartAddExp = () => {
    setExpFormData({
      company: "",
      role: "",
      location: "",
      start_date: "",
      end_date: "",
      is_current: false,
      highlights: [],
      tech_stack: [],
    });
    setIsAddingExp(true);
    setEditingExpIdx(null);
  };

  const handleSaveExp = () => {
    if (!expFormData || !expFormData.company.trim() || !expFormData.role.trim() || !expFormData.start_date.trim()) {
      return;
    }
    const clean: Experience = {
      ...expFormData,
      company: expFormData.company.trim(),
      role: expFormData.role.trim(),
      location: expFormData.location?.trim() || null,
      start_date: expFormData.start_date.trim(),
      end_date: expFormData.is_current ? null : (expFormData.end_date?.trim() || null),
      is_current: expFormData.is_current,
      highlights: expFormData.highlights || [],
      tech_stack: expFormData.tech_stack || [],
    };
    if (isAddingExp) {
      onChangeExperience([clean, ...experience]);
      setIsAddingExp(false);
    } else if (editingExpIdx !== null) {
      const updated = [...experience];
      updated[editingExpIdx] = clean;
      onChangeExperience(updated);
      setEditingExpIdx(null);
    }
    setExpFormData(null);
  };

  // Education handlers
  const handleStartAddEdu = () => {
    setEduFormData({
      institution: "",
      degree: "",
      field_of_study: "",
      start_date: "",
      end_date: "",
      cgpa_or_percentage: "",
      graduation_year: new Date().getFullYear(),
    });
    setIsAddingEdu(true);
    setEditingEduIdx(null);
  };

  const handleSaveEdu = () => {
    if (!eduFormData || !eduFormData.institution.trim() || !eduFormData.degree.trim() || !eduFormData.start_date.trim()) {
      return;
    }
    const clean: Education = {
      institution: eduFormData.institution.trim(),
      degree: eduFormData.degree.trim(),
      field_of_study: eduFormData.field_of_study.trim(),
      start_date: eduFormData.start_date.trim(),
      end_date: eduFormData.end_date?.toString().trim() || null,
      cgpa_or_percentage: eduFormData.cgpa_or_percentage
        ? isNaN(Number(eduFormData.cgpa_or_percentage))
          ? eduFormData.cgpa_or_percentage.toString().trim()
          : Number(eduFormData.cgpa_or_percentage)
        : null,
      graduation_year: eduFormData.graduation_year ? Number(eduFormData.graduation_year) : null,
    };
    if (isAddingEdu) {
      onChangeEducation([...education, clean]);
      setIsAddingEdu(false);
    } else if (editingEduIdx !== null) {
      const updated = [...education];
      updated[editingEduIdx] = clean;
      onChangeEducation(updated);
      setEditingEduIdx(null);
    }
    setEduFormData(null);
  };

  // Certification handlers
  const handleStartAddCert = () => {
    setCertFormData({
      name: "",
      issuer: "",
      issue_date: "",
      credential_url: "",
    });
    setIsAddingCert(true);
    setEditingCertIdx(null);
  };

  const handleSaveCert = () => {
    if (!certFormData || !certFormData.name.trim() || !certFormData.issuer.trim()) {
      return;
    }
    const clean: Certification = {
      name: certFormData.name.trim(),
      issuer: certFormData.issuer.trim(),
      issue_date: certFormData.issue_date?.trim() || null,
      credential_url: certFormData.credential_url?.trim() || null,
    };
    if (isAddingCert) {
      onChangeCertifications([...certifications, clean]);
      setIsAddingCert(false);
    } else if (editingCertIdx !== null) {
      const updated = [...certifications];
      updated[editingCertIdx] = clean;
      onChangeCertifications(updated);
      setEditingCertIdx(null);
    }
    setCertFormData(null);
  };

  return (
    <div className="space-y-8">
      {/* SECTION 1: Professional Experience */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-semibold text-slate-900 dark:text-zinc-100 tracking-tight flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-500" /> Professional experience & internships
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Verified corporate roles, achievements, and technical contributions.
            </p>
          </div>
          {!isAddingExp && editingExpIdx === null && (
            <button
              type="button"
              onClick={handleStartAddExp}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-900 dark:bg-zinc-100 hover:bg-slate-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add role
            </button>
          )}
        </div>

        {/* Experience Form */}
        {(isAddingExp || editingExpIdx !== null) && expFormData && (
          <div className="bg-white dark:bg-[#111114] border-2 border-slate-300 dark:border-zinc-700 rounded-lg p-5 mb-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
              <h4 className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
                {isAddingExp ? "Add experience entry" : `Edit role: ${expFormData.role}`}
              </h4>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveExp}
                  disabled={!expFormData.company.trim() || !expFormData.role.trim() || !expFormData.start_date.trim()}
                  className="px-3 py-1 text-xs font-medium rounded-md bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                >
                  Save role
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExpFormData(null);
                    setIsAddingExp(false);
                    setEditingExpIdx(null);
                  }}
                  className="px-2 py-1 text-xs text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-md"
                >
                  Cancel
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Company / organization <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={expFormData.company}
                  onChange={(e) => setExpFormData({ ...expFormData, company: e.target.value })}
                  placeholder="e.g. Razorpay"
                  className="w-full text-xs px-3 py-1.5 rounded-md border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-emerald-600 bg-white dark:bg-[#18181B] text-slate-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Role / title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={expFormData.role}
                  onChange={(e) => setExpFormData({ ...expFormData, role: e.target.value })}
                  placeholder="e.g. Software Engineering Intern"
                  className="w-full text-xs px-3 py-1.5 rounded-md border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-emerald-600 bg-white dark:bg-[#18181B] text-slate-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Workplace location
                </label>
                <input
                  type="text"
                  value={expFormData.location || ""}
                  onChange={(e) => setExpFormData({ ...expFormData, location: e.target.value })}
                  placeholder="e.g. Bengaluru, India or Remote"
                  className="w-full text-xs px-3 py-1.5 rounded-md border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-emerald-600 bg-white dark:bg-[#18181B] text-slate-900 dark:text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                    Start date (YYYY-MM) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={expFormData.start_date}
                    onChange={(e) => setExpFormData({ ...expFormData, start_date: e.target.value })}
                    placeholder="2024-05"
                    className="w-full text-xs px-3 py-1.5 rounded-md border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-emerald-600 bg-white dark:bg-[#18181B] text-slate-900 dark:text-zinc-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                    End date (YYYY-MM)
                  </label>
                  <input
                    type="text"
                    disabled={expFormData.is_current}
                    value={expFormData.is_current ? "Present" : (expFormData.end_date || "")}
                    onChange={(e) => setExpFormData({ ...expFormData, end_date: e.target.value })}
                    placeholder="2024-07"
                    className="w-full text-xs px-3 py-1.5 rounded-md border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-emerald-600 bg-white dark:bg-[#18181B] text-slate-900 dark:text-zinc-100 font-mono disabled:bg-slate-100 dark:disabled:bg-zinc-800 disabled:text-slate-400 dark:disabled:text-zinc-600"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="is_current"
                checked={expFormData.is_current}
                onChange={(e) =>
                  setExpFormData({
                    ...expFormData,
                    is_current: e.target.checked,
                    end_date: e.target.checked ? null : expFormData.end_date,
                  })
                }
                className="rounded border-slate-300 dark:border-zinc-700 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="is_current" className="text-xs text-slate-700 dark:text-zinc-300">
                Currently working in this role
              </label>
            </div>
          </div>
        )}

        {/* Experience List */}
        {experience.length === 0 ? (
          <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-lg p-6 text-center text-xs text-slate-500 dark:text-zinc-400">
            No work experience recorded in this vault.
          </div>
        ) : (
          <div className="space-y-3">
            {experience.map((exp, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-lg p-4 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                      {exp.role} &bull; <span className="font-normal text-slate-700 dark:text-zinc-300">{exp.company}</span>
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-zinc-400 mt-1 font-mono">
                      <span className="flex items-center gap-1 tabular-nums">
                        <Calendar className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
                        {exp.start_date} &mdash; {exp.is_current ? "Present" : (exp.end_date || "Present")}
                      </span>
                      {exp.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
                          {exp.location}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingExpIdx(idx);
                        setExpFormData({ ...exp });
                        setIsAddingExp(false);
                      }}
                      className="p-1 rounded-md text-slate-400 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-200"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeExperience(experience.filter((_, i) => i !== idx))}
                      className="p-1 rounded-md text-slate-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {exp.highlights.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {exp.highlights.map((h, hIdx) => (
                      <p key={hIdx} className="text-xs text-slate-600 dark:text-zinc-400 flex items-start gap-2">
                        <span className="text-emerald-600 dark:text-emerald-500 font-bold">&bull;</span>
                        <span>{h}</span>
                      </p>
                    ))}
                  </div>
                )}

                {exp.tech_stack.length > 0 && (
                  <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                    {exp.tech_stack.map((tech) => (
                      <span
                        key={tech}
                        className="text-xs font-medium bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 px-2 py-0.5 rounded-md border border-slate-200 dark:border-zinc-700"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: Education & Academic Eligibility */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-semibold text-slate-900 dark:text-zinc-100 tracking-tight flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-500" /> Education & PMIS academic eligibility
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Degrees, universities, CGPA metrics, and graduation batch filters.
            </p>
          </div>
          {!isAddingEdu && editingEduIdx === null && (
            <button
              type="button"
              onClick={handleStartAddEdu}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-900 dark:bg-zinc-100 hover:bg-slate-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add education
            </button>
          )}
        </div>

        {/* Education Form */}
        {(isAddingEdu || editingEduIdx !== null) && eduFormData && (
          <div className="bg-white dark:bg-[#111114] border-2 border-slate-300 dark:border-zinc-700 rounded-lg p-5 mb-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
              <h4 className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
                {isAddingEdu ? "Add education credential" : "Edit education"}
              </h4>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveEdu}
                  disabled={!eduFormData.institution.trim() || !eduFormData.degree.trim() || !eduFormData.start_date.trim()}
                  className="px-3 py-1 text-xs font-medium rounded-md bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                >
                  Save education
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEduFormData(null);
                    setIsAddingEdu(false);
                    setEditingEduIdx(null);
                  }}
                  className="px-2 py-1 text-xs text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-md"
                >
                  Cancel
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Institution / university <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={eduFormData.institution}
                  onChange={(e) => setEduFormData({ ...eduFormData, institution: e.target.value })}
                  placeholder="e.g. Vellore Institute of Technology"
                  className="w-full text-xs px-3 py-1.5 rounded-md border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-emerald-600 bg-white dark:bg-[#18181B] text-slate-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Degree <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={eduFormData.degree}
                  onChange={(e) => setEduFormData({ ...eduFormData, degree: e.target.value })}
                  placeholder="e.g. Bachelor of Technology (B.Tech)"
                  className="w-full text-xs px-3 py-1.5 rounded-md border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-emerald-600 bg-white dark:bg-[#18181B] text-slate-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Field of study / major <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={eduFormData.field_of_study}
                  onChange={(e) => setEduFormData({ ...eduFormData, field_of_study: e.target.value })}
                  placeholder="e.g. Computer Science and Engineering"
                  className="w-full text-xs px-3 py-1.5 rounded-md border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-emerald-600 bg-white dark:bg-[#18181B] text-slate-900 dark:text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                    Start date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={eduFormData.start_date}
                    onChange={(e) => setEduFormData({ ...eduFormData, start_date: e.target.value })}
                    placeholder="2021-08"
                    className="w-full text-xs px-3 py-1.5 rounded-md border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-emerald-600 bg-white dark:bg-[#18181B] text-slate-900 dark:text-zinc-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                    End date
                  </label>
                  <input
                    type="text"
                    value={eduFormData.end_date || ""}
                    onChange={(e) => setEduFormData({ ...eduFormData, end_date: e.target.value })}
                    placeholder="2025-05"
                    className="w-full text-xs px-3 py-1.5 rounded-md border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-emerald-600 bg-white dark:bg-[#18181B] text-slate-900 dark:text-zinc-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  CGPA or percentage
                </label>
                <input
                  type="text"
                  value={eduFormData.cgpa_or_percentage ?? ""}
                  onChange={(e) => setEduFormData({ ...eduFormData, cgpa_or_percentage: e.target.value })}
                  placeholder="e.g. 8.85 or 85%"
                  className="w-full text-xs px-3 py-1.5 rounded-md border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-emerald-600 bg-white dark:bg-[#18181B] text-slate-900 dark:text-zinc-100 font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Graduation year (batch filter)
                </label>
                <input
                  type="number"
                  value={eduFormData.graduation_year ?? ""}
                  onChange={(e) =>
                    setEduFormData({
                      ...eduFormData,
                      graduation_year: e.target.value ? parseInt(e.target.value, 10) : null,
                    })
                  }
                  placeholder="2025"
                  className="w-full text-xs px-3 py-1.5 rounded-md border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-emerald-600 bg-white dark:bg-[#18181B] text-slate-900 dark:text-zinc-100 font-mono tabular-nums"
                />
              </div>
            </div>
          </div>
        )}

        {/* Education List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {education.map((edu, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-lg p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-zinc-100">{edu.institution}</h4>
                    <p className="text-xs text-slate-700 dark:text-zinc-300 mt-0.5">
                      {edu.degree} &bull; <span className="text-slate-500 dark:text-zinc-400">{edu.field_of_study}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEduIdx(idx);
                        setEduFormData({ ...edu });
                        setIsAddingEdu(false);
                      }}
                      className="p-1 rounded-md text-slate-400 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-200"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeEducation(education.filter((_, i) => i !== idx))}
                      className="p-1 rounded-md text-slate-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 flex-wrap text-xs font-mono tabular-nums">
                  <span className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 px-2 py-0.5 rounded-md border border-slate-200 dark:border-zinc-700">
                    {edu.start_date} &mdash; {edu.end_date || "Present"}
                  </span>
                  {edu.cgpa_or_percentage && (
                    <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 font-semibold">
                      CGPA: {edu.cgpa_or_percentage}
                    </span>
                  )}
                  {edu.graduation_year && (
                    <span className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 px-2 py-0.5 rounded-md border border-slate-200 dark:border-zinc-700">
                      Batch {edu.graduation_year}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: Certifications */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-semibold text-slate-900 dark:text-zinc-100 tracking-tight flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-500" /> Verified certifications & credentials
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Industry credentials with public verification links.
            </p>
          </div>
          {!isAddingCert && editingCertIdx === null && (
            <button
              type="button"
              onClick={handleStartAddCert}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-900 dark:bg-zinc-100 hover:bg-slate-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add certification
            </button>
          )}
        </div>

        {/* Cert Form */}
        {(isAddingCert || editingCertIdx !== null) && certFormData && (
          <div className="bg-white dark:bg-[#111114] border-2 border-slate-300 dark:border-zinc-700 rounded-lg p-5 mb-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
              <h4 className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
                {isAddingCert ? "Add industry credential" : "Edit certification"}
              </h4>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveCert}
                  disabled={!certFormData.name.trim() || !certFormData.issuer.trim()}
                  className="px-3 py-1 text-xs font-medium rounded-md bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                >
                  Save certification
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCertFormData(null);
                    setIsAddingCert(false);
                    setEditingCertIdx(null);
                  }}
                  className="px-2 py-1 text-xs text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-md"
                >
                  Cancel
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Certification name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={certFormData.name}
                  onChange={(e) => setCertFormData({ ...certFormData, name: e.target.value })}
                  placeholder="e.g. AWS Certified Solutions Architect"
                  className="w-full text-xs px-3 py-1.5 rounded-md border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-emerald-600 bg-white dark:bg-[#18181B] text-slate-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Issuing authority <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={certFormData.issuer}
                  onChange={(e) => setCertFormData({ ...certFormData, issuer: e.target.value })}
                  placeholder="e.g. Amazon Web Services"
                  className="w-full text-xs px-3 py-1.5 rounded-md border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-emerald-600 bg-white dark:bg-[#18181B] text-slate-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Issue date (YYYY-MM)
                </label>
                <input
                  type="text"
                  value={certFormData.issue_date || ""}
                  onChange={(e) => setCertFormData({ ...certFormData, issue_date: e.target.value })}
                  placeholder="2024-03"
                  className="w-full text-xs px-3 py-1.5 rounded-md border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-emerald-600 bg-white dark:bg-[#18181B] text-slate-900 dark:text-zinc-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Credential verification URL
                </label>
                <input
                  type="url"
                  value={certFormData.credential_url || ""}
                  onChange={(e) => setCertFormData({ ...certFormData, credential_url: e.target.value })}
                  placeholder="https://aws.amazon.com/verify/..."
                  className="w-full text-xs px-3 py-1.5 rounded-md border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-emerald-600 bg-white dark:bg-[#18181B] text-slate-900 dark:text-zinc-100 font-mono text-[11px]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Certifications List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certifications.map((cert, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-lg p-4 flex items-center justify-between"
            >
              <div>
                <h4 className="text-xs font-semibold text-slate-900 dark:text-zinc-100">{cert.name}</h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Issued by {cert.issuer} {cert.issue_date && `• ${cert.issue_date}`}
                </p>
                {cert.credential_url && (
                  <a
                    href={cert.credential_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-medium mt-1.5"
                  >
                    <span>Verify credential</span>
                    <ExternalLink className="w-3 h-3 text-emerald-600 dark:text-emerald-500" />
                  </a>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setEditingCertIdx(idx);
                    setCertFormData({ ...cert });
                    setIsAddingCert(false);
                  }}
                  className="p-1 rounded-md text-slate-400 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-200"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onChangeCertifications(certifications.filter((_, i) => i !== idx))}
                  className="p-1 rounded-md text-slate-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
