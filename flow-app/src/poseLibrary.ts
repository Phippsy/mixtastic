/* ──────────────────────────────────────────────────────────────
 * Sequences — Pose Library & Fuzzy Search
 *
 * A lightweight, curated list of common poses used for autocomplete
 * suggestions. This is ONLY a convenience — the practitioner can always
 * type any name freely. The app never auto-builds sequences; it only
 * suggests names as you type.
 *
 * Fuzzy matching is implemented locally (no dependencies) using a
 * subsequence + proximity scoring algorithm.
 * ────────────────────────────────────────────────────────────── */

export interface PoseSuggestion {
  name: string;
  sanskritName?: string;
}

/**
 * Curated pose list (English name + Sanskrit where applicable).
 * Drawn from common Vinyasa/Hatha vocabulary and the practitioner's own
 * flow notes. Extend freely.
 */
export const POSE_LIBRARY: PoseSuggestion[] = [
  // Centering / seated
  { name: 'Easy Pose', sanskritName: 'Sukhasana' },
  { name: 'Hero Pose', sanskritName: 'Virasana' },
  { name: 'Seated Meditation', sanskritName: 'Dhyana' },
  { name: 'Thunderbolt Pose', sanskritName: 'Vajrasana' },

  // Warm-up / spine
  { name: 'Cat-Cow', sanskritName: 'Marjaryasana-Bitilasana' },
  { name: 'Child\u2019s Pose', sanskritName: 'Balasana' },
  { name: 'Thread the Needle', sanskritName: 'Parsva Balasana' },
  { name: 'Seated Spinal Twist', sanskritName: 'Ardha Matsyendrasana' },
  { name: 'Crossed-Leg Side Stretch' },
  { name: 'Sphinx Pose', sanskritName: 'Salamba Bhujangasana' },
  { name: 'Downward-Facing Dog', sanskritName: 'Adho Mukha Svanasana' },
  { name: 'Ragdoll Forward Fold', sanskritName: 'Uttanasana' },
  { name: 'Standing Forward Fold', sanskritName: 'Uttanasana' },
  { name: 'Halfway Lift', sanskritName: 'Ardha Uttanasana' },

  // Sun salutations / vinyasa
  { name: 'Mountain Pose', sanskritName: 'Tadasana' },
  { name: 'Upward Salute', sanskritName: 'Urdhva Hastasana' },
  { name: 'High Plank', sanskritName: 'Phalakasana' },
  { name: 'Low Plank', sanskritName: 'Chaturanga Dandasana' },
  { name: 'Upward-Facing Dog', sanskritName: 'Urdhva Mukha Svanasana' },
  { name: 'Cobra Pose', sanskritName: 'Bhujangasana' },
  { name: 'Vinyasa' },
  { name: 'High Lunge', sanskritName: 'Anjaneyasana' },
  { name: 'Low Lunge', sanskritName: 'Anjaneyasana' },

  // Standing / warriors
  { name: 'Warrior I', sanskritName: 'Virabhadrasana I' },
  { name: 'Warrior II', sanskritName: 'Virabhadrasana II' },
  { name: 'Warrior III', sanskritName: 'Virabhadrasana III' },
  { name: 'Humble Warrior', sanskritName: 'Baddha Virabhadrasana' },
  { name: 'Reverse Warrior', sanskritName: 'Viparita Virabhadrasana' },
  { name: 'Extended Side Angle', sanskritName: 'Utthita Parsvakonasana' },
  { name: 'Triangle Pose', sanskritName: 'Trikonasana' },
  { name: 'Revolved Triangle', sanskritName: 'Parivrtta Trikonasana' },
  { name: 'Wide-Legged Forward Fold', sanskritName: 'Prasarita Padottanasana' },
  { name: 'Goddess Pose', sanskritName: 'Utkata Konasana' },
  { name: 'Chair Pose', sanskritName: 'Utkatasana' },
  { name: 'Five-Pointed Star', sanskritName: 'Utthita Tadasana' },
  { name: 'Twisted Crescent Lunge', sanskritName: 'Parivrtta Anjaneyasana' },
  { name: 'Pyramid Pose', sanskritName: 'Parsvottanasana' },

  // Balances
  { name: 'Tree Pose', sanskritName: 'Vrksasana' },
  { name: 'Eagle Pose', sanskritName: 'Garudasana' },
  { name: 'Dancer\u2019s Pose', sanskritName: 'Natarajasana' },
  { name: 'Standing Hand-to-Big-Toe', sanskritName: 'Utthita Hasta Padangusthasana' },
  { name: 'Standing Split', sanskritName: 'Urdhva Prasarita Eka Padasana' },
  { name: 'Toe Stand', sanskritName: 'Padangustasana' },
  { name: 'Half Moon', sanskritName: 'Ardha Chandrasana' },

  // Core
  { name: 'Boat Pose', sanskritName: 'Navasana' },
  { name: 'Half Boat', sanskritName: 'Ardha Navasana' },
  { name: 'Side Plank', sanskritName: 'Vasisthasana' },
  { name: 'Forearm Plank', sanskritName: 'Phalakasana' },
  { name: 'Locust Pose', sanskritName: 'Salabhasana' },

  // Arm balances / inversions
  { name: 'Crow Pose', sanskritName: 'Bakasana' },
  { name: 'Side Crow', sanskritName: 'Parsva Bakasana' },
  { name: 'Headstand', sanskritName: 'Sirsasana' },
  { name: 'Forearm Stand', sanskritName: 'Pincha Mayurasana' },
  { name: 'Handstand', sanskritName: 'Adho Mukha Vrksasana' },
  { name: 'Shoulderstand', sanskritName: 'Salamba Sarvangasana' },
  { name: 'Legs Up the Wall', sanskritName: 'Viparita Karani' },

  // Hip openers
  { name: 'Pigeon Pose', sanskritName: 'Eka Pada Rajakapotasana' },
  { name: 'Lizard Pose', sanskritName: 'Utthan Pristhasana' },
  { name: 'Frog Pose', sanskritName: 'Bhekasana' },
  { name: 'Bound Angle Pose', sanskritName: 'Baddha Konasana' },
  { name: 'Garland Pose', sanskritName: 'Malasana' },
  { name: 'Sleeping Swan' },

  // Backbends
  { name: 'Bridge Pose', sanskritName: 'Setu Bandha Sarvangasana' },
  { name: 'Wheel Pose', sanskritName: 'Urdhva Dhanurasana' },
  { name: 'Camel Pose', sanskritName: 'Ustrasana' },
  { name: 'Bow Pose', sanskritName: 'Dhanurasana' },
  { name: 'Fish Pose', sanskritName: 'Matsyasana' },

  // Seated / floor / cool-down
  { name: 'Seated Forward Fold', sanskritName: 'Paschimottanasana' },
  { name: 'Head-to-Knee Pose', sanskritName: 'Janu Sirsasana' },
  { name: 'Reclined Bound Angle', sanskritName: 'Supta Baddha Konasana' },
  { name: 'Reclined Twist', sanskritName: 'Supta Matsyendrasana' },
  { name: 'Happy Baby', sanskritName: 'Ananda Balasana' },
  { name: 'Supine Hero', sanskritName: 'Supta Virasana' },

  // Close
  { name: 'Corpse Pose', sanskritName: 'Savasana' },
];

