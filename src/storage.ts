import {
  type EditorMode,
  type MixSet,
  type NoteEntry,
  type TrackPair,
  type TransitionSide,
  generateId,
} from './types';
import { createDanfestSet } from './defaultSet';

const SETS_KEY = 'mixtastic-sets';
const THEME_KEY = 'mixtastic-theme';

// Legacy keys (pre-multi-set)
const LEGACY_PAIRS_KEY = 'mixtastic-pairs';
const LEGACY_NAME_KEY = 'mixtastic-name';

function normalizeViewMode(value: unknown): EditorMode {
  return value === 'mix' ? 'mix' : 'edit';
}

function normalizeNotes(value: unknown): { notes: NoteEntry; kill: boolean } {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return {
      notes: {
        text: /^kill$/i.test(trimmed) ? '' : value,
        color: 'black',
      },
      kill: /^kill$/i.test(trimmed),
    };
  }

  const maybeNote = value as Partial<NoteEntry> | null;
  const text = typeof maybeNote?.text === 'string' ? maybeNote.text : '';
  const color = maybeNote?.color === 'green' || maybeNote?.color === 'red' ? maybeNote.color : 'black';
  const trimmed = text.trim();

  return {
    notes: {
      text: /^kill$/i.test(trimmed) ? '' : text,
      color,
    },
    kill: /^kill$/i.test(trimmed),
  };
}

function normalizeTransitionSide(side: TransitionSide | (Omit<TransitionSide, 'notes' | 'kill'> & { notes?: unknown; kill?: unknown })): TransitionSide {
  const normalizedNote = normalizeNotes(side.notes);
  return {
    ...side,
    notes: normalizedNote.notes,
    kill: typeof side.kill === 'boolean' ? side.kill || normalizedNote.kill : normalizedNote.kill,
  };
}

function normalizeSet(set: MixSet | (Omit<MixSet, 'viewMode' | 'pairs'> & { viewMode?: unknown; pairs: TrackPair[] })): MixSet {
  return {
    ...set,
    viewMode: normalizeViewMode(set.viewMode),
    pairs: set.pairs.map(pair => ({
      ...pair,
      transitions: pair.transitions.map(transition => ({
        ...transition,
        left: normalizeTransitionSide(transition.left),
        right: normalizeTransitionSide(transition.right),
      })),
    })),
  };
}

/* ── Migration from single-session format ── */
function migrateLegacy(): MixSet[] | null {
  try {
    const raw = localStorage.getItem(LEGACY_PAIRS_KEY);
    if (!raw) return null;
    const pairs: TrackPair[] = JSON.parse(raw);
    if (!Array.isArray(pairs) || pairs.length === 0 || !('leftTrack' in pairs[0])) return null;

    const name = localStorage.getItem(LEGACY_NAME_KEY) ?? 'My First Mix';
    const now = new Date().toISOString();
    const set: MixSet = {
      id: generateId(),
      name,
      createdAt: now,
      updatedAt: now,
      viewMode: 'edit',
      pairs,
    };

    // Save in new format & clean up legacy
    localStorage.setItem(SETS_KEY, JSON.stringify([set]));
    localStorage.removeItem(LEGACY_PAIRS_KEY);
    localStorage.removeItem(LEGACY_NAME_KEY);

    return [set];
  } catch {
    return null;
  }
}

/* ── Load / Save ── */
export function loadSets(): MixSet[] {
  try {
    const raw = localStorage.getItem(SETS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(normalizeSet);
    }
  } catch { /* ignore */ }

  // Try migrating legacy data
  const migrated = migrateLegacy();
  if (migrated) return migrated;

  // First launch: load sample set
  const sample = [createDanfestSet()];
  saveSets(sample);
  return sample;
}

export function saveSets(sets: MixSet[]) {
  localStorage.setItem(SETS_KEY, JSON.stringify(sets));
}

export function loadTheme(): 'dark' | 'light' {
  return (localStorage.getItem(THEME_KEY) as 'dark' | 'light') ?? 'dark';
}

export function saveTheme(theme: 'dark' | 'light') {
  localStorage.setItem(THEME_KEY, theme);
}

/* ── Import / Export ── */
export interface ExportData {
  version: 1;
  exportedAt: string;
  sets: MixSet[];
}

export function exportAllData(sets: MixSet[]): string {
  const data: ExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    sets,
  };
  return JSON.stringify(data, null, 2);
}

export function downloadExport(sets: MixSet[]) {
  const json = exportAllData(sets);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mixtastic-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseImport(text: string): MixSet[] {
  const data = JSON.parse(text);

  // Validate structure
  if (data.version === 1 && Array.isArray(data.sets)) {
    return data.sets as MixSet[];
  }

  // Also accept a raw array of MixSets
  if (Array.isArray(data) && data.length > 0 && 'pairs' in data[0]) {
    return data as MixSet[];
  }

  throw new Error('Unrecognised file format');
}
