/* ──────────────────────────────────────────────────────────────
 * Sequences — Persistence Layer
 *
 * All data is stored in the browser's localStorage. There is no
 * backend. Data shape is normalised on load so older saved data keeps
 * working as the model evolves.
 * ────────────────────────────────────────────────────────────── */

import {
  type EditorMode,
  type Phase,
  type PracticeStyle,
  type Pose,
  type Section,
  type Sequence,
  type Side,
  generateId,
} from './types';
import { createSampleSequence } from './defaultSequence';

const SEQUENCES_KEY = 'sequences-data';
const THEME_KEY = 'sequences-theme';

/* ── Normalisation (defensive: tolerate partial/legacy data) ── */

function normPhase(value: unknown): Phase {
  const valid: Phase[] = [
    'centering', 'warm-up', 'sun-salutes', 'standing',
    'peak', 'cool-down', 'savasana', 'custom',
  ];
  return valid.includes(value as Phase) ? (value as Phase) : 'standing';
}

function normStyle(value: unknown): PracticeStyle {
  const valid: PracticeStyle[] = [
    'vinyasa', 'hatha', 'ashtanga', 'yin', 'restorative', 'power', 'custom',
  ];
  return valid.includes(value as PracticeStyle) ? (value as PracticeStyle) : 'vinyasa';
}

function normSide(value: unknown): Side {
  return value === 'left' || value === 'right' ? value : 'both';
}

function normViewMode(value: unknown): EditorMode {
  return value === 'practice' ? 'practice' : 'edit';
}

function normNumberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function normPose(input: unknown): Pose {
  const raw = (input ?? {}) as Partial<Pose> & Record<string, unknown>;
  return {
    id: typeof raw.id === 'string' ? raw.id : generateId(),
    name: typeof raw.name === 'string' ? raw.name : '',
    sanskritName: typeof raw.sanskritName === 'string' ? raw.sanskritName : undefined,
    side: normSide(raw.side),
    breath:
      raw.breath === 'inhale' || raw.breath === 'exhale' ||
      raw.breath === 'hold' || raw.breath === 'flow'
        ? raw.breath
        : null,
    holdBreaths: normNumberOrNull(raw.holdBreaths),
    durationSeconds: normNumberOrNull(raw.durationSeconds),
    cues: Array.isArray(raw.cues)
      ? raw.cues.map((c) => ({
          id: typeof c?.id === 'string' ? c.id : generateId(),
          text: typeof c?.text === 'string' ? c.text : '',
          type:
            c?.type === 'alignment' || c?.type === 'breath' ||
            c?.type === 'transition' || c?.type === 'safety'
              ? c.type
              : 'verbal',
        }))
      : [],
    isKeyPose: raw.isKeyPose === true,
    completed: raw.completed === true,
    // Cached analysis is preserved if present, otherwise undefined.
    analysis:
      raw.analysis && typeof raw.analysis === 'object'
        ? (raw.analysis as Pose['analysis'])
        : undefined,
  };
}

function normSection(input: unknown): Section {
  const raw = (input ?? {}) as Partial<Section> & Record<string, unknown>;
  return {
    id: typeof raw.id === 'string' ? raw.id : generateId(),
    name: typeof raw.name === 'string' ? raw.name : '',
    phase: normPhase(raw.phase),
    poses: Array.isArray(raw.poses) && raw.poses.length > 0
      ? raw.poses.map(normPose)
      : [normPose({})],
    repeats: typeof raw.repeats === 'number' && raw.repeats >= 1 ? Math.floor(raw.repeats) : 1,
    notes: typeof raw.notes === 'string' ? raw.notes : '',
    durationMinutes: normNumberOrNull(raw.durationMinutes),
    expanded: raw.expanded !== false,
    completed: raw.completed === true,
  };
}

function normSequence(input: unknown): Sequence {
  const raw = (input ?? {}) as Partial<Sequence> & Record<string, unknown>;
  const now = new Date().toISOString();
  return {
    id: typeof raw.id === 'string' ? raw.id : generateId(),
    name: typeof raw.name === 'string' ? raw.name : '',
    style: normStyle(raw.style),
    intention: typeof raw.intention === 'string' ? raw.intention : '',
    targetDuration: normNumberOrNull(raw.targetDuration),
    sections: Array.isArray(raw.sections) ? raw.sections.map(normSection) : [],
    viewMode: normViewMode(raw.viewMode),
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : now,
  };
}

/* ── Load / Save ── */

export function loadSequences(): Sequence[] {
  try {
    const raw = localStorage.getItem(SEQUENCES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(normSequence);
      }
    }
  } catch {
    /* ignore corrupt data */
  }

  // First launch: seed with the sample sequence.
  const sample = [createSampleSequence()];
  saveSequences(sample);
  return sample;
}

export function saveSequences(sequences: Sequence[]): void {
  localStorage.setItem(SEQUENCES_KEY, JSON.stringify(sequences));
}

/* ── Theme ── */

export function loadTheme(): 'dark' | 'light' {
  return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark';
}

export function saveTheme(theme: 'dark' | 'light'): void {
  localStorage.setItem(THEME_KEY, theme);
}

/* ── Import / Export (versioned envelope) ── */

export interface ExportData {
  version: 1;
  app: 'sequences';
  exportedAt: string;
  sequences: Sequence[];
}

export function exportToJson(sequences: Sequence[]): string {
  const data: ExportData = {
    version: 1,
    app: 'sequences',
    exportedAt: new Date().toISOString(),
    sequences,
  };
  return JSON.stringify(data, null, 2);
}

export function downloadExport(sequences: Sequence[]): void {
  const json = exportToJson(sequences);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sequences-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseImport(text: string): Sequence[] {
  const data = JSON.parse(text);
  if (data?.version === 1 && Array.isArray(data.sequences)) {
    return data.sequences.map(normSequence);
  }
  if (Array.isArray(data)) {
    return data.map(normSequence);
  }
  throw new Error('Unrecognised file format');
}
