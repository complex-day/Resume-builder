# ATS-Safe PDF Generation & Verification Rule

**Rule Identifier:** `ATS-PDF-001`  
**Target:** Resume Template Engines, LaTeX/Typst/HTML-to-PDF Compilers, and Verification Agents  
**Enforcement:** Strict (Mandatory Automated Verification)

---

## 1. Single-Column Layout Standard (Jake's Resume Style)
- **Single-Column Only:** Layout must follow a strict top-to-bottom, single-column reading hierarchy modeled after the classic, battle-tested "Jake's Resume" structure:
  1. Header (Full Name, Contact Info, LinkedIn, GitHub, Portfolio)
  2. Education
  3. Experience / Work History
  4. Projects
  5. Technical Skills & Certifications
- **No Multi-Column Grids:** Two-column layouts, sidebars, floating boxes, split panels, and multi-column flexboxes/grids are **strictly prohibited**. ATS parsers read across rows and fail on multi-column layouts.

## 2. Forbidden PDF Elements
- **Zero Tables:** Do not use HTML `<table>` or LaTeX tabular environments for layout alignment.
- **Zero Graphics & Icons:** No SVG icons, FontAwesome glyphs, profile pictures, avatar headshots, logos, progress bars, skill rating circles, or decorative lines/shapes.
- **Standard Formatting:** Use semantic text hierarchy (H1/H2 equivalents), standard margin rules (0.5 to 0.75 in), and clean horizontal dividing rules (`\hrule` or border-bottom).

## 3. Typography & Character Encoding
- **ATS-Standard Fonts:** Use clean, standard, machine-readable fonts with embedded TrueType/Type 1 encodings:
  - Serif: Computer Modern / Latin Modern Roman, Times New Roman, Georgia
  - Sans-Serif: Helvetica, Arial, Calibri
- **Bullet Glyphs:** Use standard bullet characters (`•` or standard LaTeX `\item`) and standard ASCII hyphens (`-`). Avoid non-standard Unicode symbols, dingbats, or complex font ligatures that corrupt parser tokenizers.

## 4. Mandatory `pypdf` Automated Verification Gate
- **Pre-Delivery Verification:** Before returning any generated PDF to the user or API client, the system must execute an automated text-extraction check using `pypdf`:
  1. Extract full text from all pages using `pypdf.PdfReader`.
  2. **Zero Corruption Check:** Verify that extracted text is non-empty, contains no garbled character replacement tokens (e.g., `\ufffd` or `(cid:*)`), and retains valid UTF-8 strings.
  3. **Section Presence Check:** Confirm presence and correct sequential ordering of all major resume section headings.
  4. **Entity Fidelity Check:** Confirm candidate name, email, phone number, and company names appear intact in the extracted text stream.
- **Failure Handling:** If `pypdf` extraction fails or fails integrity checks, the PDF engine must abort delivery and raise a compilation error with detailed diagnostics.
