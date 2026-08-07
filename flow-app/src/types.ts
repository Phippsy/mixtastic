/* ──────────────────────────────────────────────────────────────
 * Sequences — Core Data Model
 *
 * Structure: Sequence → Section → Pose
 *  - A Sequence is one complete yoga practice/class.
 *  - A Section is a named block of the practice (e.g. "Sun Salutations"),
 *    tagged with a Phase of the energetic arc, and may repeat N times.
 *  - A Pose is a single asana/movement within a section, with a side,
 *    breath pattern, optional hold/duration, cues, and a key-pose flag.
 * ────────────────────────────────────────────────────────────── */

/* ── Enums / unions ── */

export type PracticeStyle =
  | 'vinyasa'
  | 'hatha'
  | 'ashtanga'
  | 'yin'
  | 'restorative'
  | 'power'
  | 'custom';

export type Side = 'both' | 'left' | 'right';

export type BreathPattern = 'inhale' | 'exhale' | 'hold' | 'flow' | null;

export type CueType = 'alignment' | 'breath' | 'verbal' | 'transition' | 'safety';

/**
 * The seven phases of a yoga class's energetic arc.
 * Phase is metadata used for colour-coding and (future) gentle validation.
 * It does NOT constrain ordering — the practitioner decides everything.
 */
export type Phase =
  | 'centering'
  | 'warm-up'
  | 'sun-salutes'
  | 'standing'
  | 'peak'
  | 'cool-down'
  | 'savasana'
  | 'custom';

export type EditorMode = 'edit' | 'practice';

/**
 * The fixed set of muscle/effort groups used for analysis & visualisation.
 * Deliberately coarse (not anatomical) so feedback stays legible.
 * "Balance & Stability" is not a muscle but is useful practitioner feedback.
 */
export type MuscleGroup =
  | 'Core'
  | 'Shoulders'
  | 'Chest'
  | 'Upper Back'
  | 'Lower Back'
  | 'Glutes & Hips'
  | 'Hip Flexors'
  | 'Hamstrings'
  | 'Quadriceps'
  | 'Calves & Ankles'
  | 'Arms'
  | 'Balance & Stability';

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'Core',
  'Shoulders',
  'Chest',
  'Upper Back',
  'Lower Back',
  'Glutes & Hips',
  'Hip Flexors',
  'Hamstrings',
  'Quadriceps',
  'Calves & Ankles',
  'Arms',
  'Balance & Stability',
];

/* ── Muscle analysis (populated asynchronously by OpenAI) ── */

export interface MuscleEngagement {
  group: MuscleGroup;
  /** 0–100 — how strongly this pose engages this group. */
  engagement: number;
}

export type MuscleAnalysisStatus = 'none' | 'pending' | 'ready' | 'error';

export interface MuscleAnalysis {
  status: MuscleAnalysisStatus;
  /** 0–100 — overall physical intensity/effort of the pose. */
  intensity: number;
  muscles: MuscleEngagement[];
  /** When the analysis was produced, ISO timestamp. */
  analysedAt?: string;
  /** Error message if status === 'error'. */
  error?: string;
}

/* ── Building blocks ── */

export interface Cue {
  id: string;
  text: string;
  type: CueType;
}

export interface Pose {
  id: string;
  /** English/common name, e.g. "Warrior II". */
  name: string;
  /** Sanskrit name, e.g. "Virabhadrasana II". Optional. */
  sanskritName?: string;
  side: Side;
  breath: BreathPattern;
  /** If holding, number of breaths to hold. null = flow through (1 breath/movement). */
  holdBreaths: number | null;
  /** Optional explicit timed hold in seconds (for yin/restorative). */
  durationSeconds: number | null;
  cues: Cue[];
  /** Visually highlighted as a key/peak pose (like a "kill" flag). */
  isKeyPose: boolean;
  /** Practice-mode completion. */
  completed: boolean;
  /** Cached muscle analysis. Keyed conceptually by name; cache also in storage. */
  analysis?: MuscleAnalysis;
}

