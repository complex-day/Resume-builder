# Anti-AI-Slop UI & Design System Rule

**Rule Identifier:** `UI-DESIGN-001`  
**Target:** All screens, layouts, components, and styles in `frontend/`  
**Aesthetic:** Crisp, high-craft editorial SaaS UI (inspired by Linear, Stripe, and Notion)  
**Enforcement:** Strict (Zero Tolerance for AI Slop)

---

## The 20 Permanent Anti-AI-Slop Rules

### 1. No AI Clichés (Gradients, Glows, Glassmorphism)
- Strictly **NO** purple-to-indigo or blue gradients (`bg-gradient-to-r`, etc.).
- Strictly **NO** gradient text (`bg-clip-text text-transparent`).
- Strictly **NO** neon glows, diffuse colored drop shadows, or decorative background blur blobs (`backdrop-blur-3xl`, fuzzy colored orbs).
- Strictly **NO** frosted glass / pseudo-futuristic glassmorphism. Use solid, opaque surfaces (`#FFFFFF`) with crisp borders.

### 2. Strict Geometry: No `rounded-full` Pills
- Buttons, cards, modals, tabs, and inputs must use crisp, engineered corners: `rounded-md` (6px) or `rounded-lg` (8px).
- Strictly **NO** `rounded-full` pill corners on buttons, inputs, tags, or status indicators.
- Avatar icons or circular user profile indicators are the sole exception when specifically showing a circular user avatar.

### 3. No "Pill Above Headline" Badges
- Do **NOT** place decorative pill tags above section titles or page headlines (e.g., `✦ AI Powered`, `Micro-Task 15`, `Scheduled Next`, `Grounded in Truth Vault`).
- Headlines stand on their own merit with clear typography and literal subtext.

### 4. Typography: Plus Jakarta Sans + JetBrains Mono
- **Primary Interface Font:** `Plus Jakarta Sans` for all headings, body copy, navigation, buttons, and form labels. (Do NOT use Inter or generic AI-generated font stacks).
- **Tabular & Code Font:** `JetBrains Mono` for dates, metrics, CGPA, graduation years, user IDs, URLs, and code snippets.
- Always apply `tabular-nums` to numerical columns and statistical values to prevent layout shift.

### 5. No Emojis in Navigation or Headings
- Strictly **NO** emojis (🚀, ✨, 🧠, ⚡, 🔮, etc.) in navigation menus, headings, buttons, tabs, or system copy.
- Use crisp, minimal SVG line icons from `lucide-react` with thin or regular stroke weights (e.g., `w-4 h-4 text-slate-500`).

### 6. Literal, Plain UI Copy ("Say What It Does")
- Describe system features literally and concisely: e.g., *"Manage your verified projects, skills, and education used to tailor resumes."*
- Strictly **NO** hype marketing jargon: *"Supercharge your career"*, *"Revolutionary AI"*, *"Next-gen synthesis"*, *"Magic"*.
- Strictly **NO** internal dev jargon exposed in user-facing UI: e.g., `Micro-Task 15`, `Task 16`, `Core`, `Sprint V1`.

### 7. Sentence Case Over All-Caps Micro-Labels
- Form labels, section titles, card headers, and status badges must use clean sentence case: e.g., *"Active profile"*, *"Academic eligibility"*, *"Verified credentials"*.
- Strictly **NO** tiny uppercase micro-labels (`text-[10px] uppercase tracking-widest` or `INDIAN GOVT & PMIS ELIGIBILITY BASELINE`).

### 8. Strict Color Palette & Surface Hierarchy
- **Canvas / Background:** `#F8FAFC` (`bg-slate-50`).
- **Cards & Surfaces:** `#FFFFFF` (`bg-white`) with subtle 1px border `#E2E8F0` (`border border-slate-200`).
- **Primary Text:** `#0F172A` (`text-slate-900`) for headlines and active values.
- **Secondary Text:** `#475569` (`text-slate-600`) or `#64748B` (`text-slate-500`) for helper labels and descriptions.
- **Borders:** `#E2E8F0` (`border-slate-200`) or `#F1F5F9` (`border-slate-100`).

### 9. Exactly ONE Primary CTA Per Screen Header
- The screen header must contain at most **ONE** primary accent button (e.g., `Save Vault`).
- Primary CTA uses `#059669` (`bg-emerald-600 hover:bg-emerald-700 text-white rounded-md`).
- All other actions must be secondary or tertiary: neutral solid (`bg-slate-900 text-white`), outline (`border border-slate-300 text-slate-700`), or ghost (`hover:bg-slate-100 text-slate-600`).

### 10. Reserved Accent Color Discipline
- The bright emerald accent (`#059669`) is reserved strictly for:
  1. The single primary CTA button.
  2. The active tab / navigation underline.
  3. Quiet status checkmarks or verified indicators.
- Do NOT spray emerald across borders, backgrounds, card surfaces, or random text spans.

### 11. Left-Aligned Editorial Layouts
- Layouts must be left-aligned with a clear typographic hierarchy, reminiscent of high-end editorial software.
- Strictly **NO** centered marketing-style hero layouts on functional workspace screens.

### 12. Strict 4-Point Grid Spacing
- All spacing, margins, and paddings must adhere to multiples of 4px: `4px` (1), `8px` (2), `12px` (3), `16px` (4), `24px` (6), `32px` (8).
- Avoid arbitrary, non-system spacing values (e.g., `p-[13px]`, `mt-[7px]`).

### 13. Minimal Inline Status Over Heavy Badges
- System health and connection indicators must be quiet, minimal inline elements:
  - Example: `w-2 h-2 rounded-sm bg-emerald-600` + plain text `Connected`.
- Strictly **NO** glowing badge borders, heavy pills, or pulsing dots.

### 14. No Animation Gimmicks (`animate-pulse` / `animate-bounce`)
- Never use looping pulse or bounce animations on idle elements, badges, or connection indicators.
- CSS transitions must be instantaneous and subtle: `transition-colors duration-150` on hover and focus states only.

### 15. No Decorative Icon Boxes
- Do **NOT** enclose icons in oversized colored circular or square gradient boxes (`p-3 bg-purple-100 text-purple-600 rounded-full`).
- Let icons sit naturally beside or inline with their corresponding text.

### 16. Real Backend Data (Zero Fake / Lorem Mockups)
- Every displayed field MUST originate from the FastAPI backend (`GET /api/v1/vault/{user_id}`).
- Strictly **NO** fake "John Doe", "Acme Corp", or lorem ipsum placeholders in production screens.
- When an entity or vault is empty, render an informative, functional empty state.

### 17. No Vanity Stat Banners
- Strictly **NO** fake "Stats" banners displaying hardcoded counts (e.g., *"99.9% ATS Score"*, *"10x Faster"*).
- Only display genuine, verified metrics pulled directly from the user's data store (e.g., real project count, real verified skill count).

### 18. Tabbed Workspaces Over Infinite Walls of Inputs
- Break complex data forms into focused, logical workspace tabs (e.g., *Profile & Eligibility*, *Skills*, *Projects*, *Experience & Education*).
- Never overwhelm the user with an endless, unorganized vertical wall of text inputs.

### 19. Predictable Form Control States
- Every text input and form control must have clean, standardized focus states:
  - `border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white`.
- Disabled controls must look intentionally inactive: `disabled:opacity-50 disabled:cursor-not-allowed`.

### 20. Zero-Hallucination UX Boundaries
- The UI must never display synthesized or speculative suggestions as if they were factual user credentials.
- A clear visual distinction must separate immutable verified Master Vault data from prospective application drafts.
