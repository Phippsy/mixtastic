/* ──────────────────────────────────────────────────────────────
 * Sequences — Muscle Aggregation
 *
 * Rolls up per-pose muscle analyses into totals for a section or a whole
 * sequence, so the muscle chart can show "what is this practice working".
 *
 * Aggregation weights each pose's engagement by how long it is held:
 *   weight = max(holdBreaths, 1) * max(section.repeats, 1)
 * Flow-through poses (holdBreaths null) count as 1 breath.
 * ────────────────────────────────────────────────────────────── */

import {
  MUSCLE_GROUPS,
  type MuscleGroup,
  type Pose,
  type Section,
  type Sequence,
} from './types';

export interface MuscleTotal {
  group: MuscleGroup;
  /** Normalised 0–100 relative engagement across the analysed scope. */
  value: number;
  /** Raw weighted sum (for internal sorting / debugging). */
  raw: number;
}

function poseWeight(pose: Pose, repeats: number): number {
  const holds = pose.holdBreaths && pose.holdBreaths > 0 ? pose.holdBreaths : 1;
  return holds * Math.max(repeats, 1);
}

/** Accumulate weighted engagement from a list of poses into a totals map. */
function accumulate(
  totals: Map<MuscleGroup, number>,
  poses: Pose[],
  repeats: number,
): void {
  for (const pose of poses) {
    if (!pose.analysis || pose.analysis.status !== 'ready') continue;
    const weight = poseWeight(pose, repeats);
    for (const m of pose.analysis.muscles) {
      totals.set(m.group, (totals.get(m.group) ?? 0) + m.engagement * weight);
    }
  }
}

function normalise(totals: Map<MuscleGroup, number>): MuscleTotal[] {
  const max = Math.max(1, ...totals.values());
  return MUSCLE_GROUPS.map((group) => {
    const raw = totals.get(group) ?? 0;
    return { group, raw, value: Math.round((raw / max) * 100) };
  })
    .filter((t) => t.raw > 0)
    .sort((a, b) => b.raw - a.raw);
}

/** Aggregate muscle totals for a single section. */
export function aggregateSection(section: Section): MuscleTotal[] {
  const totals = new Map<MuscleGroup, number>();
  accumulate(totals, section.poses, section.repeats);
  return normalise(totals);
}

/** Aggregate muscle totals across an entire sequence. */
export function aggregateSequence(sequence: Sequence): MuscleTotal[] {
  const totals = new Map<MuscleGroup, number>();
  for (const section of sequence.sections) {
    accumulate(totals, section.poses, section.repeats);
  }
  return normalise(totals);
}

/** Count how many poses still need (or are awaiting) analysis. */
export function countUnanalysed(sequence: Sequence): number {
  let n = 0;
  for (const section of sequence.sections) {
    for (const pose of section.poses) {
      if (!pose.name.trim()) continue;
      if (!pose.analysis || pose.analysis.status !== 'ready') n += 1;
    }
  }
  return n;
}
