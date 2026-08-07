/* ──────────────────────────────────────────────────────────────
 * Sequences — Muscle Analysis Service (OpenAI)
 *
 * When the practitioner enters a pose name, we asynchronously ask the
 * OpenAI API which muscle groups the pose targets and how intensely.
 * Results are cached in localStorage (keyed by normalised pose name) so
 * each unique pose is only ever analysed once.
 *
 * ⚠️  SECURITY: This module calls the OpenAI API directly from the
 * browser using a VITE_-prefixed key, which is embedded in the client
 * bundle. This is fine for LOCAL/PERSONAL use only. For any public
 * deployment, replace the `callOpenAI` function body with a call to your
 * own backend proxy that holds the key server-side. Nothing else in the
 * app needs to change. See docs/OPENAI_INTEGRATION.md.
 * ────────────────────────────────────────────────────────────── */

import {
  MUSCLE_GROUPS,
  type MuscleAnalysis,
  type MuscleEngagement,
  type MuscleGroup,
} from './types';

const CACHE_KEY = 'sequences-muscle-cache';
const API_URL = 'https://api.openai.com/v1/chat/completions';

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
const MODEL = (import.meta.env.VITE_OPENAI_MODEL as string | undefined) ?? 'gpt-4o-mini';
const ENABLED =
  (import.meta.env.VITE_ENABLE_MUSCLE_ANALYSIS as string | undefined) !== 'false';

/** True when analysis is configured and available. */
export function isAnalysisAvailable(): boolean {
  return ENABLED && typeof API_KEY === 'string' && API_KEY.length > 0;
}

/* ── Cache (localStorage) ── */

type Cache = Record<string, MuscleAnalysis>;

function cacheKey(name: string, sanskritName?: string): string {
  return `${name.trim().toLowerCase()}|${(sanskritName ?? '').trim().toLowerCase()}`;
}

function loadCache(): Cache {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) return JSON.parse(raw) as Cache;
  } catch {
    /* ignore */
  }
  return {};
}

function saveCache(cache: Cache): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* ignore quota errors */
  }
}

export function getCachedAnalysis(name: string, sanskritName?: string): MuscleAnalysis | undefined {
  if (!name.trim()) return undefined;
  return loadCache()[cacheKey(name, sanskritName)];
}

function setCachedAnalysis(name: string, sanskritName: string | undefined, analysis: MuscleAnalysis): void {
  const cache = loadCache();
  cache[cacheKey(name, sanskritName)] = analysis;
  saveCache(cache);
}

/** Clear all cached analyses (useful for re-analysing after model changes). */
export function clearAnalysisCache(): void {
  localStorage.removeItem(CACHE_KEY);
}

/* ── Prompt construction ── */

function buildSystemPrompt(): string {
  return [
    'You are an expert yoga anatomy assistant embedded in a yoga sequence-',
    'planning app. The practitioner builds a sequence of poses (asanas).',
    'For a single given pose, estimate which muscle groups it targets and how',
    'intensely, plus an overall physical intensity score.',
    '',
    'Use ONLY these coarse muscle groups (no anatomical sub-muscles):',
    MUSCLE_GROUPS.map((g) => `- ${g}`).join('\n'),
    '',
    'Guidance:',
    '- "engagement" is 0-100 for how strongly the pose works that group.',
    '- Only include groups with engagement >= 15; omit the rest.',
    '- "Balance & Stability" reflects proprioceptive/balance demand, not a muscle.',
    '- "intensity" is 0-100 overall physical effort of holding/performing the pose.',
    '- Be realistic: a gentle resting pose is low intensity; an arm balance is high.',
    'Respond with STRICT JSON only, no prose.',
  ].join('\n');
}

function buildUserPrompt(name: string, sanskritName?: string): string {
  const label = sanskritName ? `${name} (${sanskritName})` : name;
  return [
    `Pose: ${label}`,
    '',
    'Return JSON shaped exactly like:',
    '{',
    '  "intensity": <0-100 integer>,',
    '  "muscles": [',
    '    { "group": "<one of the allowed groups>", "engagement": <0-100 integer> }',
    '  ]',
    '}',
  ].join('\n');
}

/* ── Response parsing ── */

function coerceAnalysis(parsed: unknown): MuscleAnalysis {
  const obj = parsed as { intensity?: unknown; muscles?: unknown };
  const intensity = clampInt(obj.intensity, 0, 100, 50);

  const allowed = new Set<MuscleGroup>(MUSCLE_GROUPS);
  const muscles: MuscleEngagement[] = [];
  if (Array.isArray(obj.muscles)) {
    for (const m of obj.muscles) {
      const group = (m as { group?: unknown }).group;
      const engagement = clampInt((m as { engagement?: unknown }).engagement, 0, 100, 0);
      if (typeof group === 'string' && allowed.has(group as MuscleGroup) && engagement >= 15) {
        // De-dupe: keep the highest engagement if the model repeats a group.
        const existing = muscles.find((x) => x.group === group);
        if (existing) {
          existing.engagement = Math.max(existing.engagement, engagement);
        } else {
          muscles.push({ group: group as MuscleGroup, engagement });
        }
      }
    }
  }
  muscles.sort((a, b) => b.engagement - a.engagement);

  return {
    status: 'ready',
    intensity,
    muscles,
    analysedAt: new Date().toISOString(),
  };
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

/* ── OpenAI call ── */

/**
 * The single point of contact with OpenAI. To move to a backend proxy,
 * replace the fetch URL/headers/body here with a call to your own
 * endpoint that returns the same `{ intensity, muscles }` JSON.
 */
async function callOpenAI(name: string, sanskritName?: string): Promise<MuscleAnalysis> {
  if (!isAnalysisAvailable()) {
    throw new Error('Muscle analysis is not configured (missing API key).');
  }

  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: buildUserPrompt(name, sanskritName) },
      ],
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    // A 404 from this endpoint almost always means the configured model
    // name is invalid or unavailable to the account.
    if (resp.status === 404) {
      throw new Error(
        `Model "${MODEL}" not found (404). Check VITE_OPENAI_MODEL in .env — ` +
          `use a valid id like gpt-4o-mini, gpt-5-mini, or gpt-5.4-mini.`,
      );
    }
    if (resp.status === 401) {
      throw new Error('Unauthorized (401). Check VITE_OPENAI_API_KEY in .env.');
    }
    throw new Error(`OpenAI error (${resp.status}): ${body.slice(0, 200)}`);
  }

  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new Error('Unexpected OpenAI response shape');
  }
  return coerceAnalysis(JSON.parse(content));
}

/* ── Public API ── */

/**
 * Analyse a pose, using the cache when possible. Returns a ready or error
 * analysis. Never throws — errors are captured in the returned object.
 */
export async function analysePose(name: string, sanskritName?: string): Promise<MuscleAnalysis> {
  const trimmed = name.trim();
  if (!trimmed) {
    return { status: 'none', intensity: 0, muscles: [] };
  }

  const cached = getCachedAnalysis(trimmed, sanskritName);
  if (cached && cached.status === 'ready') return cached;

  if (!isAnalysisAvailable()) {
    return { status: 'none', intensity: 0, muscles: [] };
  }

  try {
    const analysis = await callOpenAI(trimmed, sanskritName);
    setCachedAnalysis(trimmed, sanskritName, analysis);
    return analysis;
  } catch (err) {
    const errorAnalysis: MuscleAnalysis = {
      status: 'error',
      intensity: 0,
      muscles: [],
      error: err instanceof Error ? err.message : 'Analysis failed',
    };
    // Do not cache errors — allow a retry next time.
    return errorAnalysis;
  }
}
