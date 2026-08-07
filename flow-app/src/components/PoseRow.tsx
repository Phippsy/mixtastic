import { useState } from 'react';
import {
  Lightning,
  Plus,
  Star,
  X,
  WarningCircle,
  ArrowClockwise,
  Check,
} from '@phosphor-icons/react';
import {
  BREATH_LABELS,
  CUE_TYPE_COLORS,
  CUE_TYPE_LABELS,
  type BreathPattern,
  type Cue,
  type CueType,
  type Pose,
  type Side,
  createCue,
} from '../types';
import { PoseNameInput } from './PoseNameInput';

interface PoseRowProps {
  mode: 'edit' | 'practice';
  pose: Pose;
  index: number;
  onChange: (pose: Pose) => void;
  onRemove: () => void;
  onRetry?: () => void;
}

const SIDES: Side[] = ['both', 'left', 'right'];
const SIDE_SHORT: Record<Side, string> = { both: 'Both', left: 'L', right: 'R' };
const BREATHS: BreathPattern[] = ['inhale', 'exhale', 'hold', 'flow'];
const CUE_TYPES: CueType[] = ['verbal', 'alignment', 'breath', 'transition', 'safety'];

export function PoseRow({ mode, pose, index, onChange, onRemove, onRetry }: PoseRowProps) {
  const [showCueAdd, setShowCueAdd] = useState(false);

  function patch(updates: Partial<Pose>) {
    onChange({ ...pose, ...updates });
  }

  function cycleSide() {
    const i = SIDES.indexOf(pose.side);
    patch({ side: SIDES[(i + 1) % SIDES.length] });
  }

  function setBreath(b: BreathPattern) {
    patch({ breath: pose.breath === b ? null : b });
  }

  function addCue(type: CueType) {
    patch({ cues: [...pose.cues, createCue(type, '')] });
    setShowCueAdd(false);
  }

  function updateCue(id: string, text: string) {
    patch({ cues: pose.cues.map((c) => (c.id === id ? { ...c, text } : c)) });
  }

  function removeCue(id: string) {
    patch({ cues: pose.cues.filter((c) => c.id !== id) });
  }

  const analysis = pose.analysis;

  /* ── Practice mode: read-only, tappable to mark done ── */
  if (mode === 'practice') {
    if (!pose.name.trim()) return null;
    return (
      <div
        className={`pose-row pose-row-practice${pose.completed ? ' pose-done' : ''}${pose.isKeyPose ? ' pose-key' : ''}`}
        onClick={() => patch({ completed: !pose.completed })}
      >
        <div className="pose-practice-head">
          <span className="pose-practice-check">{pose.completed ? <Check size={13} weight="bold" /> : null}</span>
          <span className="pose-practice-name">
            {pose.isKeyPose && <Star size={14} weight="fill" className="pose-key-badge" />}
            {pose.name}
            {pose.sanskritName && <span className="pose-sanskrit"> {pose.sanskritName}</span>}
          </span>
          <span className="pose-practice-meta">
            {pose.side !== 'both' && <span className="side-badge">{SIDE_SHORT[pose.side]}</span>}
            {pose.holdBreaths ? <span className="hold-badge">{pose.holdBreaths} br</span> : null}
          </span>
        </div>
        {pose.cues.length > 0 && (
          <div className="pose-practice-cues">
            {pose.cues.filter((c) => c.text.trim()).map((c) => (
              <span
                key={c.id}
                className="cue-pill"
                style={{ borderColor: CUE_TYPE_COLORS[c.type] }}
              >
                {c.text}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ── Edit mode ── */
  return (
    <div className={`pose-row pose-row-edit${pose.isKeyPose ? ' pose-key' : ''}`}>
      <div className="pose-edit-line1">
        <span className="pose-index">{index + 1}</span>
        <PoseNameInput
          value={pose.name}
          sanskritValue={pose.sanskritName}
          onCommit={(name, sanskritName) =>
            patch({ name, sanskritName: sanskritName ?? pose.sanskritName })
          }
        />
        <button className="icon-btn danger" title="Remove pose" aria-label="Remove pose" onClick={onRemove}>
          <X size={16} weight="bold" />
        </button>
      </div>

      <div className="pose-edit-line2">
        <button
          className={`chip side-chip side-${pose.side}`}
          onClick={cycleSide}
          title="Cycle side (Both / Left / Right)"
        >
          {SIDE_SHORT[pose.side]}
        </button>

        <div className="breath-group">
          {BREATHS.map((b) => (
            <button
              key={b}
              className={`chip breath-chip${pose.breath === b ? ' chip-active' : ''}`}
              onClick={() => setBreath(b)}
              title={BREATH_LABELS[b!]}
            >
              {BREATH_LABELS[b!]}
            </button>
          ))}
        </div>

        <label className="hold-input" title="Hold for N breaths (blank = flow through)">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={pose.holdBreaths ?? ''}
            placeholder="br"
            onChange={(e) =>
              patch({ holdBreaths: e.target.value === '' ? null : Math.max(0, Number(e.target.value)) })
            }
          />
        </label>

        <button
          className={`chip key-chip${pose.isKeyPose ? ' chip-active' : ''}`}
          onClick={() => patch({ isKeyPose: !pose.isKeyPose })}
          title="Mark as a key / peak pose"
          aria-label="Mark as key pose"
          aria-pressed={pose.isKeyPose}
        >
          <Star size={15} weight={pose.isKeyPose ? 'fill' : 'regular'} />
        </button>

        <AnalysisIndicator pose={pose} />
      </div>

      {/* Cues */}
      {pose.cues.length > 0 && (
        <div className="pose-cues-edit">
          {pose.cues.map((c) => (
            <CueEditor
              key={c.id}
              cue={c}
              onChange={(text) => updateCue(c.id, text)}
              onRemove={() => removeCue(c.id)}
            />
          ))}
        </div>
      )}

      <div className="pose-cue-add">
        {showCueAdd ? (
          <div className="cue-type-picker">
            {CUE_TYPES.map((t) => (
              <button
                key={t}
                className="chip cue-type-chip"
                style={{ borderColor: CUE_TYPE_COLORS[t] }}
                onClick={() => addCue(t)}
              >
                {CUE_TYPE_LABELS[t]}
              </button>
            ))}
            <button className="chip" onClick={() => setShowCueAdd(false)}>Cancel</button>
          </div>
        ) : (
          <button className="add-cue-btn" onClick={() => setShowCueAdd(true)}>
            <Plus size={13} weight="bold" /> Cue
          </button>
        )}
      </div>

      {analysis?.status === 'error' && (
        <button className="pose-analysis-error" onClick={onRetry} title={analysis.error}>
          <WarningCircle size={14} weight="fill" />
          <span className="pose-analysis-error-text">Muscle analysis failed</span>
          <span className="pose-analysis-retry">
            <ArrowClockwise size={13} weight="bold" /> Retry
          </span>
        </button>
      )}

      {analysis?.status === 'ready' && analysis.muscles.length > 0 && (
        <div className="pose-muscle-mini">
          {analysis.muscles.slice(0, 4).map((m) => (
            <span key={m.group} className="muscle-mini-tag">
              {m.group} <b>{m.engagement}</b>
            </span>
          ))}
          <span className="muscle-mini-intensity" title="Overall intensity">
            <Lightning size={13} weight="fill" /> {analysis.intensity}
          </span>
        </div>
      )}
    </div>
  );
}

function CueEditor({ cue, onChange, onRemove }: { cue: Cue; onChange: (t: string) => void; onRemove: () => void }) {
  return (
    <div className="cue-editor" style={{ borderLeftColor: CUE_TYPE_COLORS[cue.type] }}>
      <span className="cue-type-label" style={{ color: CUE_TYPE_COLORS[cue.type] }}>
        {CUE_TYPE_LABELS[cue.type]}
      </span>
      <input
        className="cue-text"
        type="text"
        value={cue.text}
        placeholder="Cue text…"
        onChange={(e) => onChange(e.target.value)}
      />
      <button className="icon-btn danger small" title="Remove cue" aria-label="Remove cue" onClick={onRemove}>
        <X size={13} weight="bold" />
      </button>
    </div>
  );
}

function AnalysisIndicator({ pose }: { pose: Pose }) {
  if (!pose.name.trim()) return null;
  const status = pose.analysis?.status ?? 'none';
  if (status === 'pending') {
    return <span className="analysis-dot analysis-pending" title="Analysing muscles…" aria-label="Analysing muscles" />;
  }
  if (status === 'ready') {
    return <span className="analysis-dot analysis-ready" title="Muscle analysis ready" aria-label="Muscle analysis ready" />;
  }
  // Errors are surfaced as a tappable inline row below (touch-friendly).
  return null;
}
