# Chrome Extension & Job Portal Extraction Rule

**Rule Identifier:** `PORTAL-EXT-001`  
**Target:** Chrome Extension (React + Vite), Content Scripts, DOM Parsers  
**Enforcement:** Strict (Web Store & Scraping Resilience Compliant)

---

## 1. Manifest V3 & Minimal Permissions Principle
- **Manifest V3 Only:** Strictly adhere to Chrome Extensions Manifest V3 specifications.
- **Service Worker:** Use background service workers (`background.js` / service worker scripts). Never use deprecated background pages or persistent background contexts.
- **Minimal Permissions:** Only request the minimal permissions strictly required for the extraction flow:
  - `permissions`: `["activeTab", "scripting", "storage"]`
  - Avoid broad host permissions (`"<all_urls>"` or `"*://*/*"`).
  - Only execute scripts on the current active tab upon explicit user interaction (e.g., clicking extension popup or quick-action trigger).

## 2. Robust Extraction Architecture (Zero Fragile Scrapers)
- **Zero Fragile CSS Scrapers:** Never rely solely on auto-generated, randomized, minified, or ephemeral CSS class names (e.g., `.sc-10x98a`, `.jobDescription-xyz`, `.styles_heading__v82d`).
- **Multi-Layered Extraction Strategy:**
  1. **Layer 1 - Structured Data:** Search for JSON-LD (`<script type="application/ld+json">`) with `@type: "JobPosting"`. If present, extract `title`, `hiringOrganization`, `description`, `jobLocation`, and `skills`.
  2. **Layer 2 - Semantic / ARIA Selectors:** Target semantic tags (`<main>`, `<article>`, `role="main"`, `[data-automation-id="job-description"]`, `[data-testid="job-details"]`).
  3. **Layer 3 - Clean Visible DOM Text Extraction:** Extract visible text, stripping script, style, navbars, headers, footers, feedback widgets, cookie banners, and related job carousels.
  4. **Layer 4 - User Selection Fallback:** Allow the user to highlight JD text on the page or paste raw text if portal anti-bot/DOM obfuscation blocks automated reading.

## 3. Supported Job Portals (21+ Indian & Global Platforms)
The extraction engine must handle structural patterns across the primary job boards:
- **Global & Tech Ecosystems:**
  1. LinkedIn
  2. Indeed
  3. Glassdoor
  4. ZipRecruiter
  5. SimplyHired
  6. Dice
  7. CareerBuilder
  8. Google Careers
  9. Wellfound (formerly AngelList)
  10. Y Combinator Work at a Startup
- **Indian Market Specialists:**
  11. Naukri
  12. Foundit (formerly Monster India)
  13. Internshala
  14. Instahyre
  15. Hirist
  16. Cutshort
- **Applicant Tracking Systems (ATS Direct Portals):**
  17. Greenhouse
  18. Lever
  19. Workday
  20. SmartRecruiters
  21. Ashby
  22. BambooHR / Taleo / iCIMS

## 4. Privacy & Data Handling
- **No In-Flight Tampering:** Extracted job description text must be transmitted directly to the user's local or authorized backend endpoint over secure HTTPS/WSS.
- **Zero Third-Party Telemetry:** No user browsing history, non-job tab data, or tracking pixels may be captured or transmitted.
