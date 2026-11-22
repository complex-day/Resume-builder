"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { useTheme } from "@/context/ThemeContext";
import {
  ShieldCheck,
  Wand2,
  Kanban,
  Zap,
  User,
  Plus,
  Check,
  Layers,
  Sun,
  Moon,
  Menu,
  X,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const { userId, setUserId, availableUsers } = useUser();
  const { theme, toggleTheme } = useTheme();
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserIdInput, setNewUserIdInput] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  // Automatically close mobile drawer when navigating
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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

  // Reusable User Profile Switcher Section
  const renderUserSwitcher = () => (
    <div className="px-4 py-3 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/40">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-slate-600 dark:text-zinc-400 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
          Active profile
        </span>
        {!isAddingUser && (
          <button
            type="button"
            onClick={() => setIsAddingUser(true)}
            className="text-xs text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-medium flex items-center gap-0.5"
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
            className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-600"
            autoFocus
          />
          <div className="flex items-center gap-1.5">
            <button
              type="submit"
              disabled={!newUserIdInput.trim()}
              className="flex-1 text-xs bg-slate-900 dark:bg-zinc-800 hover:bg-slate-800 dark:hover:bg-zinc-700 disabled:opacity-50 text-white py-1 px-2 rounded-md font-medium"
            >
              Switch
            </button>
            <button
              type="button"
              onClick={() => setIsAddingUser(false)}
              className="text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 py-1 px-2 rounded-md"
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
            className="w-full text-xs font-mono font-medium text-slate-800 dark:text-zinc-200 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md px-2.5 py-1.5 pr-6 appearance-none focus:outline-none focus:border-emerald-600 cursor-pointer shadow-sm"
          >
            {availableUsers.map((id) => (
              <option key={id} value={id} className="dark:bg-zinc-900">
                {id}
              </option>
            ))}
          </select>
          <div className="absolute right-2 top-2.5 pointer-events-none text-slate-400">
            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-500" />
          </div>
        </div>
      )}
    </div>
  );

  // Reusable Nav Links Section
  const renderNavLinks = (onItemClick?: () => void) => (
    <nav className="p-3 space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={`group flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium transition-colors ${
              isActive
                ? "bg-slate-900 dark:bg-zinc-800 text-white shadow-sm"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800/60"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive
                    ? "text-emerald-400"
                    : "text-slate-400 dark:text-zinc-500 group-hover:text-slate-600 dark:group-hover:text-zinc-300"
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
  );

  // Reusable Theme Mode Toggle Section
  const renderThemeToggle = () => (
    <div className="p-3 border-t border-slate-100 dark:border-zinc-800">
      <button
        type="button"
        onClick={toggleTheme}
        className="w-full flex items-center justify-between px-3 py-2 rounded-md border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/70 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-medium transition-colors"
        title={`Switch to ${theme === "light" ? "Dark" : "Light"} studio mode`}
      >
        <div className="flex items-center gap-2">
          {theme === "light" ? (
            <Moon className="w-3.5 h-3.5 text-slate-500" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span>{theme === "light" ? "Dark mode" : "Light mode"}</span>
        </div>
        <span className="text-[11px] font-mono text-slate-400 dark:text-zinc-500">
          {theme === "light" ? "Studio" : "Default"}
        </span>
      </button>
    </div>
  );

  return (
    <>
      {/* 1. Mobile Top Bar (Visible strictly on screens < md) */}
      <div className="md:hidden sticky top-0 z-40 bg-white dark:bg-[#111114] border-b border-slate-200 dark:border-zinc-800 px-4 py-2.5 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
            className="p-1.5 rounded-md text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>
          <span className="font-semibold text-slate-900 dark:text-zinc-100 tracking-tight text-sm flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
            Resumme Builder
          </span>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          className="p-1.5 rounded-md text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 transition-colors"
          title={`Switch to ${theme === "light" ? "Dark" : "Light"} mode`}
        >
          {theme === "light" ? (
            <Moon className="w-4 h-4 text-slate-600" />
          ) : (
            <Sun className="w-4 h-4 text-amber-400" />
          )}
        </button>
      </div>

      {/* 2. Mobile Slide-Over Drawer & Subtle Backdrop (Visible strictly when open on < md) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Subtle Dark Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 transition-opacity"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-over Drawer */}
          <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-[#111114] border-r border-slate-200 dark:border-zinc-800 flex flex-col justify-between shadow-xl transition-colors select-none">
            <div className="flex flex-col">
              {/* Drawer Header with Close Button */}
              <div className="px-5 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                <span className="font-semibold text-slate-900 dark:text-zinc-100 tracking-tight text-base flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                  Resumme Builder
                </span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close navigation menu"
                  className="p-1 rounded-md text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* User Profile Switcher */}
              {renderUserSwitcher()}

              {/* Navigation Items (auto-closes on link click) */}
              {renderNavLinks(() => setMobileOpen(false))}
            </div>

            {/* Bottom Section: Theme Mode Toggle */}
            {renderThemeToggle()}
          </aside>
        </div>
      )}

      {/* 3. Desktop Fixed Sidebar (Unchanged desktop layout: w-[240px] fixed, visible md:flex) */}
      <aside className="hidden md:flex w-[240px] h-screen fixed left-0 top-0 border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] flex-col justify-between z-30 select-none transition-colors">
        <div className="flex flex-col">
          {/* Brand Header */}
          <div className="px-5 py-4 border-b border-slate-100 dark:border-zinc-800">
            <div className="flex items-center">
              <span className="font-semibold text-slate-900 dark:text-zinc-100 tracking-tight text-base flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                Resumme Builder
              </span>
            </div>
          </div>

          {/* User Profile Switcher */}
          {renderUserSwitcher()}

          {/* Navigation Items */}
          {renderNavLinks()}
        </div>

        {/* Bottom Section: Theme Mode Toggle */}
        {renderThemeToggle()}
      </aside>
    </>
  );
}
