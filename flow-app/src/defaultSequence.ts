/* ──────────────────────────────────────────────────────────────
 * Sequences — Sample Sequence
 *
 * Seeds first-time users with "Way of the Scatty Warrior", a real
 * Vinyasa flow, so they can immediately see how the app models a
 * practice (sections, poses, sides, breath, holds, cues, repeats).
 * ────────────────────────────────────────────────────────────── */

import {
  type Cue,
  type CueType,
  type Phase,
  type Pose,
  type Section,
  type Sequence,
  type Side,
  generateId,
} from './types';

function cue(type: CueType, text: string): Cue {
  return { id: generateId(), type, text };
}

function pose(
  name: string,
  opts: {
    sanskrit?: string;
    side?: Side;
    holdBreaths?: number | null;
    isKeyPose?: boolean;
    cues?: Cue[];
  } = {},
): Pose {
  return {
    id: generateId(),
    name,
    sanskritName: opts.sanskrit,
    side: opts.side ?? 'both',
    breath: null,
    holdBreaths: opts.holdBreaths ?? null,
    durationSeconds: null,
    cues: opts.cues ?? [],
    isKeyPose: opts.isKeyPose ?? false,
    completed: false,
  };
}

function section(name: string, phase: Phase, poses: Pose[], opts: { repeats?: number; notes?: string; durationMinutes?: number } = {}): Section {
  return {
    id: generateId(),
    name,
    phase,
    poses,
    repeats: opts.repeats ?? 1,
    notes: opts.notes ?? '',
    durationMinutes: opts.durationMinutes ?? null,
    expanded: false,
    completed: false,
  };
}