/* ── Fuzzy search ── */

/**
 * Score how well `query` fuzzy-matches `target`.
 * Higher is better. Returns -1 if not a subsequence match.
 *
 * Scoring rewards: exact prefix, contiguous runs, word-boundary starts,
 * and earlier matches.
 */
function fuzzyScore(query: string, target: string): number {
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase();
  if (q.length === 0) return 0;

  // Strong boosts for direct containment.
  if (t === q) return 1000;
  if (t.startsWith(q)) return 800 - t.length;
  const containIdx = t.indexOf(q);
  if (containIdx >= 0) {
    // Boost if the match starts at a word boundary.
    const boundary = containIdx === 0 || t[containIdx - 1] === ' ';
    return (boundary ? 600 : 400) - containIdx - t.length * 0.1;
  }

  // Subsequence match with proximity scoring.
  let score = 0;
  let ti = 0;
  let lastMatch = -1;
  let run = 0;
  for (let qi = 0; qi < q.length; qi++) {
    const ch = q[qi];
    let found = -1;
    for (let k = ti; k < t.length; k++) {
      if (t[k] === ch) {
        found = k;
        break;
      }
    }
    if (found === -1) return -1; // not a subsequence
    if (found === lastMatch + 1) {
      run += 1;
      score += 5 + run * 2; // reward contiguous runs
    } else {
      run = 0;
      score += 1;
    }
    if (found === 0 || t[found - 1] === ' ') score += 8; // word-boundary bonus
    lastMatch = found;
    ti = found + 1;
  }
  score -= t.length * 0.05; // mild penalty for very long targets
  return score;
}

export interface ScoredSuggestion extends PoseSuggestion {
  score: number;
}

/**
 * Return the best fuzzy matches for `query` from the library,
 * searching both English and Sanskrit names.
 */
export function searchPoses(query: string, limit = 6): PoseSuggestion[] {
  const q = query.trim();
  if (q.length === 0) return [];

  const scored: ScoredSuggestion[] = [];
  for (const pose of POSE_LIBRARY) {
    const enScore = fuzzyScore(q, pose.name);
    const skScore = pose.sanskritName ? fuzzyScore(q, pose.sanskritName) : -1;
    const best = Math.max(enScore, skScore);
    if (best >= 0) scored.push({ ...pose, score: best });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(({ name, sanskritName }) => ({ name, sanskritName }));
}

/** Find an exact (case-insensitive) library entry for a typed name. */
export function lookupPose(name: string): PoseSuggestion | undefined {
  const n = name.trim().toLowerCase();
  return POSE_LIBRARY.find(
    (p) => p.name.toLowerCase() === n || p.sanskritName?.toLowerCase() === n,
  );
}
