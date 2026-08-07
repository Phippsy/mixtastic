# START HERE — Onboarding for a Fresh Agent / Developer

You are picking up the **Sequences** project with no prior conversation history. This document tells you everything you need to understand the app, run it locally, and deploy it to **Vercel**. Read this first, then follow the links.

> **Your likely task:** the owner wants this app running on Vercel (a static + serverless host they use often). The single most important thing to get right is the **OpenAI API key security** — it must NOT ship in the browser bundle on a public deploy. See [DEPLOYMENT_VERCEL.md](DEPLOYMENT_VERCEL.md), which is the main deliverable.

---

## 1. What This App Is

**Sequences** is a mobile-first Progressive Web App (PWA) for **designing, storing, and following yoga sequences** (Vinyasa first, but works for any style). It runs entirely in the browser with no backend today; all data lives in `localStorage`.

Core ideas:
- A **Sequence** (a full practice) contains ordered **Sections** (named blocks tagged with a phase of the class arc, repeatable N rounds), each containing **Poses** (with side, breath, hold, cues, key-pose flag).
- **Edit mode** to build; **Practice mode** to follow (clean, large, tap-to-complete).
- **Muscle analysis:** when you type a pose name, the app asynchronously asks OpenAI which muscle groups it targets and visualises the cumulative muscle focus per section and overall. This is the ONLY network feature and it is optional.

Guiding principle: **the app supports the practitioner's thinking, it never auto-generates sequences.**

---

## 2. Read These Docs In Order

1. **[README.md](../README.md)** — quick start, feature overview, project layout.
2. **[ARCHITECTURE.md](ARCHITECTURE.md)** — how the code is structured, state model, the background-analysis orchestration.
3. **[DATA_MODEL.md](DATA_MODEL.md)** — the `Sequence → Section → Pose` types and persistence.
4. **[OPENAI_INTEGRATION.md](OPENAI_INTEGRATION.md)** — how muscle analysis works, caching, the prompt, and the security model.
5. **[DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)** — visual language: tokens, fonts, icons, accessibility, motion rules.
6. **[YOGA_SEQUENCING.md](YOGA_SEQUENCING.md)** — the domain principles the app is modelled on.
7. **[DEPLOYMENT_VERCEL.md](DEPLOYMENT_VERCEL.md)** — **the deployment guide. This is the task.**

`source-flows.md` and `../IDEATION.md` are background reference material.

---

## 3. Tech Stack (exact)

- **Vite 6 + React 19 + TypeScript** — single-page app, no router library (state in `App.tsx` decides list vs editor).
- **vite-plugin-pwa (Workbox)** — service worker, offline support, installable.
- **localStorage** — all persistence. No database, no accounts.
- **OpenAI Chat Completions API** — muscle analysis (optional; degrades gracefully with no key).
- **@phosphor-icons/react** — the only icon family. No emoji, no hand-rolled SVG icons.
- **Geist + Geist Mono** — self-hosted variable fonts via `@fontsource-variable/*` (bundled, offline-safe). Mono for all numbers.

No CSS framework. No chart library (muscle bars are hand-rolled CSS). Keep it that way unless there's a strong reason.

---

## 4. File Map (what lives where)

```
src/
  main.tsx              entry point; imports fonts + App.css
  App.tsx               top-level state, persistence effect, list ↔ editor switch
  App.css               ALL styles, mobile-first, design tokens under :root
  types.ts              data model (Sequence/Section/Pose), factories, display metadata (labels, colours)
  storage.ts            localStorage load/save, defensive normalisation, import/export
  poseLibrary.ts        curated pose list + dependency-free fuzzy search (autocomplete)
  muscleAnalysis.ts     **the only file that calls OpenAI** + localStorage result cache
  muscleAggregate.ts    rolls per-pose analyses into section/sequence totals for the charts
  defaultSequence.ts    the seeded sample ("Way of the Scatty Warrior")
  vite-env.d.ts         env var + __APP_VERSION__ types
  components/
    SequenceList.tsx    home screen (list, create, import/export)
    SequenceEditor.tsx  one sequence; owns edit/practice mode + background analysis orchestration
    SectionCard.tsx     a section with its poses; phase, repeats, mirror-to-other-side
    PoseRow.tsx         a single pose (edit + practice variants)
    PoseNameInput.tsx   pose-name input with fuzzy autocomplete
    MuscleChart.tsx     CSS bar chart of muscle engagement
```

**Most important file for deployment:** `src/muscleAnalysis.ts`. The function `callOpenAI` is the single point of contact with OpenAI. The code is deliberately structured so that swapping to a backend proxy only touches that one function.

---

## 5. Run It Locally

```bash
npm install
cp .env.example .env      # then add your OpenAI key for muscle analysis (optional)
npm run dev               # http://localhost:5173
npm run build             # tsc --noEmit && vite build  → dist/
npm run preview           # serve the production build
```

Environment variables (all optional; the app runs offline without them):
- `VITE_OPENAI_API_KEY` — enables muscle analysis. **Browser-exposed (see security note below).**
- `VITE_OPENAI_MODEL` — defaults to `gpt-4o-mini`. Must be a real model id with hyphens (e.g. `gpt-4o-mini`, `gpt-5-mini`). A 404 on every analysis means a bad model name.
- `VITE_ENABLE_MUSCLE_ANALYSIS` — set `false` to disable all API calls.

Vite reads `.env` **only at startup** — restart the dev server after changing it.

---

## 6. THE CRITICAL SECURITY ISSUE (read before deploying)

Any `VITE_`-prefixed variable is **inlined into the client JavaScript bundle**. That means the current local-dev setup ships your OpenAI key to every visitor's browser. This is fine for local/personal use, **but it is NOT safe for a public Vercel deployment.**

For Vercel you MUST move the OpenAI call to a **serverless function** that holds the key server-side. The browser then calls your own `/api/analyse-pose` endpoint instead of OpenAI directly. Because the code isolates the OpenAI call to one function (`callOpenAI` in `src/muscleAnalysis.ts`), this is a small, contained change.

**Full step-by-step instructions, including the serverless function code, are in [DEPLOYMENT_VERCEL.md](DEPLOYMENT_VERCEL.md). Follow that document to deploy.**

---

## 7. Conventions To Respect

- **No em-dash (`—`) or en-dash (`–`) in any user-visible string.** Use `-`, comma, colon, or restructure. (Enforced design rule.)
- **No emoji** in UI/markup/visible text. Use Phosphor icons.
- Colours/radii/shadows come from CSS tokens in `App.css` (`:root`), never raw hex in component rules. See DESIGN_SYSTEM.md.
- Numbers use the mono font (`.mono` utility / specific selectors).
- Every icon-only button has a `title` and `aria-label`.
- Motion is gated behind `prefers-reduced-motion`.
- New data fields: add to the type in `types.ts`, default it in the factory AND in the `storage.ts` normaliser (this keeps old saved data loading).

---

## 8. Quick Sanity Checklist Before You Start Coding

- [ ] `npm install` then `npm run build` succeeds.
- [ ] App loads at `npm run dev` and shows the sample sequence.
- [ ] You understand that muscle analysis needs either a `VITE_OPENAI_API_KEY` (local only) or a serverless proxy (production).
- [ ] You've read [DEPLOYMENT_VERCEL.md](DEPLOYMENT_VERCEL.md) before touching deployment.
