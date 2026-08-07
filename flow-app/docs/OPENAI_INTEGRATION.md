# OpenAI Muscle Analysis

How the app figures out which muscles a pose targets, and the **security model** you must follow before deploying publicly.

---

## What It Does

When the practitioner enters a pose name, the app asynchronously asks OpenAI: _"Which muscle groups does this pose target, and how intensely?"_ The result is cached and used to draw the muscle-focus charts for each section and the whole sequence.

This gives the practitioner useful feedback on their practice (e.g. "this flow is heavy on hip flexors and core, light on upper back") **without** automating the sequencing itself.

---

## Configuration

Copy `.env.example` to `.env` and set:

```bash
VITE_OPENAI_API_KEY=sk-...          # required to enable analysis
VITE_OPENAI_MODEL=gpt-4o-mini       # optional, defaults to gpt-4o-mini
VITE_ENABLE_MUSCLE_ANALYSIS=true    # optional, set "false" to disable all API calls
```

If no key is present, the app runs fully offline — the muscle charts simply show a hint to add a key. Nothing breaks.

### Troubleshooting

- **Every pose shows a red "Muscle analysis failed" row, console shows 404** — `VITE_OPENAI_MODEL` is set to a model that does not exist or is not available to your account. Model ids use hyphens, not dots (`gpt-4o-mini`, `gpt-5-mini`, `gpt-5.4-mini` — not `gpt-5.5.mini`). Fix the value in `.env` and restart the dev server (Vite reads `.env` only at startup). Tap **Retry** on a pose to re-run it.
- **401 Unauthorized** — the API key is missing, malformed, or revoked. Check `VITE_OPENAI_API_KEY`.
- The error message for each pose is shown inline (and on hover) so you can see exactly what failed.

---

## ⚠️ Security Model — READ THIS

Vite inlines any `VITE_`-prefixed env var into the client bundle. **The OpenAI key shipped this way is visible to anyone who opens the app** (via the JS bundle or network inspector).

- ✅ **Fine for**: local development, personal use on your own device.
- ❌ **NOT fine for**: any public/shared deployment.

### Production fix (recommended)

Move the OpenAI call behind a tiny backend proxy that holds the key server-side. The app is structured so **only one function changes**: `callOpenAI` in `src/muscleAnalysis.ts`.

```ts
// src/muscleAnalysis.ts — production version of callOpenAI
async function callOpenAI(
  name: string,
  sanskritName?: string,
): Promise<MuscleAnalysis> {
  const resp = await fetch("/api/analyse-pose", {
    // your own endpoint
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, sanskritName }),
  });
  if (!resp.ok) throw new Error(`Proxy error (${resp.status})`);
  return coerceAnalysis(await resp.json());
}
```

Your serverless function (Vercel / Netlify / Cloudflare Worker) holds `OPENAI_API_KEY` as a server secret, builds the same prompt, calls OpenAI, and returns `{ intensity, muscles }`. The rest of the app — caching, aggregation, charts — is unchanged.

---

## How It Works Internally (`src/muscleAnalysis.ts`)

### The request

- Endpoint: `POST https://api.openai.com/v1/chat/completions`
- `response_format: { type: 'json_object' }` forces strict JSON back.
- `temperature: 0.2` for consistent, repeatable results.
- A **system prompt** explains the app context, lists the 12 allowed muscle groups, and sets the rules (engagement 0–100, omit groups below 15, intensity 0–100).
- A **user prompt** gives the pose name (+ Sanskrit) and the exact JSON shape to return.

### The response shape

```json
{
  "intensity": 72,
  "muscles": [
    { "group": "Core", "engagement": 80 },
    { "group": "Shoulders", "engagement": 65 },
    { "group": "Balance & Stability", "engagement": 70 }
  ]
}
```

`coerceAnalysis` validates this: clamps numbers to 0–100, drops unknown groups, removes engagements below 15, de-dupes, and sorts by engagement. A malformed response can never corrupt app state.

### Caching

- Results are cached in `localStorage['sequences-muscle-cache']`, keyed by normalised `name|sanskritName`.
- Each unique pose is analysed **once ever** (across sessions) — re-opening or reusing a pose is free.
- Errors are **not** cached, so a transient failure can be retried; but see the per-session guard below.
- `clearAnalysisCache()` wipes the cache (e.g. after changing model).

### Orchestration (in `SequenceEditor.tsx`)

The editor runs the analysis in the background with several safeguards so it's robust and cheap:

1. Cache is checked first — no redundant API calls.
2. An **in-flight set** prevents duplicate concurrent calls for the same pose.
3. A per-session **attempted set** ensures each pose is auto-analysed at most once, so a bad key or persistent error can't trigger a retry storm / runaway cost.
4. Status is surfaced as a coloured dot on the pose: amber pulsing = pending, green = ready, red = error (hover for the message).

---

## Cost

`gpt-4o-mini` is inexpensive and each call is tiny (a pose name in, a small JSON out). Because results are cached per unique pose forever, ongoing cost is minimal — you pay roughly once per distinct pose you ever enter.

---

## Privacy

Only the **pose name** (and Sanskrit name) is sent to OpenAI. Your sequence structure, intention, notes, and cues are never transmitted.
