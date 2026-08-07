# Deploying Sequences to Vercel

This guide takes the **Sequences** app from a local project to a live, secure Vercel deployment. It assumes you are a fresh agent/developer with no prior context — read [START_HERE.md](START_HERE.md) first if you have not.

There are two parts:

1. **Static deploy** — Vercel serves the built `dist/` as a static site. Easy.
2. **Serverless OpenAI proxy** — moves the API key off the client and onto the server. **Required** for a public deploy. This is the bulk of the work.

---

## Part 0 — Why a Proxy Is Required (do not skip)

The app calls OpenAI from `src/muscleAnalysis.ts` using `import.meta.env.VITE_OPENAI_API_KEY`. Vite **inlines every `VITE_`-prefixed variable into the client bundle**. On a public site, anyone can open DevTools and read that key, then spend your money.

The fix: add a tiny **Vercel Serverless Function** (under `/api`) that holds the key as a server-only secret, calls OpenAI, and returns the result. The browser calls that function instead of OpenAI. The key never reaches the client.

Vercel automatically turns any file under an `api/` directory at the project root into a serverless endpoint. No extra server, no separate deploy.

---

## Part 1 — Project Prep

### 1.1 Confirm the build works

```bash
npm install
npm run build      # tsc --noEmit && vite build  → dist/
```

`vite.config.ts` already sets `base: '/'`, which is correct for Vercel (root domain). Do not change it.

### 1.2 Initialise git (if not already)

```bash
git init
git add -A
git commit -m "Initial commit: Sequences yoga flow app"
```

Make sure `.gitignore` excludes `node_modules/`, `dist/`, and `.env*`. It already does. **Never commit `.env`.**

Push to a GitHub/GitLab/Bitbucket repo (Vercel deploys from a connected git repo, or via the CLI — see Part 5).

---

## Part 2 — Add the Serverless OpenAI Proxy

### 2.1 Create the API function

Create a new file at the **project root** (NOT inside `src/`):

**`api/analyse-pose.ts`**

```ts
// Vercel Serverless Function (Node runtime).
// Holds the OpenAI key server-side. The browser calls THIS, never OpenAI directly.
//
// Request  (POST JSON): { "name": string, "sanskritName"?: string }
// Response (200  JSON): { "intensity": number, "muscles": [{ "group": string, "engagement": number }] }

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Keep this list in sync with MUSCLE_GROUPS in src/types.ts.
const MUSCLE_GROUPS = [
  'Core', 'Shoulders', 'Chest', 'Upper Back', 'Lower Back',
  'Glutes & Hips', 'Hip Flexors', 'Hamstrings', 'Quadriceps',
  'Calves & Ankles', 'Arms', 'Balance & Stability',
];

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

function systemPrompt(): string {
  return [
    'You are an expert yoga anatomy assistant embedded in a yoga sequence-',
    'planning app. For a single given pose, estimate which muscle groups it',
    'targets and how intensely, plus an overall physical intensity score.',
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

function userPrompt(name: string, sanskritName?: string): string {
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server missing OPENAI_API_KEY' });
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const { name, sanskritName } = (req.body ?? {}) as { name?: string; sanskritName?: string };
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Missing pose "name"' });
  }

  try {
    const r = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt() },
          { role: 'user', content: userPrompt(name, sanskritName) },
        ],
      }),
    });

    if (!r.ok) {
      const body = await r.text();
      return res.status(r.status).json({ error: `OpenAI error: ${body.slice(0, 200)}` });
    }

    const data = await r.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      return res.status(502).json({ error: 'Unexpected OpenAI response shape' });
    }

    // Return the raw {intensity, muscles} JSON. The client coerces/validates it.
    return res.status(200).json(JSON.parse(content));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Analysis failed';
    return res.status(500).json({ error: message });
  }
}
```

### 2.2 Install the serverless type package

```bash
npm install --save-dev @vercel/node
```

(Only used for the function's request/response types. It does not bloat the client bundle — `api/` is built separately by Vercel.)

---

## Part 3 — Point the Client at the Proxy

Edit **`src/muscleAnalysis.ts`**. Only the `callOpenAI` function and the config constants change. Everything else (caching, validation via `coerceAnalysis`, orchestration in `SequenceEditor.tsx`) stays exactly the same.

### 3.1 Replace the OpenAI-direct call

Find the current `callOpenAI` function (it `fetch`es `https://api.openai.com/...` with the `Authorization` header). Replace its body so it calls the proxy:

```ts
// NEW production version: call our own serverless proxy. No key in the client.
async function callOpenAI(name: string, sanskritName?: string): Promise<MuscleAnalysis> {
  const resp = await fetch('/api/analyse-pose', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, sanskritName }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Analysis proxy error (${resp.status}): ${body.slice(0, 200)}`);
  }

  // The proxy returns the same { intensity, muscles } shape OpenAI produced.
  return coerceAnalysis(await resp.json());
}
```

### 3.2 Update the availability check

The client no longer needs `VITE_OPENAI_API_KEY`. Analysis is available whenever it is not explicitly disabled. Change the config block near the top of the file:

```ts
// Muscle analysis is served by the /api/analyse-pose serverless proxy.
// No API key is read on the client anymore.
const ENABLED =
  (import.meta.env.VITE_ENABLE_MUSCLE_ANALYSIS as string | undefined) !== 'false';