export function createSampleSequence(): Sequence {
  const now = new Date().toISOString();

  const sections: Section[] = [
    section('Breathing / Intention', 'centering', [
      pose('Easy Pose', {
        sanskrit: 'Sukhasana',
        holdBreaths: 10,
        cues: [
          cue('verbal', 'Love practice, fuse with the music.'),
          cue('verbal', 'Laugh at your self-involvement / seriousness.'),
        ],
      }),
    ], { durationMinutes: 3 }),

    section('Spinal Twists', 'warm-up', [
      pose('Crossed-Leg Side Stretch', { side: 'both', holdBreaths: 5 }),
      pose('Seated Spinal Twist', {
        sanskrit: 'Ardha Matsyendrasana',
        side: 'both',
        holdBreaths: 5,
        cues: [cue('alignment', 'Straight leg, one bent. Twist to back of mat.')],
      }),
    ], { durationMinutes: 5 }),

    section('Floor and Core', 'warm-up', [
      pose('Cat-Cow', { sanskrit: 'Marjaryasana-Bitilasana', cues: [cue('verbal', 'Standard, then wobbly freestyle mode.')] }),
      pose('Thread the Needle', { sanskrit: 'Parsva Balasana', side: 'both', holdBreaths: 5 }),
      pose('Sphinx Pose', { sanskrit: 'Salamba Bhujangasana', holdBreaths: 5 }),
      pose('High Plank', { sanskrit: 'Phalakasana', holdBreaths: 8, cues: [cue('alignment', '5 to 10 breaths.')] }),
      pose('Side Plank', { sanskrit: 'Vasisthasana', side: 'both', holdBreaths: 5 }),
      pose('Half Boat', {
        sanskrit: 'Ardha Navasana',
        holdBreaths: 4,
        cues: [cue('verbal', 'Boat → Half Boat, up and down. Hover for 4 breaths, then back up. x4.')],
      }),
    ], { notes: 'Big jump from warm-ups to plank, ease in.', durationMinutes: 8 }),

    section('Sun Salutation A', 'sun-salutes', [
      pose('Mountain Pose', { sanskrit: 'Tadasana' }),
      pose('Upward Salute', { sanskrit: 'Urdhva Hastasana' }),
      pose('Standing Forward Fold', { sanskrit: 'Uttanasana' }),
      pose('Halfway Lift', { sanskrit: 'Ardha Uttanasana' }),
      pose('Low Plank', { sanskrit: 'Chaturanga Dandasana' }),
      pose('Upward-Facing Dog', { sanskrit: 'Urdhva Mukha Svanasana' }),
      pose('Downward-Facing Dog', { sanskrit: 'Adho Mukha Svanasana', holdBreaths: 5 }),
    ], { repeats: 3, notes: '3 to 4 rounds.', durationMinutes: 8 }),

    section('Flow Poses', 'standing', [
      pose('Three-Legged Dog', { sanskrit: 'Tri Pada Adho Mukha Svanasana', side: 'both' }),
      pose('Warrior I', { sanskrit: 'Virabhadrasana I', side: 'both' }),
      pose('Humble Warrior', { sanskrit: 'Baddha Virabhadrasana', side: 'both', holdBreaths: 3 }),
      pose('Warrior III', { sanskrit: 'Virabhadrasana III', side: 'both', holdBreaths: 3 }),
      pose('Standing Hand-to-Big-Toe', {
        sanskrit: 'Utthita Hasta Padangusthasana',
        side: 'both',
        holdBreaths: 4,
        cues: [cue('alignment', 'Foot in front, heel in hands, head to knee.')],
      }),
      pose('High Lunge', { sanskrit: 'Anjaneyasana', side: 'both' }),
      pose('Vinyasa', { cues: [cue('transition', 'Vinyasa → down dog → back to start.')] }),
    ], { repeats: 2, notes: 'From last down dog of Sun Salute A. One full cycle per side.', durationMinutes: 12 }),

    section('Standing Balances', 'standing', [
      pose('Tree Pose', { sanskrit: 'Vrksasana', side: 'both', holdBreaths: 5 }),
      pose('Revolved Triangle', { sanskrit: 'Parivrtta Trikonasana', side: 'both', holdBreaths: 5 }),
      pose('Toe-Grip Forward Fold', { side: 'both', holdBreaths: 5, cues: [cue('verbal', 'Yum!')] }),
    ], { notes: 'One per side in cycle.', durationMinutes: 6 }),

    section('Floor + Inversion', 'peak', [
      pose('Crow Pose', { sanskrit: 'Bakasana', holdBreaths: 5, isKeyPose: true }),
      pose('Headstand', { sanskrit: 'Sirsasana', holdBreaths: 5, isKeyPose: true, cues: [cue('safety', '>= 5 breaths in each pose. Crow to headstand x2.')] }),
      pose('Vinyasa', { cues: [cue('transition', 'Last round only: jump back chaturanga → vinyasa → down dog → jump through to seated.')] }),
    ], { repeats: 2, durationMinutes: 8 }),

    section('Finishing Poses', 'cool-down', [
      pose('Bridge Pose', { sanskrit: 'Setu Bandha Sarvangasana', holdBreaths: 5 }),
      pose('Wheel Pose', { sanskrit: 'Urdhva Dhanurasana', holdBreaths: 5, cues: [cue('safety', '1x bridge, then 1x wheel.')] }),
      pose('Happy Baby', { sanskrit: 'Ananda Balasana', holdBreaths: 8, cues: [cue('verbal', 'Happy babulous.')] }),
    ], { notes: 'A bit more stretching here is nice before closing.', durationMinutes: 6 }),

    section('Savasana', 'savasana', [
      pose('Corpse Pose', { sanskrit: 'Savasana' }),
    ], { durationMinutes: 5 }),
  ];

  return {
    id: generateId(),
    name: 'Way of the Scatty Warrior',
    style: 'vinyasa',
    intention: 'Love practice, fuse with the music, laugh at your seriousness.',
    targetDuration: 60,
    sections,
    viewMode: 'edit',
    createdAt: now,
    updatedAt: now,
  };
}
