# Momentum UI — UX Critique & Improvements

Aligned with `skill.md`: minimal, refined, and precise. No extra color or animation bloat.

---

## 1. UX Critique (bullet points)

### Visual hierarchy
- **Notes and Task Board competed equally** — same section label weight and panel treatment made the primary surface (tasks) not clearly dominant.
- **Column headers were uniformly secondary** — center column needed slightly stronger weight to read as “where work lives.”
- **Memory looked like another sidebar** — no cue that it is the system’s persistent record (source of truth).

### Sense of AI presence
- **No indication that Momentum is “on”** — users couldn’t tell if the system was ready, thinking, or updating.
- **Action bar felt disconnected** — buttons didn’t feel tied to an agent that analyzes and remembers.

### Clarity of flow (notes → tasks → memory)
- **Direction of flow was implicit** — notes left, tasks center, memory right wasn’t reinforced by layout or copy.
- **Memory lacked context** — no hint that its content is derived from conversation or when it was last updated.

---

## 2. Concrete UI Improvements (implemented)

- **AI status** — `AIStatus` component in the notes column (e.g. “Momentum ready” / “Analyzing…” / “Remembering…” / “Updating plan…”). Text-only, secondary color, subtle; no spinners or extra motion.
- **Kanban prominence** — Center column: slight background tint (`bg-background-alt/30`), thin right border, Task Board label in primary text; column cards use white background; column headers in primary text.
- **Memory as source of truth** — Each Memory section has a left border (`border-l-2`); caption “Project memory · last updated from conversation” at top to frame it as the system’s record.
- **Task card metadata** — Optional `priority` (P0/P1/P2), `owner`, `due`; shown in a single minimal line under the card with a top border, small type, secondary color.
- **Flow** — Center column is clearly the primary surface; notes feed it; memory anchors it. Copy and hierarchy support that.

---

## 3. Logo Proposal

**Constraint:** Monochrome only; geometric or typographic; express forward motion, continuity, intelligence.

### Option A — Ascending bars (implemented in `MomentumLogo.tsx`)
- **Idea:** Five vertical strokes rising left-to-right (heights vary). Suggests momentum and continuity without literal arrows.
- **Rationale:** Forward motion (left→right, upward), continuity (repeated elements), intelligence (minimal geometry).
- **Usage:** Header: `<MomentumLogo variant="full" className="h-8" />`. Favicon: use symbol only at 32×32.

### Option B — SVG file `logo-option-b.svg`
- **Idea:** Single continuous path suggesting an “M” or flow. More abstract, still geometric.
- **Usage:** Same as A; swap `image.png` for this SVG in the header if you prefer a file-based logo.

### Usage guidance
- **Header:** Prefer `MomentumLogo` (React) or `<img src="/logo-option-a.svg" alt="Momentum" />` so the logo scales and stays sharp. Height ~32px (e.g. `h-8`).
- **Favicon:** Use the symbol only (no wordmark). Export the mark at 32×32 and 16×16 for `favicon.ico` or use SVG favicon with the mark’s viewBox.

---

## 4. Optional Tailwind / Component Suggestions (no full rewrites)

- **AIStatus:** When wiring to real API, drive `status` from backend (e.g. `analyzing` while processing notes, `remembering` when writing to memory, `updating` when syncing plan). Keep the same four states and labels.
- **TaskCard:** If you add drag-and-drop later, keep the metadata row and border so cards don’t get visually noisy.
- **MemoryPanel:** “Last updated” can become dynamic (e.g. “Updated 2 min ago”) when you have timestamps; keep the same caption style.
- **Header:** To try the new logo, use `<MomentumLogo variant="full" className="h-8" />` instead of the current `Image`; remove or keep `image.png` as fallback.

---

**Do not:** Add colors, heavy animations, or dashboard-style widgets. Goal: calm, intelligent, alive, trustworthy.
