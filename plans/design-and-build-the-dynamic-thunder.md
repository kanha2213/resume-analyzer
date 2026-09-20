# Resume Analyzer — Implementation Plan

## Context

Build the first version of Resume Analyzer: a professional, minimal, premium resume analysis tool. The workflow is Dashboard → Upload Resume → Analysis Results. The design must feel like a mature product (Vercel/Apple/Linear quality bar), not an AI-generated startup template. Establish a reusable visual system from the start.

## Stance

**Swiss** — strict grid, neutral palette, precise alignment, typography-first hierarchy. Function declares the aesthetic. One restrained accent (near-black / charcoal). No gradients, glassmorphism, excessive cards, or rounding.

## Fonts

- **Inter** (body + UI) via Google Fonts — closest public analog to Geist
- **JetBrains Mono** for scores and technical values

Import in `src/index.css` before all other statements.

## Color Tokens (defined in `src/index.css` via Tailwind v4 `@theme`)

Exact palette from the brief:
```
--color-bg: #FAFAF9
--color-surface: #FFFFFF
--color-surface-2: #F5F5F4
--color-text: #171717
--color-text-2: #737373
--color-text-muted: #A3A3A3
--color-border: #E5E5E5
--color-border-strong: #D4D4D4
--color-success: #4A7C59   (muted green)
--color-warning: #92743A   (muted amber)
--color-error: #9B3A3A     (muted red)
```

## File Structure

```
src/
  index.css          — fonts, tokens, base resets
  App.tsx            — screen router (useState: 'dashboard' | 'upload' | 'analysis')
  components/
    Shell.tsx        — app shell: top nav + layout wrapper
    Nav.tsx          — top navigation bar
    Dashboard.tsx    — dashboard screen
    Upload.tsx       — upload screen (drag-drop + states)
    Analysis.tsx     — analysis results screen
    ui/
      Button.tsx     — primary/secondary/ghost variants
      Badge.tsx      — status/category badges
      ScoreRing.tsx  — score display (numerical, with thin ring)
      ProgressBar.tsx — category score bars (thin, restrained)
      Section.tsx    — expandable analysis section
      Empty.tsx      — empty state component
```

## Screen Designs

### Nav
- Logo left: `Resume Analyzer` in medium weight, 14px, tracking-tight
- Right: user avatar placeholder
- 1px bottom border, bg-surface, height ~52px
- No shadow, no color fill

### Dashboard
- Two-column grid (desktop): left ~60% content, right ~40% sidebar-ish
- Welcome area: name + date, no card wrapper
- Primary CTA: "Analyze Resume" button — full-width on left column top
- Recent analyses: clean list with dividers (not cards), each row: filename + score + date
- Latest score: large mono number in right column
- Recent activity: compact timestamped list
- Empty state: simple centered message + CTA if no analyses

### Upload Screen
- Centered single column, max-w-xl
- Large drag-drop zone: dashed 1px border, subtle bg on hover
- File format hint below zone
- Upload → Uploading (progress indicator) → Parsing → Analyzing states
- Error state with clear message + retry
- Keep it minimal — the zone IS the screen

### Analysis Screen (most important)
- Header: filename, timestamp, "Re-analyze" action
- Score area: large mono number (e.g. `82`) + label, left-aligned, NOT centered hero
- Below score: 6 category bars in 2-column grid
- Two-column layout below: left = issues/weaknesses (grouped by category), right = strengths + recommendations
- Each issue: severity indicator (colored dot, not badge), title, explanation, fix hint
- Expandable sections using disclosure pattern
- Use thin horizontal rules as dividers, not cards

## Interaction States

- Buttons: hover (bg shift), focus (1px outline offset), disabled (opacity-40)
- Upload zone: hover (border darkens, bg tints), drag-over (border-text color, bg-surface-2)
- Analysis rows: hover (subtle bg shift)
- Expandable sections: smooth height transition 200ms

## Mock Data

Use realistic placeholder content:
- Resume: "Sarah Chen — Product_Manager_Resume.pdf"
- Score: 82/100
- Categories: ATS (74), Content (85), Impact (78), Formatting (91), Keywords (69), Experience (88)
- 3-4 realistic issues with explanations and fixes
- 3-4 realistic strengths

## Implementation Order

1. `src/index.css` — fonts, tokens, base
2. `src/components/ui/*` — primitive components
3. `src/components/Shell.tsx` + `Nav.tsx`
4. `src/components/Dashboard.tsx`
5. `src/components/Upload.tsx`
6. `src/components/Analysis.tsx`
7. `src/App.tsx` — wire screens together with useState

## Verification

- Visual check via preview: all 3 screens render correctly
- Navigate Dashboard → Upload → Analysis and back
- Drag-drop zone hover/active states work
- Expandable sections open/close
- Responsive: verify layout collapses sensibly below ~1000px
