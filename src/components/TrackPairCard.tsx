import {
  type TrackPair,
  type Transition,
  createEmptyTransition,
} from '../types';
import { TransitionRow } from './TransitionRow';

interface TrackPairCardProps {
  mode: 'edit' | 'mix';
  pair: TrackPair;
  index: number;
  onChange: (pair: TrackPair) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onComplete: () => void;
  isFirst: boolean;
  isLast: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  onDragStart: () => void;
  onDragOver: () => void;
  onDrop: () => void;
  onDragEnd: () => void;
}

export function TrackPairCard({
  mode,
  pair,
  index,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  onComplete,
  isFirst,
  isLast,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
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
      {mode === 'edit' ? (
        <input
          className="pair-track-input"
          type="text"
          placeholder="Outgoing track"
          value={pair[outTrack]}
          onClick={e => e.stopPropagation()}
          onChange={e => patch({ [outTrack]: e.target.value })}
        />
      ) : (
        <div className="pair-track-display">{pair[outTrack] || 'Outgoing track'}</div>
      )}
    </div>
  );

  const inBlock = (
    <div className="pair-track-block pair-track-block-in">
      <span className="pair-track-tag pair-track-tag-in">IN</span>
      {mode === 'edit' ? (
        <input
          className="pair-track-input"
          type="text"
          placeholder="Incoming track"
          value={pair[inTrack]}
          onClick={e => e.stopPropagation()}
          onChange={e => patch({ [inTrack]: e.target.value })}
        />
      ) : (
        <div className="pair-track-display">{pair[inTrack] || 'Incoming track'}</div>
      )}
    </div>
  );

  return (
    <div
      className={`track-pair-card${pair.completed ? ' track-pair-completed' : ''}${isDragging ? ' track-pair-dragging' : ''}${isDragOver ? ' track-pair-dragover' : ''}`}
      onDragOver={e => { e.preventDefault(); onDragOver(); }}
      onDrop={e => { e.preventDefault(); onDrop(); }}
    >
      <div className="track-pair-header" onClick={() => patch({ expanded: !pair.expanded })}>
        {mode === 'edit' && (
          <span
            className="drag-handle"
            draggable
            onDragStart={e => { e.stopPropagation(); onDragStart(); }}
            onDragEnd={onDragEnd}
            onClick={e => e.stopPropagation()}
            title="Drag to reorder"
          >
            ⋮⋮
          </span>
        )}
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
          {mode === 'edit' && <button onClick={onMoveUp} disabled={isFirst} title="Move up">↑</button>}
          {mode === 'edit' && <button onClick={onMoveDown} disabled={isLast} title="Move down">↓</button>}
          {mode === 'edit' && <button onClick={onRemove} className="btn-danger" title="Remove pair">×</button>}
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
              mode={mode}
              transition={t}
              index={tIdx}
              onChange={updated => updateTransition(tIdx, updated)}
              onRemove={() => removeTransition(tIdx)}
            />
          ))}
          {mode === 'edit' && (
            <button className="add-transition-inline" onClick={addTransition}>
              + Add cue point
            </button>
          )}
        </div>
      )}
    </div>
  );
}
