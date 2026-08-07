# Architecture

This document explains how **Sequences** is built so a developer with no prior context can understand and extend it.

---

## High-Level Picture

```
┌──────────────────────────────────────────────┐
│  Browser (no backend)                        │
│                                              │
│  localStorage ←──→ App state (React)         │
│       │                                      │
│       ▼                                      │
│  SequenceList  ──open──▶  SequenceEditor     │
│                              │               │
│                  ┌───────────┴───────────┐   │
│                  ▼                       ▼   │
│             SectionCard            (analysis) │
│                  │                     │     │
│                  ▼                     ▼     │
│              PoseRow ──names──▶ muscleAnalysis│
│                                  (OpenAI)     │
└──────────────────────────────────────────────┘
```

Everything is client-side. There is **no server**. State lives in React and is mirrored to `localStorage` on every change.

---

## State & Routing

There is no router library. `App.tsx` holds:

- `sequences: Sequence[]` — all sequences, loaded once from `localStorage`.
- `openId: string | null` — which sequence is open. `null` = show the list.

`App` renders either `SequenceList` (when nothing is open) or `SequenceEditor` (when a sequence is open). A `useEffect` persists `sequences` to `localStorage` whenever it changes.

Data flows **down** as props and changes flow **up** via `onChange` callbacks. Each level produces a new immutable copy of its slice and hands it up; `App` swaps the changed sequence into the array.

---

## Component Responsibilities

| Component        | Responsibility                                                                                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `App`            | Top-level state, persistence, list ↔ editor switch.                                                                                                                      |
| `SequenceList`   | Home screen: list/create/duplicate/delete sequences, import/export JSON.                                                                                                 |
| `SequenceEditor` | One sequence. Owns edit/practice mode, section CRUD, drag-and-drop reorder, expand/collapse, the overall muscle panel, and **background muscle-analysis orchestration**. |
| `SectionCard`    | One section: name, phase, repeats, duration, notes, its poses, "mirror to other side", and a per-section muscle chart. Edit and practice variants.                       |
| `PoseRow`        | One pose. Edit variant (name autocomplete, side, breath, hold, key flag, cues, analysis dot, mini muscle tags) and practice variant (read-only, tap to complete).        |
| `PoseNameInput`  | Text input with fuzzy autocomplete from the pose library.                                                                                                                |
| `MuscleChart`    | Pure-CSS horizontal bar chart of muscle engagement.                                                                                                                      |

---

## Non-Component Modules

| Module               | Responsibility                                                                                                                                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `types.ts`           | The data model (interfaces + unions), display metadata (labels, colours, phase order), and factory functions (`createSequence`, `createSection`, `createPose`, etc.). The single source of truth for shapes. |
| `storage.ts`         | `loadSequences` / `saveSequences`, theme, and **defensive normalisation** so older/partial saved data keeps working. Plus versioned `exportToJson` / `parseImport` / `downloadExport`.                       |
| `poseLibrary.ts`     | A curated list of poses (English + Sanskrit) and a dependency-free **fuzzy search** (`searchPoses`) used by autocomplete.                                                                                    |
| `muscleAnalysis.ts`  | The only file that talks to OpenAI. `analysePose(name)` → `MuscleAnalysis`, with localStorage caching keyed by normalised pose name. See OPENAI_INTEGRATION.md.                                              |
| `muscleAggregate.ts` | Rolls up per-pose `MuscleAnalysis` into section/sequence totals, weighting by hold length × section repeats. Produces the numbers the charts draw.                                                           |
| `defaultSequence.ts` | Builds the seeded "Way of the Scatty Warrior" sample sequence on first launch.                                                                                                                               |

---

## Background Muscle Analysis (the tricky part)

`SequenceEditor` runs an effect on every sequence change that finds poses needing analysis and dispatches OpenAI calls without blocking the UI. Key safeguards (see the effect in `SequenceEditor.tsx`):

1. **Latest-state ref** — async callbacks read `seqRef.current` (kept in sync each render) and write through a helper that also updates the ref, so concurrent results don't clobber each other.
2. **Cache first** — if a ready result exists in `localStorage` for the pose's current name, it's applied directly (no API call).
3. **In-flight set** — a `Set` of keys prevents launching the same analysis twice.
4. **Attempted set** — a per-session `Set` ensures a pose is only auto-attempted **once**, so a persistent error (e.g. bad key) can never cause a retry storm.
5. **Pending status** — while a call is in flight the pose shows a pulsing amber dot; ready = green; error = red.

A pose's analysis is considered stale when the cache for its **current** name isn't "ready" — that's how a renamed pose re-analyses.

---

## Rendering Model: Edit vs Practice

`Sequence.viewMode` is `'edit' | 'practice'`. The same components render differently:

- **Edit** — full controls, inputs, drag handles, add/remove buttons.
- **Practice** — read-only, large legible text, tap-to-complete, completed sections dim and collapse. Designed to glance at mid-practice on a phone.

---

## Persistence & Migration

- Storage key: `sequences-data` (array of `Sequence`).
- On load, every object passes through `normSequence` / `normSection` / `normPose`, which fill defaults and coerce invalid values. This means you can add new fields to the model without breaking existing saved data — just give them sensible defaults in the normalisers and factories.
- Muscle analysis cache is a separate key: `sequences-muscle-cache` (map of pose key → analysis).

---

## Styling

- One stylesheet: `src/App.css`. Mobile-first (designed at 375px), CSS custom properties for all tokens, a single `@media (min-width: 600px)` tweak for larger screens.
- Design tokens (colour ramp, one radius scale, soft tinted shadows, one easing curve) live under `:root`. See [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) for the full design language.
- Typography: self-hosted **Geist** (UI) and **Geist Mono** (numbers) via `@fontsource-variable/*`, imported in `main.tsx` so they bundle for offline use.
- Icons: **Phosphor** (`@phosphor-icons/react`) is the only icon family. No emoji, no hand-rolled SVG glyphs.
- Accessibility: `:focus-visible` rings, tactile `:active` feedback, pinch-zoom allowed, and a global `prefers-reduced-motion: reduce` block that disables all motion.
- `viewport-fit=cover` + `env(safe-area-inset-*)` handle iPhone notches / home indicators.
- No CSS framework. The muscle charts are plain `<div>` bars sized by percentage width.

---

## Adding Features — Pointers

- **New pose field**: add to `Pose` in `types.ts`, default it in `createPose` and `normPose`, then surface it in `PoseRow`.
- **New phase**: add to the `Phase` union, `PHASE_LABELS`, `PHASE_COLORS`, `PHASE_ORDER`.
- **More poses in autocomplete**: append to `POSE_LIBRARY` in `poseLibrary.ts`.
- **Different muscle groups**: edit `MuscleGroup` / `MUSCLE_GROUPS` in `types.ts`; the prompt in `muscleAnalysis.ts` reads the list automatically.
- **Cloud sync**: the app is structured exactly like a localStorage-first app; a Drive/Supabase sync layer can be added at the `App` level (load/merge/save). See the note in OPENAI_INTEGRATION.md about keeping secrets server-side.
