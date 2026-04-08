import {
  type NoteColor,
  type MixSet,
  type TrackPair,
  type Transition,
  type TransitionSide,
  type CueEntry,
  type CueColor,
  generateId,
} from './types';

function cue(num: number, color: CueColor): CueEntry {
  return { id: generateId(), number: num, color };
}

function side(
  cues: CueEntry[],
  eq: { low?: number; mid?: number; high?: number } = {},
  notes = '',
  noteColor: NoteColor = 'black',
  kill = false,
): TransitionSide {
  return {
    id: generateId(),
    cues,
    low: eq.low ?? null,
    mid: eq.mid ?? null,
    high: eq.high ?? null,
    notes: {
      text: notes,
      color: noteColor,
    },
    kill,
  };
}

function tx(left: TransitionSide, right: TransitionSide): Transition {
  return { id: generateId(), left, right };
}

function pair(
  leftTrack: string,
  rightTrack: string,
  reversed: boolean,
  transitions: Transition[],
): TrackPair {
  return {
    id: generateId(),
    leftTrack,
    rightTrack,
    reversed,
    expanded: false,
    completed: false,
    transitions,
  };
}

/**
 * Sample set transcribed from handwritten Notability notes (sample_set/ screenshots).
 * Track names are best-effort readings of the handwriting — some may need correction.
 */
export function createDanfestSet(): MixSet {
  const now = new Date().toISOString();

  const pairs: TrackPair[] = [
    // ── Page 1 ──

    // Pair 1 (A=OUT, B=IN)
    pair('Yourself', 'Wade In The Water', false, [
      tx(
        side([cue(8, 'orange'), cue(7, 'blue'), cue(6, 'blue')], { high: 0 }, '', 'black', true),
        side([cue(2, 'orange')]),
      ),
    ]),

    // Pair 2 (B=OUT, A=IN)
    pair('Lovely Day', 'Wade In The Water', true, [
      tx(
        side([cue(2, 'orange')]),
        side([cue(8, 'green'), cue(5, 'blue')], { high: 0 }, '', 'black', true),
      ),
    ]),

    // Pair 3 (A=OUT, B=IN)
    pair('Lovely Day', 'Spacey', false, [
      tx(
        side([cue(8, 'green')], { low: 0, mid: 0 }, '', 'black', true),
        side([cue(2, 'orange'), cue(4, 'blue')]),
      ),
    ]),

    // Pair 4 (B=OUT, A=IN)
    pair('Preach', 'Spacey', true, [
      tx(
        side([cue(2, 'orange')]),
        side([cue(8, 'orange')], {}, 'Loop on - lift it #7. Filter bounce out'),
      ),
    ]),

    // Pair 5 (A=OUT, B=IN)
    pair('Preach', 'Move Your Body', false, [
      tx(
        side([cue(8, 'orange'), cue(7, 'blue')], {}, '', 'black', true),
        side([cue(2, 'orange')], { low: 0 }, 'Loop on. Unloop'),
      ),
    ]),

    // Pair 6 (B=OUT, A=IN)
    pair('Love Is A Song', 'Move Your Body', true, [
      tx(
        side([cue(2, 'orange')]),
        side(
          [cue(8, 'orange'), cue(7, 'blue'), cue(6, 'blue')],
          { low: 0, high: 0 },
          'See Phoverc. Awesome',
        ),
      ),
    ]),

    // ── Page 2 ──

    // Pair 7 (A=OUT, B=IN)
    pair('Love Is A Song', 'Bombs', false, [
      tx(
        side([cue(8, 'orange'), cue(7, 'blue'), cue(6, 'blue')], { low: 0 }, '', 'black', true),
        side([cue(2, 'orange')]),
      ),
    ]),

    // Pair 8 (B=OUT, A=IN)
    pair('Power', 'Bombs', true, [
      tx(
        side([cue(2, 'orange')], {}, 'Fast fade in. Master'),
        side([cue(8, 'green'), cue(5, 'blue'), cue(6, 'blue')], { high: 0 }, '', 'black', true),
      ),
    ]),

    // Pair 9 (A=OUT, B=IN)
    pair('Power', 'Hideaway', false, [
      tx(
        side([cue(8, 'orange')], { low: 0, mid: 0 }, 'Filter K out', 'black', true),
        side([cue(2, 'orange'), cue(3, 'blue')]),
      ),
    ]),

    // Pair 10 (B=OUT, A=IN)
    pair('Hey Now', 'Hideaway', true, [
      tx(
        side([cue(2, 'orange')], {}, 'Loop in. Unloop'),
        side([cue(8, 'orange'), cue(6, 'blue')], { high: 0 }, 'DLDB out?'),
      ),
    ]),

    // ── Page 3 ──

    // Pair 11 (A=OUT, B=IN)
    pair('Hey Now', 'Hey Boy', false, [
      tx(
        side([cue(8, 'orange')], {}, 'Dial out'),
        side([cue(2, 'orange')]),
      ),
    ]),

    // Pair 12 (B=OUT, A=IN)
    pair('Supey', 'Hey Boy', true, [
      tx(
        side([cue(2, 'orange')], { low: 0 }),
        side([cue(8, 'orange')], {}, 'Class amor'),
      ),
    ]),
  ];

  return {
    id: 'danfest-sample',
    name: 'Danfest',
    createdAt: now,
    updatedAt: now,
    viewMode: 'edit',
    pairs,
  };
}
