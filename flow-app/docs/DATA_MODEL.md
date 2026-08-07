# Data Model

The model is a three-level nesting: **Sequence → Section → Pose**. All types live in `src/types.ts`, which is the single source of truth.

---

## Overview

```
Sequence                     one complete practice / class
├── name, style, intention, targetDuration, viewMode, timestamps
└── sections: Section[]
        ├── name, phase, repeats, durationMinutes, notes, completed, expanded
        └── poses: Pose[]
                ├── name, sanskritName, side, breath, holdBreaths, durationSeconds
                ├── cues: Cue[]
                ├── isKeyPose, completed
                └── analysis?: MuscleAnalysis   (filled in by OpenAI, cached)
```

Two levels of nesting (Section → Pose) was a deliberate choice: real flows group naturally into named sections, and a repeating mini-flow is modelled as a **section with `repeats > 1`**, not a third level.

---

## Types

### `Sequence`

```ts
interface Sequence {
  id: string;
  name: string;
  style: PracticeStyle; // 'vinyasa' | 'hatha' | 'ashtanga' | 'yin' | 'restorative' | 'power' | 'custom'
  intention: string; // the through-line / theme; shown as a banner in practice mode
  targetDuration: number | null; // total target minutes
  sections: Section[];
  viewMode: "edit" | "practice";
  createdAt: string; // ISO
  updatedAt: string; // ISO
}
```

### `Section`

```ts
interface Section {
  id: string;
  name: string;
  phase: Phase; // which phase of the class arc (see below)
  poses: Pose[];
  repeats: number; // perform N times (1 = once). A repeating mini-flow.
  notes: string; // section-level theme/notes
  durationMinutes: number | null; // optional target duration
  expanded: boolean; // UI: expanded/collapsed
  completed: boolean; // practice-mode completion
}
```

### `Pose`

```ts
interface Pose {
  id: string;
  name: string; // English/common name, e.g. "Warrior II"
  sanskritName?: string; // e.g. "Virabhadrasana II"
  side: "both" | "left" | "right";
  breath: "inhale" | "exhale" | "hold" | "flow" | null;
  holdBreaths: number | null; // hold for N breaths; null = flow through (1 breath/movement)
  durationSeconds: number | null; // optional explicit timed hold (yin/restorative)
  cues: Cue[];
  isKeyPose: boolean; // visually highlighted peak/key pose
  completed: boolean; // practice-mode completion
  analysis?: MuscleAnalysis; // muscle analysis (async, cached)
}
```

### `Cue`

```ts
interface Cue {
  id: string;
  text: string;
  type: "alignment" | "breath" | "verbal" | "transition" | "safety";
}
```

Cue types are colour-coded so you can scan them quickly mid-practice.

### `Phase`

The seven phases of a yoga class's energetic arc, plus `custom`:

| Phase         | Meaning                         | Colour             |
| ------------- | ------------------------------- | ------------------ |
| `centering`   | Opening, intention, breath      | indigo `#a78bfa`   |
| `warm-up`     | Gentle mobilisation             | amber `#fbbf24`    |
| `sun-salutes` | Surya Namaskar                  | orange `#fb923c`   |
| `standing`    | Standing poses, flows, warriors | green `#34d399`    |
| `peak`        | Most challenging part           | red `#f87171`      |
| `cool-down`   | Counter-poses, slower work      | sky `#38bdf8`      |
| `savasana`    | Final rest & closing            | lavender `#c4b5fd` |
| `custom`      | User-defined                    | slate `#94a3b8`    |

**Phase is metadata, not structure.** It drives colour-coding and (future) gentle validation, but never constrains ordering — the practitioner decides everything.

### Muscle analysis types

```ts
type MuscleGroup =
  | "Core"
  | "Shoulders"
  | "Chest"
  | "Upper Back"
  | "Lower Back"
  | "Glutes & Hips"
  | "Hip Flexors"
  | "Hamstrings"
  | "Quadriceps"
  | "Calves & Ankles"
  | "Arms"
  | "Balance & Stability";

interface MuscleEngagement {
  group: MuscleGroup;
  engagement: number;
} // 0–100

interface MuscleAnalysis {
  status: "none" | "pending" | "ready" | "error";
  intensity: number; // 0–100 overall effort
  muscles: MuscleEngagement[];
  analysedAt?: string;
  error?: string;
}
```

Muscle groups are deliberately coarse (12 groups, not anatomical detail) so feedback stays legible. "Balance & Stability" isn't a muscle but is useful practitioner feedback.

---

## Factory Functions

Use these to create new objects with correct defaults (in `types.ts`):

- `createSequence()` — a new sequence seeded with one "Centering" section.
- `createSection(phase?, name?)` — a new section with one empty pose.
- `createPose(name?, side?)` — a new empty pose.
- `createCue(type?, text?)` — a new cue.
- `flipSide(side)` — left↔right; both stays both. Used by "Mirror".

---

## Persistence (`storage.ts`)

- **Save**: `saveSequences(sequences)` writes JSON to `localStorage['sequences-data']`. `App` calls this on every change.
- **Load**: `loadSequences()` reads and **normalises** the data. On first launch (empty storage) it seeds the sample sequence.
- **Normalisation**: `normSequence` / `normSection` / `normPose` coerce every field to a valid value and fill defaults. This is what makes the model forward-compatible — add a field, give it a default here, and old saved data still loads.

### Import / Export

Exports use a **versioned envelope** so the format can evolve:

```ts
interface ExportData {
  version: 1;
  app: "sequences";
  exportedAt: string;
  sequences: Sequence[];
}
```

- `downloadExport(sequences)` triggers a `.json` file download.
- `parseImport(text)` accepts either the envelope or a bare `Sequence[]`, and normalises the result.

---

## Aggregation (`muscleAggregate.ts`)

To show "what muscles does this work", per-pose analyses are summed:

```
weight(pose)   = max(holdBreaths, 1) × max(section.repeats, 1)
contribution   = engagement × weight   (per muscle group)
```

- `aggregateSection(section)` → totals for one section.
- `aggregateSequence(sequence)` → totals for the whole sequence.
- Results are normalised 0–100 relative to the most-worked group in scope, then drawn by `MuscleChart`.
- `countUnanalysed(sequence)` powers the "analysing N…" indicator.
