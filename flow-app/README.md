# Sequences — Yoga Flow Planner

A mobile-first Progressive Web App (PWA) for **designing, storing, and following yoga sequences**. Built for Vinyasa flow first, but broadly applicable to any style (Hatha, Ashtanga, Yin, Restorative, Power).

The guiding principle: **support the practitioner's thinking, never replace it.** The app helps you build and follow sequences and gives useful feedback (e.g. which muscles a practice targets), but it never auto-generates sequences. Every decision about what comes next stays with you.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. (Optional but recommended) configure muscle analysis
cp .env.example .env
#    then edit .env and paste your OpenAI API key

# 3. Run the dev server
npm run dev

# 4. Build for production
npm run build && npm run preview
```

Open the local URL printed by `npm run dev` (usually http://localhost:5173).

On first launch the app seeds a sample sequence ("Way of the Scatty Warrior") so you can see how everything fits together.

---

## What This App Does

- **Sequences** — create any number of yoga sequences. Each has a name, style, intention/through-line, and target duration.
- **Sections** — a sequence is built from named sections (e.g. "Sun Salutations", "Standing Flow"), each tagged with a **phase** of the class arc and able to **repeat** N rounds.
- **Poses** — each section holds an ordered list of poses, each with a **side** (both/left/right), **breath** cue, optional **hold** (in breaths), **cues** (alignment/breath/verbal/transition/safety), and a **key-pose** flag.
- **Edit mode** — build and refine the sequence. Drag to reorder sections, autocomplete pose names, mirror a section to the other side in one tap.
- **Practice mode** — a clean, legible performance view. Collapses completed sections, highlights the active one, shows breath/side/cues large, and lets you tap to mark poses/sections done.
- **Muscle analysis** — when you enter a pose, the app asks OpenAI (in the background) which muscle groups it targets and how intensely, then visualises the cumulative muscle focus for each section and the whole sequence.
- **Offline-first PWA** — installable to a phone home screen, works without a network connection (except muscle analysis, which needs the API).
- **Import / Export** — back up and move your data as JSON.

---

## Documentation

All documentation is self-contained in this folder.

> **Starting fresh / new workspace?** Read **[docs/START_HERE.md](docs/START_HERE.md)** first — it orients a new agent or developer with zero prior context.
> **Deploying?** Follow **[docs/DEPLOYMENT_VERCEL.md](docs/DEPLOYMENT_VERCEL.md)** (Vercel + the required serverless OpenAI proxy).

- **[docs/START_HERE.md](docs/START_HERE.md)** — onboarding entry point for a fresh agent: what the app is, how to run it, and where everything lives.
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — how the app is structured, file by file, and the rendering/state model.
- **[docs/DATA_MODEL.md](docs/DATA_MODEL.md)** — the full data model (Sequence → Section → Pose) and persistence.
- **[docs/OPENAI_INTEGRATION.md](docs/OPENAI_INTEGRATION.md)** — how muscle analysis works, the prompt, caching, and the **production security model** (move the key to a backend proxy).
- **[docs/DEPLOYMENT_VERCEL.md](docs/DEPLOYMENT_VERCEL.md)** — step-by-step Vercel deployment, including the serverless function that keeps the OpenAI key off the client.
- **[docs/YOGA_SEQUENCING.md](docs/YOGA_SEQUENCING.md)** — the yoga-sequencing principles the app is designed around (the class arc, phases, counterposing, bilateral symmetry).
- **[docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)** — the visual design system: tokens, typography, shape and shadow scales, motion, and accessibility rules.
- **[IDEATION.md](IDEATION.md)** — the original ideation and research notes.

---

## Tech Stack

- **Vite + React 19 + TypeScript** — no backend; everything runs in the browser.
- **vite-plugin-pwa (Workbox)** — service worker, offline support, installability.
- **localStorage** — all persistence. No accounts, no server.
- **OpenAI Chat Completions API** — muscle analysis (optional; gracefully degrades if no key).
- **@phosphor-icons/react** — the single icon family (no hand-rolled SVG glyphs, no emoji).
- **Geist + Geist Mono** — self-hosted variable fonts (via `@fontsource-variable/*`), bundled for offline use. Mono is used for all numeric badges/metrics.

No UI framework, no chart library — styling and the muscle bar charts are hand-rolled CSS to keep the bundle small and the app fast on phones.

---

## Project Layout

```
flow-app/
├── README.md                 ← you are here
├── IDEATION.md               ← original ideation & research
├── .env.example              ← copy to .env, add your OpenAI key
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── docs/
│   ├── START_HERE.md         ← read first if you have no context
│   ├── ARCHITECTURE.md
│   ├── DATA_MODEL.md
│   ├── OPENAI_INTEGRATION.md
│   ├── DEPLOYMENT_VERCEL.md  ← Vercel deploy + serverless proxy
│   ├── YOGA_SEQUENCING.md
│   └── DESIGN_SYSTEM.md
├── public/
│   └── favicon.svg
└── src/
    ├── main.tsx              ← entry point
    ├── App.tsx               ← top-level state, list ↔ editor routing
    ├── App.css               ← all styles (mobile-first)
    ├── types.ts              ← data model + factory functions + display metadata
    ├── storage.ts            ← localStorage load/save, import/export, normalisation
    ├── poseLibrary.ts        ← curated pose list + fuzzy search
    ├── muscleAnalysis.ts     ← OpenAI call + result caching
    ├── muscleAggregate.ts    ← roll up per-pose muscles → section/sequence totals
    ├── defaultSequence.ts    ← the seeded sample sequence
    ├── vite-env.d.ts         ← env var + __APP_VERSION__ types
    └── components/
        ├── SequenceList.tsx  ← home screen (list, create, import/export)
        ├── SequenceEditor.tsx← one sequence; orchestrates background analysis
        ├── SectionCard.tsx   ← a section with its poses; phase, repeats, mirror
        ├── PoseRow.tsx       ← a single pose (edit + practice variants)
        ├── PoseNameInput.tsx ← pose-name input with fuzzy autocomplete
        └── MuscleChart.tsx   ← CSS bar chart of muscle engagement
```

---

## Privacy & Data

- All your sequences live in your browser's `localStorage`. Nothing is uploaded anywhere except the **pose name** sent to OpenAI for muscle analysis (only the name, never your notes or full sequence).
- If you don't configure an OpenAI key, no network calls are made at all — the app is fully offline.

---

## Deploying

This is a static site. `npm run build` produces a `dist/` folder you can host anywhere (GitHub Pages, Netlify, Vercel, Cloudflare Pages, S3, etc.).

> ⚠️ **Before deploying publicly**, read [docs/OPENAI_INTEGRATION.md](docs/OPENAI_INTEGRATION.md). The OpenAI key must NOT ship in a public client bundle — move it behind a backend proxy first. The code isolates this to a single function so the change is small.