export interface Section {
  id: string;
  name: string;
  phase: Phase;
  poses: Pose[];
  /** How many times to perform this section (1 = once). */
  repeats: number;
  /** Section-level notes / theme. */
  notes: string;
  /** Estimated/target duration in minutes (optional). */
  durationMinutes: number | null;
  expanded: boolean;
  completed: boolean;
}

export interface Sequence {
  id: string;
  name: string;
  style: PracticeStyle;
  /** The through-line / theme — shown as a banner in practice mode. */
  intention: string;
  /** Total target class length in minutes (optional). */
  targetDuration: number | null;
  sections: Section[];
  viewMode: EditorMode;
  createdAt: string;
  updatedAt: string;
}

/* ── Display metadata ── */

export const PHASE_LABELS: Record<Phase, string> = {
  centering: 'Centering',
  'warm-up': 'Warm-Up',
  'sun-salutes': 'Sun Salutations',
  standing: 'Standing / Flow',
  peak: 'Peak',
  'cool-down': 'Cool-Down',
  savasana: 'Savasana / Close',
  custom: 'Custom',
};

export const PHASE_ORDER: Phase[] = [
  'centering',
  'warm-up',
  'sun-salutes',
  'standing',
  'peak',
  'cool-down',
  'savasana',
  'custom',
];

/** Colour per phase (CSS custom-property friendly hex values). */
export const PHASE_COLORS: Record<Phase, string> = {
  centering: '#a78bfa', // indigo/purple — meditative
  'warm-up': '#fbbf24', // amber — gentle warmth
  'sun-salutes': '#fb923c', // orange — heat/fire
  standing: '#34d399', // green — strength/growth
  peak: '#f87171', // red — max intensity
  'cool-down': '#38bdf8', // sky blue — cooling
  savasana: '#c4b5fd', // soft lavender — rest
  custom: '#94a3b8', // slate — neutral
};

export const STYLE_LABELS: Record<PracticeStyle, string> = {
  vinyasa: 'Vinyasa',
  hatha: 'Hatha',
  ashtanga: 'Ashtanga',
  yin: 'Yin',
  restorative: 'Restorative',
  power: 'Power',
  custom: 'Custom',
};

export const SIDE_LABELS: Record<Side, string> = {
  both: 'Both',
  left: 'Left',
  right: 'Right',
};

export const BREATH_LABELS: Record<NonNullable<BreathPattern>, string> = {
  inhale: 'Inhale',
  exhale: 'Exhale',
  hold: 'Hold',
  flow: 'Flow',
};

export const CUE_TYPE_LABELS: Record<CueType, string> = {
  alignment: 'Alignment',
  breath: 'Breath',
  verbal: 'Verbal',
  transition: 'Transition',
  safety: 'Safety',
};

export const CUE_TYPE_COLORS: Record<CueType, string> = {
  alignment: '#34d399',
  breath: '#38bdf8',
  verbal: '#c4b5fd',
  transition: '#fbbf24',
  safety: '#f87171',
};

/* ── ID generation ── */

let idCounter = 0;
export function generateId(): string {
  return `id-${Date.now()}-${idCounter++}`;
}

/* ── Factory functions ── */

export function createCue(type: CueType = 'verbal', text = ''): Cue {
  return { id: generateId(), type, text };
}

export function createPose(name = '', side: Side = 'both'): Pose {
  return {
    id: generateId(),
    name,
    sanskritName: undefined,
    side,
    breath: null,
    holdBreaths: null,
    durationSeconds: null,
    cues: [],
    isKeyPose: false,
    completed: false,
    analysis: undefined,
  };
}

export function createSection(phase: Phase = 'standing', name = ''): Section {
  return {
    id: generateId(),
    name,
    phase,
    poses: [createPose()],
    repeats: 1,
    notes: '',
    durationMinutes: null,
    expanded: true,
    completed: false,
  };
}

export function createSequence(): Sequence {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    name: '',
    style: 'vinyasa',
    intention: '',
    targetDuration: 60,
    sections: [createSection('centering', 'Centering')],
    viewMode: 'edit',
    createdAt: now,
    updatedAt: now,
  };
}

/** Flip a pose's side: left↔right; "both" stays "both". */
export function flipSide(side: Side): Side {
  if (side === 'left') return 'right';
  if (side === 'right') return 'left';
  return 'both';
}
