# Flow Sequencer — Ideation & Research

A mobile-first PWA for designing, storing, and following yoga sequences. Initial focus: Vinyasa flow. Architecture transferable to any style (Hatha, Ashtanga, Yin, Restorative, etc.).

---

## 1. What We're Transferring from Mixtastic

### Architectural Patterns

| Mixtastic Concept                       | Flow App Equivalent                                                        |
| --------------------------------------- | -------------------------------------------------------------------------- |
| `MixSet` (top-level container)          | `Sequence` — a complete class/practice                                     |
| `TrackPair` (a discrete unit)           | `Section` / `Phase` — a named block of the practice                        |
| `Transition` (detail within a pair)     | `Pose` / `Movement` — individual asana within a section                    |
| `TransitionSide` (left/right columns)   | `Side` — left/right for bilateral poses                                    |
| `completed` flag on pairs               | `completed` on sections during practice mode                               |
| `expanded` / collapsed cards            | Same — collapse completed sections, expand the active one                  |
| Edit mode vs Mix mode                   | **Edit mode** vs **Practice mode**                                         |
| Notes with colour coding                | Cues / notes with visual priority (verbal cue, breath cue, alignment note) |
| `kill` boolean (special flag)           | Could map to "hold" (static hold vs flow through), or "key pose" marker    |
| Drag-and-drop reorder                   | Same — reorder sections and poses                                          |
| Google Drive sync                       | Same — same module, different file name                                    |
| localStorage persistence                | Same pattern                                                               |
| Version-enveloped export                | Same — `{ version: 1, sequences: [...] }`                                  |
| `normalizeReversed` (auto-fix ordering) | Auto-fix side alternation logic                                            |

### UX Patterns to Keep

- Cards with expand/collapse
- Colour-coded badges for quick scanning during performance (practice mode)
- Mark-as-done with visual dimming
- Section numbering
- Minimal chrome in performance/practice mode — maximise content visibility
- Import/export JSON

---

## 2. Yoga Sequencing — Research Findings

### The Arc of a Yoga Class

Every yoga class follows an **energetic arc** — building intensity, reaching a peak, then winding down. The standard structure (widely taught across YTT programmes) is:

```
Centering/Intention → Warm-Up → Standing/Building → Peak → Cool-Down → Savasana
```

More detailed breakdown:

#### Phase 1: Centering & Intention (2–5 min)

- Breath awareness, meditation, intention-setting
- Often seated or supine
- Sets the theme / through-line for the class

#### Phase 2: Warm-Up (5–10 min)

- Gentle mobilisation: cat-cow, spinal twists, hip circles
- Joint freeing series (Pawanmuktasana)
- Gradually increases range of motion
- Breath-movement coordination established

#### Phase 3: Sun Salutations (5–15 min)

- Surya Namaskar A and/or B
- "Classical vinyasa" — the linking sequence (Chaturanga → Up Dog → Down Dog)
- Builds heat, establishes rhythm
- Often 3–5 rounds, sometimes with variations

#### Phase 4: Standing Poses / Flow Sequences (15–25 min)

- Warriors, lunges, twists, balances
- This is where the creative sequencing happens
- Often structured as **mini-flows** that repeat on each side
- Building toward the peak pose

#### Phase 5: Peak Pose(s) (5–10 min)

- The most challenging pose(s) of the class
- Everything before is preparation for this
- Could be an arm balance, deep backbend, inversion, deep hip opener
- May include "attempts" with variations

#### Phase 6: Cool-Down / Counter-Poses (5–10 min)

- Counter-poses to neutralise after peak
- Backbend peak → forward folds
- Seated poses, gentle twists
- Inversions (shoulder stand, legs up wall)
- Progressively slower, more passive

#### Phase 7: Savasana & Closing (5–10 min)

- Final relaxation
- Integration
- Closing intention / gratitude

### Key Sequencing Principles

1. **Warm before you stretch** — mobilise joints before asking for range
2. **Simple before complex** — build toward complexity
3. **Counterpose** — after any deep or one-directional pose, neutralise
4. **Bilateral symmetry** — what you do on the right, do on the left
5. **Peak pose preparation** — every pose in the build-up should open or strengthen something needed for the peak
6. **Energy management** — class should feel like a wave, not a flat line
7. **Breath leads movement** — inhale = expansion/lift, exhale = fold/twist/ground
8. **Repetition with variation** — repeat a mini-sequence 2–3 times, adding layers

### Vinyasa-Specific Concepts

