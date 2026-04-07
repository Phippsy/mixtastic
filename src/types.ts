export type CueColor = 'blue' | 'green' | 'orange' | 'red';

export interface CueEntry {
  id: string;
  number: number | null;
  color: CueColor;
}

export interface TransitionSide {
  id: string;
  cues: CueEntry[];
  low: number | null;
  mid: number | null;
  high: number | null;
  notes: string;
}

export interface Transition {
  id: string;
  left: TransitionSide;
  right: TransitionSide;
}

export interface TrackPair {
  id: string;
  leftTrack: string;
  rightTrack: string;
  reversed: boolean;
  expanded: boolean;
  completed: boolean;
  transitions: Transition[];
}

export const CUE_COLOR_VALUES: Record<CueColor, string> = {
  blue: '#3b82f6',
  green: '#22c55e',
  orange: '#f59e0b',
  red: '#ef4444',
};

export const CUE_COLORS: CueColor[] = ['blue', 'green', 'orange', 'red'];

let idCounter = 0;
export function generateId(): string {
  return `id-${Date.now()}-${idCounter++}`;
}

export function createEmptyCue(number: number | null = null, color: CueColor = 'blue'): CueEntry {
  return { id: generateId(), number, color };
}

export function createEmptyTransitionSide(): TransitionSide {
  return {
    id: generateId(),
    cues: [],
    low: null,
    mid: null,
    high: null,
    notes: '',
  };
}

export function createEmptyTransition(): Transition {
  return {
    id: generateId(),
    left: {
      ...createEmptyTransitionSide(),
      cues: [createEmptyCue(8, 'orange')],
    },
    right: {
      ...createEmptyTransitionSide(),
      cues: [createEmptyCue(2, 'orange')],
    },
  };
}

export function createEmptyTrackPair(reversed = false): TrackPair {
  return {
    id: generateId(),
    leftTrack: '',
    rightTrack: '',
    reversed,
    expanded: true,
    completed: false,
    transitions: [createEmptyTransition()],
  };
}

/* ── Mix Set (a full session) ── */
export interface MixSet {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  pairs: TrackPair[];
}

export function createEmptyMixSet(name = ''): MixSet {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    name,
    createdAt: now,
    updatedAt: now,
    pairs: [createEmptyTrackPair()],
  };
}
