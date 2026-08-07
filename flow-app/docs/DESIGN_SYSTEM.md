# Design System

The visual language of **Sequences**: a calm, premium, mobile-first product UI for yoga practitioners. The aesthetic goal is "quiet and expensive, legible mid-practice," not flashy. This document is the contract for keeping the UI coherent as it grows.

---

## Design Read

- **Surface type:** mobile-first product UI (build + follow flows), not a landing page.
- **Audience:** yoga practitioners, often glancing at a phone mid-practice.
- **Vibe:** calm, premium, focused. Soft depth, generous spacing, restrained motion.
- **Dials (informal):** low layout variance, low/medium motion, medium density.

---

## Tokens (CSS custom properties in `src/App.css`)

All colour, radius, shadow, and easing values are tokens under `:root`. Never hardcode hex values in component styles; add or reuse a token.

### Colour

| Token | Use |
|---|---|
| `--bg`, `--bg-surface`, `--bg-card`, `--bg-hover` | Cool near-black background ramp (off-black, never pure `#000`). |
| `--border`, `--border-soft` | Hairline separators. `--border-soft` for elevated cards. |
| `--text`, `--text-muted`, `--text-dim` | Off-white text ramp (never pure `#fff`). |
| `--accent`, `--accent-strong` | The single brand accent: a calm lavender. Used consistently for primary actions, active states, focus. |
| `--accent-2` | Teal, reserved for semantic "right side" / success only. |
| `--on-accent` | Dark ink text placed on accent fills. Never hardcode the dark colour. |
| `--green`, `--red`, `--amber` | Semantic states (done, error, key/intensity). |

**One accent rule:** the lavender accent is the only decorative colour. Phase colours and cue-type colours are **functional/semantic** (they encode the class arc and cue category), which is why a richer palette is justified there and nowhere else.

### Shape (one documented radius scale)

| Token | Value | Applied to |
|---|---|---|
| `--radius-card` | 18px | Cards (sequence, section). |
| `--radius` | 12px | Medium containers. |
| `--radius-sm` | 10px | Inputs, chips, small controls. |
| `--radius-pill` | 999px | Buttons, badges, pills. |

Interactive elements (buttons, badges) are pills; containers are soft 18px squircles; inputs are 10px. Do not mix radii outside this scale.

### Elevation

Shadows are soft and tinted to the background hue (no hard black drop shadows):

- `--shadow-soft` — resting cards.
- `--shadow-pop` — hover / drag-over.

Prefer soft shadow + `--border-soft` over hard 1px grey borders for elevation.

### Motion

- `--ease` = `cubic-bezier(0.16, 1, 0.3, 1)` — the single easing curve for transitions.
- Tactile `:active { transform: scale(0.97) }` on all pressable elements.
- A gentle `rise` entry animation on cards.
- **All motion is gated behind `@media (prefers-reduced-motion: no-preference)`**, and a global `reduce` block disables animations/transitions for users who ask for it.
- Animate only `transform` and `opacity`.

---

## Typography

- **Geist Variable** (self-hosted via `@fontsource-variable/geist`) for all UI text. Bundled, so it works offline. No system-font fallback as the primary.
- **Geist Mono Variable** for all numbers and metrics (muscle scores, breath counts, intensity, section numbers, durations) via the `.mono` utility and `font-feature-settings: "tnum"` for tabular figures.
- Tight display tracking (`letter-spacing: -0.02em` to `-0.04em`) on titles; comfortable body line-height.
- No Inter / Roboto / system stack as the default.

---

## Icons

- **One family only: Phosphor** (`@phosphor-icons/react`).
- Standard sizes: 13–18px depending on context. Weight `regular` for most, `bold` for controls/affordances, `fill` for active/semantic marks (key-pose star, intensity bolt).
- **No emoji** anywhere in UI, markup, or visible text.
- **No hand-rolled SVG icon paths.** If a glyph is missing, pick another Phosphor icon.
- Every icon-only button has a `title` and `aria-label`.

---

## Accessibility

- **Contrast:** text and controls target WCAG AA. Accent fills always pair with `--on-accent` dark ink.
- **Focus:** visible `:focus-visible` ring (2px accent outline) plus an input focus glow.
- **Zoom allowed:** the viewport meta does **not** set `user-scalable=no`; pinch-zoom works.
- **Touch-first error states:** the muscle-analysis error is a tappable inline row with a Retry action, never a hover-only tooltip (phones have no hover).
- **Reduced motion:** fully honoured (see Motion).

---

## Interactive States (every control implements the full cycle)

- **Loading:** the muscle-analysis dot pulses amber while a call is in flight.
- **Ready:** the dot turns solid green; muscle tags appear under the pose.
- **Empty:** muscle charts and the sequence list show composed empty hints, not blank space.
- **Error:** inline, tappable, with Retry (touch-friendly).
- **Pressed:** tactile `scale(0.97)`.

---

## Adding UI — Checklist

Before shipping a new component or control:

- [ ] Colours come from tokens (no raw hex).
- [ ] Radius from the documented scale.
- [ ] Soft shadow over hard border for elevation.
- [ ] Icons from Phosphor only; icon-only buttons have `aria-label`.
- [ ] Numbers use the mono utility.
- [ ] No em-dash (`—`) or en-dash (`–`) in any visible string. Use `-`, comma, or restructure.
- [ ] No emoji in visible text.
- [ ] `:active` tactile feedback and `:focus-visible` ring present.
- [ ] Any motion gated behind `prefers-reduced-motion`.
- [ ] Loading / empty / error states handled; errors visible on touch.