- **Vinyasa** (the linking sequence): Chaturanga → Up Dog → Down Dog. Used as punctuation between sides or between pose families.
- **Flow** vs **Hold**: Some poses are flowed through (1 breath per movement), others held (3–10 breaths). This distinction is important data to capture.
- **Rounds**: A mini-sequence is often repeated. First round = learn it. Second round = deepen. Third round = add variation.
- **Side-switching**: Bilateral sequences must track which side. Common pattern: Right side → Vinyasa → Left side → Vinyasa → next section.

### Pose Categories (useful for data modelling later)

- Standing (Warrior I, II, III, Triangle, Half Moon, etc.)
- Balancing (Tree, Eagle, Dancer, Utthita Hasta Padangustasana)
- Forward Folds (Standing, Seated, Wide-legged)
- Backbends (Cobra, Up Dog, Camel, Wheel, Locust)
- Twists (Seated, Supine, Standing)
- Inversions (Headstand, Shoulderstand, Handstand, Forearm stand)
- Arm Balances (Crow, Side Crow, Flying Pigeon)
- Hip Openers (Pigeon, Lizard, Frog, Baddha Konasana)
- Core (Boat, Plank, Side Plank, Forearm Plank)
- Restorative / Passive (Supported Fish, Legs Up Wall, Child's Pose)
- Seated (Meditation poses, Seated twists, Seated folds)
- Supine (Happy Baby, Reclined Twists, Bridge)
- Prone (Locust, Sphinx, Cobra)
- Transitions (Vinyasa, Jump-through, Float)

---

## 3. Proposed Data Model

```typescript
type PracticeStyle =
  | "vinyasa"
  | "hatha"
  | "ashtanga"
  | "yin"
  | "restorative"
  | "power"
  | "custom";
type Side = "both" | "left" | "right";
type BreathPattern = "inhale" | "exhale" | "hold" | "flow" | null;
type CueType = "alignment" | "breath" | "verbal" | "transition" | "safety";

interface Cue {
  id: string;
  text: string;
  type: CueType;
}

interface Pose {
  id: string;
  name: string; // e.g. "Warrior II"
  sanskritName?: string; // e.g. "Virabhadrasana II"
  side: Side; // both, left, or right
  breath: BreathPattern; // what's happening with the breath
  holdBreaths: number | null; // if holding, how many breaths (null = flow through)
  durationSeconds: number | null; // optional timed hold (yin, restorative)
  cues: Cue[]; // teaching/personal notes
  isKeyPose: boolean; // visually highlighted (like "kill" in Mixtastic)
  completed: boolean; // for practice mode
}

interface Section {
  id: string;
  name: string; // e.g. "Sun Salutations", "Standing Flow"
  phase: Phase; // which phase of the arc
  poses: Pose[];
  repeats: number; // how many times to repeat this section (1 = do once)
  currentRepeat: number; // for practice mode tracking
  notes: string; // section-level notes (e.g. "Build heat here")
  durationMinutes: number | null; // estimated/target duration
  expanded: boolean;
  completed: boolean;
}

type Phase =
  | "centering" // Opening, intention, breath
  | "warm-up" // Gentle mobilisation
  | "sun-salutes" // Surya Namaskar
  | "standing" // Standing poses, flows, warriors
  | "peak" // Most challenging part
  | "cool-down" // Counter-poses, slower work
  | "savasana" // Final rest & closing
  | "custom"; // User-defined

interface Sequence {
  id: string;
  name: string;
  style: PracticeStyle;
  intention: string; // The through-line / theme
  targetDuration: number | null; // Total class length in minutes
  sections: Section[];
  viewMode: "edit" | "practice";
  createdAt: string;
  updatedAt: string;
}
```

### Key Design Decisions

**Nesting is Section → Pose** (two levels), not three. The user's flows show that this is sufficient — sections group logically (e.g. "Flow Poses" contains a sequence of individual poses). If a section repeats, that's a property of the section, not a third nesting level.

**Side tracking at the Pose level**, not section level. A section like "Standing Flow" contains poses that alternate sides, and the vinyasa between sides is also a pose (type: transition).

**Repeats on Sections**, not poses. When a mini-flow repeats 2–3 times, that's a section repeating. Individual poses within don't independently repeat (that's what rounds are).

**Phase is metadata, not structure**. Phases help colour-code and validate the arc, but they don't constrain ordering. The practitioner decides.

**No pose database / autocomplete initially**. That could come later, but the first version should be purely manual entry — respecting the "don't steal the art" principle.

---

## 4. UI Concept — Mobile-First

### Practice Mode (Performance View)

```
┌──────────────────────────────────┐
│ Sequence Name           60 min   │
│ "Connect to breath and ground"   │  ← intention
├──────────────────────────────────┤
│ ✓ 1. Centering          (done)  │  ← dimmed, collapsed
├──────────────────────────────────┤
│ ▸ 2. Warm-Up            (done)  │  ← dimmed, collapsed
├──────────────────────────────────┤
│ ▾ 3. Sun Salutations  [2/3]     │  ← active, expanded
│   ┌────────────────────────────┐ │
│   │ ☀ Surya Namaskar A        │ │
│   │   Round 2 of 3            │ │
│   │   [breath] Inhale up,     │ │
│   │   exhale fold              │ │
│   └────────────────────────────┘ │
│   ┌────────────────────────────┐ │
│   │ 🔑 Chaturanga             │ │
│   │   [align] Elbows in,      │ │
│   │   shoulders forward        │ │
│   └────────────────────────────┘ │
│           ⋯                      │
├──────────────────────────────────┤
│ ▸ 4. Standing Flow       5 min  │
│ ▸ 5. Peak: Crow → Headstand    │
│ ▸ 6. Cool-Down                  │
│ ▸ 7. Savasana                   │
└──────────────────────────────────┘
```

### Edit Mode

Similar card-based layout to Mixtastic:

- Drag-and-drop for sections and poses within sections
- Inline editing of pose names, cues, breath, holds, side
- Phase selector (colour-coded dropdown or pills)
- "+" buttons to add poses within a section or add new sections
- Section-level repeat counter
- Side toggle: Both | L | R (with quick "mirror" button to duplicate for other side)

### Colour Coding by Phase

| Phase       | Colour             | Rationale              |
| ----------- | ------------------ | ---------------------- |
| Centering   | Indigo/Purple      | Meditative, inward     |
| Warm-Up     | Amber/Yellow       | Gentle energy building |
| Sun Salutes | Orange             | Heat, fire             |
| Standing    | Green              | Growth, strength       |
| Peak        | Red                | Maximum intensity      |
| Cool-Down   | Teal/Blue          | Calming, cooling       |
| Savasana    | Soft grey/lavender | Rest, stillness        |

---

## 5. Bilateral / Side Handling

This is analogous to Mixtastic's `reversed` / left-right track pairing.

**Approach**: When a pose has `side: 'left'` or `side: 'right'`, visually show a side indicator badge. A "mirror" action on a section duplicates it for the other side:

- User builds a flow for the right side
- Taps "Mirror to Left" → duplicates the section with all sides flipped
- Optionally inserts a "Vinyasa" transition between them

In practice mode, the side badge is prominent (like the OUT/IN tags in Mixtastic).

---

## 6. What We Explicitly Won't Do (V1)

- **No pose database / autocomplete** — user types pose names freely
- **No AI-generated sequences** — the app supports the art, doesn't replace it
- **No music integration** — keep it focused
- **No video/image library** — text-based for speed and simplicity
- **No timer during practice** — maybe V2. For now, breath counts are the clock.
- **No social features** — personal tool first

---

## 7. What We Could Add Later (Future Ideas)

- Pose name suggestions (fuzzy search from a curated list — still user-chosen)
- Duration estimation based on breath counts + average breath rate
- "Arc visualiser" — a small graphic showing the energy curve of the sequence
- Template sequences (starter scaffolds the user fills in)
- Gentle prompts: "You have backbends but no counter-poses after — consider adding?"
- Sanskrit ↔ English toggle
- Print view for taking to studio (no phone)
- Pose images (stick figures, not photos — fast to load)
- Ashtanga mode: fixed primary/secondary series with "completed up to" tracking

---

## 8. Technical Stack (Proposed)

Same as Mixtastic:

- **Vite + React + TypeScript**
- **PWA** (installable, works offline — essential for studio use with no wifi)
- **localStorage** for persistence
- **Google Drive sync** (reuse the same `googleDrive.ts` module, different file name)
- **Mobile-first CSS** (design for 375px first, scale up)
- **No backend** — purely client-side

---

## 9. Open Questions for Discussion

1. **Naming**: "Flow Sequencer"? "Sequence Lab"? "Flowcraft"? Something else?
2. **Section repeats in practice mode**: When a section repeats 3x, do we show it once with a counter, or expand it 3 times? (Suggested: once with counter, tap to advance.)
3. **Vinyasa insertion**: Should "add vinyasa between sides" be a one-tap action or manual?
4. **Duration**: Per-pose, per-section, or just total target? (Suggested: section-level target + optional per-pose breath count.)
5. **Pose names**: Free text to start, or should we seed a lightweight suggestion list from the user's own history?
6. **Theme / through-line**: Just a text field at the top, or something more integrated (e.g. shown as a banner in practice mode)?
7. **Multiple sequences**: Same pattern as Mixtastic (list of sequences, open one to edit/practice)?
