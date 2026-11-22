"use client";

import React from "react";
import { Basics, Education } from "@/types/vault";
import { User, Mail, Phone, MapPin, Linkedin, Github, Globe, Award } from "lucide-react";

interface ProfileSectionProps {
  basics: Basics;
  education: Education[];
  onChange: (updatedBasics: Basics) => void;
}

export function ProfileSection({ basics, education, onChange }: ProfileSectionProps) {
  const primaryEdu = education[0];

  const handleChange = (field: keyof Basics, value: string) => {
    onChange({
      ...basics,
      [field]: value.trim() === "" ? null : value,
    });
  };

  return (
    <div className="space-y-6">
      {/* Indian Govt & PMIS Eligibility Baseline Card */}
      <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-lg p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800 mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
              Indian Govt & PMIS eligibility baseline
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
            Eligibility metrics
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3.5 bg-slate-50 dark:bg-zinc-900/50 rounded-md border border-slate-200 dark:border-zinc-800">
            <span className="text-xs font-medium text-slate-600 dark:text-zinc-400 block mb-1">
              Domicile / state
            </span>
            <span className="text-sm font-semibold text-slate-900 dark:text-zinc-100 block truncate">
              {basics.location || "Not specified"}
            </span>
            <span className="text-xs text-slate-500 dark:text-zinc-500 mt-1 block">
              Used for state quota and domicile criteria
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-zinc-900/50 rounded-md border border-slate-200 dark:border-zinc-800">
            <span className="text-xs font-medium text-slate-600 dark:text-zinc-400 block mb-1">
              Verified CGPA / percentage
            </span>
            <span className="text-sm font-semibold text-slate-900 dark:text-zinc-100 font-mono tabular-nums block">
              {primaryEdu?.cgpa_or_percentage ? `${primaryEdu.cgpa_or_percentage} / 10` : "Not recorded"}
            </span>
            <span className="text-xs text-slate-500 dark:text-zinc-500 mt-1 block">
              PMIS / AICTE filter threshold: ≥ 6.0 CGPA
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-zinc-900/50 rounded-md border border-slate-200 dark:border-zinc-800">
            <span className="text-xs font-medium text-slate-600 dark:text-zinc-400 block mb-1">
              Graduation year / batch
            </span>
            <span className="text-sm font-semibold text-slate-900 dark:text-zinc-100 font-mono tabular-nums block">
              {primaryEdu?.graduation_year || "Not recorded"}
            </span>
            <span className="text-xs text-slate-500 dark:text-zinc-500 mt-1 block">
              NATS / PMIS apprentice batch validation
            </span>
          </div>
        </div>
      </div>

      {/* Core Biographical & Contact Details */}
      <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 pb-3 border-b border-slate-100 dark:border-zinc-800 mb-5 flex items-center gap-2">
          <User className="w-4 h-4 text-slate-600 dark:text-zinc-400" /> Candidate identity & contact
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
              Full legal name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={basics.full_name || ""}
              onChange={(e) => handleChange("full_name", e.target.value)}
              placeholder="Candidate's full name"
              required
              className="w-full text-xs px-3 py-2 rounded-md border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white dark:bg-[#18181B] text-slate-900 dark:text-zinc-100"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
              Primary email <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 dark:text-zinc-500" />
              <input
                type="email"
                value={basics.email || ""}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="name@domain.com"
                required
                className="w-full text-xs pl-8 pr-3 py-2 rounded-md border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white dark:bg-[#18181B] text-slate-900 dark:text-zinc-100 font-mono"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
              Phone number <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 dark:text-zinc-500" />
              <input
                type="text"
                value={basics.phone || ""}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="+91-XXXXXXXXXX"
                required
                className="w-full text-xs pl-8 pr-3 py-2 rounded-md border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white dark:bg-[#18181B] text-slate-900 dark:text-zinc-100 font-mono tabular-nums"
              />
            </div>
          </div>

          {/* Location / Domicile */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
              Location / domicile <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 dark:text-zinc-500" />
              <input
                type="text"
                value={basics.location || ""}
                onChange={(e) => handleChange("location", e.target.value)}
                placeholder="City, State, Country"
                required
                className="w-full text-xs pl-8 pr-3 py-2 rounded-md border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white dark:bg-[#18181B] text-slate-900 dark:text-zinc-100"
              />
            </div>
          </div>
        </div>

        {/* Professional Profiles */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-zinc-800">
          <h4 className="text-xs font-semibold text-slate-800 dark:text-zinc-200 mb-4">
            Professional presence & links
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* LinkedIn */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">
                LinkedIn profile URL
              </label>
              <div className="relative">
                <Linkedin className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 dark:text-zinc-500" />
                <input
                  type="url"
                  value={basics.linkedin_url || ""}
                  onChange={(e) => handleChange("linkedin_url", e.target.value)}
                  placeholder="https://linkedin.com/in/handle"
                  className="w-full text-xs pl-8 pr-3 py-2 rounded-md border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white dark:bg-[#18181B] text-slate-900 dark:text-zinc-100 font-mono text-[11px]"
                />
              </div>
            </div>

            {/* GitHub */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">
                GitHub username
              </label>
              <div className="relative">
                <Github className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 dark:text-zinc-500" />
                <input
                  type="text"
                  value={basics.github_username || ""}
                  onChange={(e) => handleChange("github_username", e.target.value)}
                  placeholder="github-username"
                  className="w-full text-xs pl-8 pr-3 py-2 rounded-md border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white dark:bg-[#18181B] text-slate-900 dark:text-zinc-100 font-mono text-[11px]"
                />
              </div>
            </div>

            {/* Portfolio */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">
                Portfolio website
              </label>
              <div className="relative">
                <Globe className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 dark:text-zinc-500" />
                <input
                  type="url"
                  value={basics.portfolio_url || ""}
                  onChange={(e) => handleChange("portfolio_url", e.target.value)}
                  placeholder="https://portfolio.dev"
                  className="w-full text-xs pl-8 pr-3 py-2 rounded-md border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white dark:bg-[#18181B] text-slate-900 dark:text-zinc-100 font-mono text-[11px]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Professional Summary */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-zinc-800">
          <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
            Factual professional summary
          </label>
          <textarea
            rows={3}
            value={basics.summary || ""}
            onChange={(e) => handleChange("summary", e.target.value)}
            placeholder="Grounding summary highlighting verified expertise..."
            className="w-full text-xs p-3 rounded-md border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white dark:bg-[#18181B] leading-relaxed text-slate-800 dark:text-zinc-200"
          />
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Must remain 100% grounded in verified experience, projects, and credentials.
          </p>
        </div>
      </div>
    </div>
  );
}
