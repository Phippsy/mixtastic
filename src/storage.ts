import { type MixSet, type TrackPair, generateId } from './types';

const SETS_KEY = 'mixtastic-sets';
const THEME_KEY = 'mixtastic-theme';

// Legacy keys (pre-multi-set)
const LEGACY_PAIRS_KEY = 'mixtastic-pairs';
const LEGACY_NAME_KEY = 'mixtastic-name';

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
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }

  // Try migrating legacy data
  const migrated = migrateLegacy();
  if (migrated) return migrated;

  return [];
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
