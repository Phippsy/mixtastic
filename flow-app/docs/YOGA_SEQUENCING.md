# Yoga Sequencing Principles

The design rationale behind **Sequences**. The app is shaped by how experienced teachers actually build classes, so it supports good sequencing thinking without ever doing the sequencing for you.

---

## The Arc of a Class

A well-built yoga class follows an **energetic arc** — it builds intensity, reaches a peak, then winds down. This is why the app models a sequence as ordered **sections**, each tagged with a **phase**:

```
Centering → Warm-Up → Sun Salutations → Standing/Flow → Peak → Cool-Down → Savasana
   ↑ calm                    ↑ building              ↑ max         ↓ release    ↓ rest
```

### Phase by phase

1. **Centering** (2–5 min) — Breath, intention-setting, arrival. Sets the through-line/theme.
2. **Warm-Up** (5–10 min) — Gentle mobilisation: cat-cow, spinal twists, hip circles. Free the joints before asking for range.
3. **Sun Salutations** (5–15 min) — Surya Namaskar A/B. Builds heat, establishes the breath-movement rhythm. Often repeated 3–5 rounds (→ a section with `repeats`).
4. **Standing / Flow** (15–25 min) — Warriors, lunges, twists, balances. Where the creative sequencing happens, usually as mini-flows repeated per side, building toward the peak.
5. **Peak** (5–10 min) — The most challenging pose(s). Everything before prepares for this. Mark these with the **key-pose** flag.
6. **Cool-Down** (5–10 min) — Counter-poses to neutralise the peak, then slower, more passive work.
7. **Savasana / Close** (5–10 min) — Final rest, integration, closing.

---

## Core Principles (and how the app supports them)

| Principle                     | What it means                                                         | How the app helps                                                               |
| ----------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **Warm before you stretch**   | Mobilise joints before deep range.                                    | Phases order the arc; warm-up phase is visually distinct.                       |
| **Simple → complex**          | Build toward complexity gradually.                                    | Sections + key-pose flag make the build-to-peak visible.                        |
| **Counterpose**               | Neutralise after deep/one-directional work (backbend → forward fold). | Cool-down phase; (future) gentle prompts.                                       |
| **Bilateral symmetry**        | What you do on the right, do on the left.                             | Per-pose `side` + one-tap **Mirror** to duplicate a section with sides flipped. |
| **Peak preparation**          | Every build-up pose should open/strengthen what the peak needs.       | Key-pose flag + per-section muscle charts show what each part works.            |
| **Energy management**         | The class should feel like a wave, not a flat line.                   | The phase arc makes the energetic shape explicit.                               |
| **Breath leads movement**     | Inhale = expand/lift, exhale = fold/twist/ground.                     | Per-pose `breath` cue (inhale/exhale/hold/flow).                                |
| **Repetition with variation** | Repeat a mini-flow 2–3× adding layers.                                | Section `repeats` with a round counter in practice mode.                        |

---

## Vinyasa-Specific Concepts

- **Vinyasa** (the linking sequence): Chaturanga → Up Dog → Down Dog, used as punctuation between sides or pose families. Modelled as just another pose (often named "Vinyasa" with a transition cue).
- **Flow vs Hold**: some poses are flowed through (1 breath/movement → `holdBreaths: null`), others held (3–10 breaths → `holdBreaths: N`). This distinction matters and is captured per pose. It also weights the muscle aggregation (held poses contribute more).
- **Rounds**: a mini-sequence repeated 2–3× — first round to learn, second to deepen, third to add variation. Modelled as `Section.repeats`.
- **Side-switching**: bilateral sequences track which side; the common pattern is Right → Vinyasa → Left → Vinyasa → next. The **Mirror** action builds the second side in one tap.

---

## Pose Categories

Useful mental model (and the basis of the autocomplete library). Not enforced by the app:

Standing · Balancing · Forward Folds · Backbends · Twists · Inversions · Arm Balances · Hip Openers · Core · Restorative/Passive · Seated · Supine · Prone · Transitions (vinyasa, jump-through, float).

---

## The Non-Negotiable Principle

> **The app never auto-generates sequences.**

It can _suggest_ pose names (autocomplete), _show_ feedback (muscle focus, the phase arc), and _offer_ one-tap conveniences (mirror a side). But the decision about what comes next — the actual art of sequencing — always belongs to the practitioner. Future "helpful nudges" (e.g. "you have backbends but no counter-pose after — consider adding one?") must remain **questions and observations**, never automated edits.

---

## Sources & Further Reading

These principles are widely taught across 200-hour yoga teacher trainings and sequencing texts. Recommended references:

- Mark Stephens, _Teaching Yoga: Essential Foundations and Techniques_ and _Yoga Sequencing: Designing Transformative Yoga Classes_.
- The classical Ashtanga vinyasa structure (Krishnamacharya → Pattabhi Jois) for the breath-linked flow lineage.
- Donna Farhi, _The Breathing Book_ (breath-movement coordination).