export function isAnalysisAvailable(): boolean {
  return ENABLED;
}
```

Delete the now-unused `API_KEY`, `MODEL`, and `API_URL` constants from the client file (the proxy owns the model and URL now). Leave `coerceAnalysis`, the cache helpers, and `analysePose` untouched.

> **Tip for the agent doing this:** after editing, run `npm run build`. TypeScript will flag any leftover references to the deleted constants. Fix those and rebuild until clean.

### 3.3 Keep local development working (two options)

- **Option A (recommended): use Vercel's local dev.** `vercel dev` runs both the Vite frontend and the `api/` functions together, so `/api/analyse-pose` works locally exactly as in production. Put your key in `.env` as `OPENAI_API_KEY` (no `VITE_` prefix, so it stays server-side).
- **Option B: plain `npm run dev`.** The `/api/*` route does not exist under Vite alone, so analysis will fail locally (the app still works; poses just show the analysis error with a Retry). Use Option A when you need to test analysis locally.

Update `.env.example` to reflect the server-side variable names:

```bash
# Server-side only (NO VITE_ prefix) — used by api/analyse-pose.ts via `vercel dev`
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o-mini

# Optional client flag: set "false" to disable analysis entirely (no API calls)
VITE_ENABLE_MUSCLE_ANALYSIS=true
```

---

## Part 4 — Configure Vercel

### 4.1 Project settings

When you import the repo in the Vercel dashboard (or via `vercel`), it auto-detects Vite. Confirm:

- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### 4.2 Environment variables (Vercel dashboard → Settings → Environment Variables)

Add these as **server-side** variables (do NOT prefix with `VITE_`):

| Name | Value | Notes |
|---|---|---|
| `OPENAI_API_KEY` | your real key | Server-only. Never exposed to the browser. |
| `OPENAI_MODEL` | `gpt-4o-mini` | Optional. Any valid model id (hyphens, not dots). |

Set them for **Production** (and Preview if you want analysis on preview deploys). Redeploy after adding/changing env vars — they are read at function runtime, but a redeploy guarantees a clean state.

### 4.3 SPA routing (optional but recommended)

This is a single-page app. If you later add client-side routes, add a rewrite so deep links resolve to `index.html`. Create **`vercel.json`** at the project root:

```json
{
  "rewrites": [
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

The negative lookahead keeps `/api/*` hitting the serverless functions. For the current single-screen app this is optional, but it is harmless and future-proofs routing.

---

## Part 5 — Deploy

### Option A — Git-connected (recommended)

1. Push the repo to GitHub/GitLab/Bitbucket.
2. In the Vercel dashboard: **Add New → Project → Import** the repo.
3. Confirm the settings from 4.1, add the env vars from 4.2.
4. **Deploy.** Every future `git push` to the main branch auto-deploys; pull requests get preview URLs.

### Option B — Vercel CLI

```bash
npm i -g vercel
vercel            # first run links/creates the project, deploys a preview
vercel --prod     # promote to production
```

Set env vars via CLI if you prefer:

```bash
vercel env add OPENAI_API_KEY production
vercel env add OPENAI_MODEL production
```

For local testing with the functions running:

```bash
vercel dev        # serves Vite + /api together at localhost:3000
```

---

## Part 6 — Post-Deploy Verification

1. Open the production URL. The sample sequence loads.
2. Open the editor, expand a section. Each named pose shows a pulsing amber analysis dot.
3. Within a few seconds the dots turn green and muscle tags appear. The whole-sequence muscle chart fills in.
4. Open DevTools → Network. Confirm requests go to **`/api/analyse-pose`** (your domain), NOT `api.openai.com`.
5. Open DevTools → Sources / search the bundle for `sk-`. **The key must not appear anywhere in client assets.**
6. If a pose shows a red "Muscle analysis failed" row, tap **Retry**; check the Vercel function logs (dashboard → Deployments → Functions) for the error (usually a bad `OPENAI_MODEL` or missing `OPENAI_API_KEY`).

---

## Part 7 — Hardening (recommended for a public URL)

The proxy removes the key-exposure problem, but a public `/api/analyse-pose` can still be called by anyone. Consider:

- **Rate limiting** — add Vercel's `@vercel/firewall` or a simple per-IP limiter (e.g. Upstash Redis) so the endpoint cannot be abused to run up your OpenAI bill.
- **Input caps** — reject overly long `name` strings; the function already requires a string.
- **Allowed-origin check** — verify `req.headers.origin` / `referer` matches your domain before calling OpenAI (defence in depth; not foolproof).
- **A spend cap** — set a monthly usage limit in the OpenAI dashboard.
- **Caching is already client-side** (each unique pose is analysed once and stored in `localStorage`), which naturally limits calls per user.

None of these are required to go live, but the rate limit is strongly advised before sharing the URL widely.

---

## Part 8 — PWA / Caching Note

The app uses `vite-plugin-pwa` with a service worker. After a deploy, returning users may need one reload to pick up the new version (the SW is configured with `skipWaiting` + `clientsClaim`, and the `cacheId` is versioned from `package.json`). If you ship a breaking change, bump the `version` in `package.json` so the cache id changes and old caches are evicted.

---

## Summary Checklist

- [ ] `api/analyse-pose.ts` created at project root; `@vercel/node` installed.
- [ ] `src/muscleAnalysis.ts`: `callOpenAI` now hits `/api/analyse-pose`; `API_KEY`/`MODEL`/`API_URL` removed; `isAnalysisAvailable` simplified.
- [ ] `.env.example` updated to server-side `OPENAI_API_KEY` / `OPENAI_MODEL`.
- [ ] `npm run build` passes clean.
- [ ] Vercel project: Vite preset, build `npm run build`, output `dist`.
- [ ] Vercel env vars `OPENAI_API_KEY` (+ optional `OPENAI_MODEL`) set, no `VITE_` prefix.
- [ ] Deployed; Network tab shows `/api/analyse-pose`, bundle contains no key.
- [ ] (Recommended) rate limiting + OpenAI spend cap before sharing publicly.
