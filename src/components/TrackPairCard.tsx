import {
  type TrackPair,
  type Transition,
  createEmptyTransition,
} from '../types';
import { TransitionRow } from './TransitionRow';

interface TrackPairCardProps {
  pair: TrackPair;
  index: number;
  onChange: (pair: TrackPair) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onComplete: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export function TrackPairCard({
  pair,
  index,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  onComplete,
  isFirst,
  isLast,
}: TrackPairCardProps) {
  function patch(updates: Partial<TrackPair>) {
    onChange({ ...pair, ...updates });
  }

  function updateTransition(tIdx: number, updated: Transition) {
    const transitions = pair.transitions.map((t, i) => i === tIdx ? updated : t);
    patch({ transitions });
  }

  function removeTransition(tIdx: number) {
    const transitions = pair.transitions.filter((_, i) => i !== tIdx);
    patch({ transitions: transitions.length === 0 ? [createEmptyTransition()] : transitions });
  }

  function addTransition() {
    patch({ transitions: [...pair.transitions, createEmptyTransition()] });
  }

  function toggleComplete() {
    onComplete();
  }

  const outTrack = pair.reversed ? 'rightTrack' : 'leftTrack';
  const inTrack = pair.reversed ? 'leftTrack' : 'rightTrack';

  const outBlock = (
    <div className="pair-track-block pair-track-block-out">
      <span className="pair-track-tag pair-track-tag-out">OUT</span>
      <input
        className="pair-track-input"
        type="text"
        placeholder="Outgoing track"
        value={pair[outTrack]}
        onClick={e => e.stopPropagation()}
        onChange={e => patch({ [outTrack]: e.target.value })}
      />
    </div>
  );

  const inBlock = (
    <div className="pair-track-block pair-track-block-in">
      <span className="pair-track-tag pair-track-tag-in">IN</span>
      <input
        className="pair-track-input"
        type="text"
        placeholder="Incoming track"
        value={pair[inTrack]}
        onClick={e => e.stopPropagation()}
        onChange={e => patch({ [inTrack]: e.target.value })}
      />
    </div>
  );

  return (
    <div className={`track-pair-card${pair.completed ? ' track-pair-completed' : ''}`}>
      <div className="track-pair-header" onClick={() => patch({ expanded: !pair.expanded })}>
        <button className="expand-toggle" title={pair.expanded ? 'Collapse' : 'Expand'}>
          {pair.expanded ? '▾' : '▸'}
        </button>
        <span className="pair-number">#{index + 1}</span>
        <div className="pair-track-names">
          {pair.reversed ? (
            <>{inBlock}<span className="pair-arrow">◀◀</span>{outBlock}</>
          ) : (
            <>{outBlock}<span className="pair-arrow">▶▶</span>{inBlock}</>
          )}
        </div>
        <span className="pair-transition-count">{pair.transitions.length} cue{pair.transitions.length !== 1 ? 's' : ''}</span>
        <div className="pair-actions" onClick={e => e.stopPropagation()}>
          <button
            className={pair.completed ? 'btn-complete-done' : 'btn-complete'}
            onClick={toggleComplete}
            title={pair.completed ? 'Mark incomplete' : 'Mark as done'}
          >
            {pair.completed ? '✓ Done' : '✓'}
          </button>
          <button onClick={onMoveUp} disabled={isFirst} title="Move up">↑</button>
          <button onClick={onMoveDown} disabled={isLast} title="Move down">↓</button>
          <button onClick={onRemove} className="btn-danger" title="Remove pair">×</button>
        </div>
      </div>
      {pair.expanded && (
        <div className="track-pair-body">
          <div className="transitions-col-headers">
            <div className="tcol-half">
              <span className="tcol-h tcol-h-idx" />
              <span className="tcol-h tcol-h-cue">Cue</span>
              <span className="tcol-h tcol-h-eq">L</span>
              <span className="tcol-h tcol-h-eq">M</span>
              <span className="tcol-h tcol-h-eq">H</span>
              <span className="tcol-h tcol-h-notes">Notes</span>
            </div>
            <div className="tcol-div" />
            <div className="tcol-half">
              <span className="tcol-h tcol-h-cue">Cue</span>
              <span className="tcol-h tcol-h-eq">L</span>
              <span className="tcol-h tcol-h-eq">M</span>
              <span className="tcol-h tcol-h-eq">H</span>
              <span className="tcol-h tcol-h-notes">Notes</span>
            </div>
          </div>
          {pair.transitions.map((t, tIdx) => (
            <TransitionRow
              key={t.id}
              transition={t}
              index={tIdx}
              onChange={updated => updateTransition(tIdx, updated)}
              onRemove={() => removeTransition(tIdx)}
            />
          ))}
          <button className="add-transition-inline" onClick={addTransition}>
            + Add cue point
          </button>
        </div>
      )}
    </div>
  );
}
