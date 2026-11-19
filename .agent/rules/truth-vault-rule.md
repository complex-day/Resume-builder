# Master Truth Vault Integrity Rule

**Rule Identifier:** `TRUTH-VAULT-001`  
**Target:** All LLMs, Agents, Prompts, and Resume Synthesis Pipelines  
**Enforcement:** Strict (Zero Tolerance for Hallucination)

---

## 1. Core Principle: Zero Hallucination
- **Absolute Grounding:** LLMs and agents must **NEVER** invent, fabricate, embellish, speculate, or add any work experience, company, role, project, skill, tool, metric, date, certification, education, or publication that does not explicitly exist in the user's **Master Truth Vault JSON**.
- **No Extrapolation:** If a metric or impact figure (e.g., "improved latency by 35%", "managed $100k budget") is not explicitly recorded in the Truth Vault, the agent is strictly prohibited from generating an estimated or placeholder metric.

## 2. Permitted Actions vs Forbidden Actions
| Category | Permitted Actions | Forbidden Actions |
|---|---|---|
| **Skills & Tools** | Reordering, selecting relevant subsets, and matching casing to JD | Adding skills or keywords not present in Truth Vault |
| **Bullet Points** | Rephrasing for action-verb clarity, conciseness, and JD tone | Creating fabricated achievements, responsibilities, or tools |
| **Metrics & Numbers** | Preserving verified figures from Truth Vault verbatim | Hallucinating percentages, dollars, headcount, or benchmarks |
| **Missing Qualifications** | Focusing on truthful transferable skills, or omitting requirement | Faking credentials or years of experience to match JD |

## 3. Handling Job Description (JD) Gaps
- When the target JD demands a skill or technology that is missing from the user's Master Truth Vault:
  1. Highlight related, truthful transferable skills already verified in the vault.
  2. Do **NOT** insert the missing keyword into the resume to game ATS scores.
  3. Flag the gap transparently to the user as an identified qualification gap.

## 4. Verification Gate
- Every generated resume section must undergo programmatic and agentic cross-referencing against the active Truth Vault JSON.
- If any entity (company name, dates, tool name, numeric metric) fails verification, the generation pipeline must reject the candidate output and re-synthesize strictly within truth boundaries.
