"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/context/UserContext";
import {
  ShieldCheck,
  Wand2,
  Kanban,
  Zap,
  User,
  Plus,
  Check,
  Layers,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const { userId, setUserId, availableUsers } = useUser();
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserIdInput, setNewUserIdInput] = useState("");

  const navItems = [
    {
      name: "Truth Vault",
      href: "/",
      icon: ShieldCheck,
      description: "Immutable Master Data",
    },
    {
      name: "Tailor Studio",
      href: "/tailor",
      icon: Wand2,
      description: "JD Alignment Engine",
    },
    {
      name: "Application Tracker",
      href: "/tracker",
      icon: Kanban,
      description: "Job Pipeline Sync",
    },
    {
      name: "48-Hr Skill Sprint",
      href: "/sprint",
      icon: Zap,
      description: "Gap Closing Blueprints",
    },
  ];

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUserIdInput.trim()) {
      setUserId(newUserIdInput.trim());
      setNewUserIdInput("");
      setIsAddingUser(false);
    }
  };

  return (
    <aside className="w-[240px] h-screen fixed left-0 top-0 border-r border-slate-200 bg-white flex flex-col justify-between z-30 select-none">
      {/* Top Section */}
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="flex items-center">
            <span className="font-semibold text-slate-900 tracking-tight text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              Resumme Builder
            </span>
          </div>
        </div>

        {/* User Switcher */}
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Active profile
            </span>
            {!isAddingUser && (
              <button
                type="button"
                onClick={() => setIsAddingUser(true)}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-0.5"
                title="Create / switch new user ID"
              >
                <Plus className="w-3 h-3" /> New
              </button>
            )}
          </div>

          {isAddingUser ? (
            <form onSubmit={handleCreateUser} className="space-y-1.5">
              <input
                type="text"
                value={newUserIdInput}
                onChange={(e) => setNewUserIdInput(e.target.value)}
                placeholder="e.g. dev-user-1"
                className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-300 bg-white focus:outline-none focus:border-emerald-600"
                autoFocus
              />
              <div className="flex items-center gap-1.5">
                <button
                  type="submit"
                  disabled={!newUserIdInput.trim()}
                  className="flex-1 text-xs bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white py-1 px-2 rounded-md font-medium"
                >
                  Switch
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingUser(false)}
                  className="text-xs text-slate-500 hover:text-slate-700 py-1 px-2 rounded-md"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="relative">
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full text-xs font-mono font-medium text-slate-800 bg-white border border-slate-200 rounded-md px-2.5 py-1.5 pr-6 appearance-none focus:outline-none focus:border-emerald-600 cursor-pointer shadow-sm"
              >
                {availableUsers.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
              <div className="absolute right-2 top-2.5 pointer-events-none text-slate-400">
                <Check className="w-3 h-3 text-emerald-600" />
              </div>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-600"
                    }`}
                  />
                  <div className="truncate">
                    <span className="block truncate">{item.name}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Clean Bottom Spacer - NO intrusive footer collision */}
      <div className="p-3 border-t border-slate-100" />
    </aside>
  );
}
