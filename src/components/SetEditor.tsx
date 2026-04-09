import { useState } from 'react';
import { type MixSet, type TrackPair, createEmptyTrackPair } from '../types';
import { TrackPairCard } from './TrackPairCard';

/** After reorder, recalculate `reversed` so OUT/IN columns alternate. */
function normalizeReversed(pairs: TrackPair[]): TrackPair[] {
  return pairs.map((pair, i) => {
    const shouldBeReversed = i % 2 !== 0;
    if (pair.reversed === shouldBeReversed) return pair;
    return {
      ...pair,
      reversed: shouldBeReversed,
      leftTrack: pair.rightTrack,
      rightTrack: pair.leftTrack,
      transitions: pair.transitions.map(t => ({ ...t, left: t.right, right: t.left })),
    };
  });
}

interface SetEditorProps {
  set: MixSet;
  onChange: (set: MixSet) => void;
  onBack: () => void;
}

export function SetEditor({ set, onChange, onBack }: SetEditorProps) {
  const pairs = set.pairs;
  const mode = set.viewMode;
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  function touch(updated: Partial<MixSet>) {
    onChange({ ...set, ...updated, updatedAt: new Date().toISOString() });
  }

  function updatePair(index: number, updated: TrackPair) {
    touch({ pairs: pairs.map((p, i) => i === index ? updated : p) });
  }

  function completePair(index: number) {
    touch({
      pairs: pairs.map((p, i) => {
        if (i === index) {
          return { ...p, completed: !p.completed, expanded: p.completed };
        }
        if (i === index + 1 && !pairs[index].completed) {
          return { ...p, expanded: true };
        }
        return p;
      }),
    });
  }

  function removePair(index: number) {
    const next = pairs.filter((_, i) => i !== index);
    touch({ pairs: next.length === 0 ? [createEmptyTrackPair()] : next });
  }

  function addPair() {
    const last = pairs[pairs.length - 1];
    const nextReversed = last ? !last.reversed : false;
    const outgoingName = last
      ? (last.reversed ? last.leftTrack : last.rightTrack)
      : '';
    const newPair = createEmptyTrackPair(nextReversed);
    if (nextReversed) {
      newPair.rightTrack = outgoingName;
    } else {
      newPair.leftTrack = outgoingName;
    }
    touch({ pairs: [...pairs, newPair] });
  }

  function movePair(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= pairs.length) return;
    const next = [...pairs];
    [next[index], next[target]] = [next[target], next[index]];
    touch({ pairs: normalizeReversed(next) });
  }

  function clearPairs() {
    if (window.confirm('Clear all track pairs in this set? This cannot be undone.')) {
      touch({ pairs: [createEmptyTrackPair()] });
    }
  }

  function setViewMode(viewMode: 'edit' | 'mix') {
    touch({ viewMode });
  }

  const allExpanded = pairs.length > 0 && pairs.every(p => p.expanded);

  function toggleExpandAll() {
    const target = !allExpanded;
    touch({ pairs: pairs.map(p => ({ ...p, expanded: target })) });
  }

  function handleDragStart(index: number) {
    setDragIdx(index);
  }

  function handleDragOver(index: number) {
    if (dragIdx === null || index === dragIdx) return;
    setOverIdx(index);
  }

  function handleDrop(index: number) {
    if (dragIdx === null || dragIdx === index) {
      setDragIdx(null);
      setOverIdx(null);
      return;
    }
    const next = [...pairs];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(index, 0, moved);
    touch({ pairs: normalizeReversed(next) });
    setDragIdx(null);
    setOverIdx(null);
  }

  function handleDragEnd() {
    setDragIdx(null);
    setOverIdx(null);
  }

  return (
    <>
      <div className="set-editor-header">
        <button className="btn-back" onClick={onBack} title="Back to sets">← Sets</button>
        {mode === 'edit' ? (
          <input
            className="mix-name-input"
            type="text"
            placeholder="Set name..."
            value={set.name}
            onChange={e => touch({ name: e.target.value })}
          />
        ) : (
          <div className="mix-name-display">{set.name || 'Untitled set'}</div>
        )}
        <div className="editor-mode-toggle" role="tablist" aria-label="Editor mode">
          <button
            type="button"
            className={`mode-toggle-btn${mode === 'edit' ? ' mode-toggle-btn-active' : ''}`}
            onClick={() => setViewMode('edit')}
          >
            Edit
          </button>
          <button
            type="button"
            className={`mode-toggle-btn${mode === 'mix' ? ' mode-toggle-btn-active' : ''}`}
            onClick={() => setViewMode('mix')}
          >
            Mix
          </button>
        </div>
        <button
          className="btn-expand-all"
          onClick={toggleExpandAll}
          title={allExpanded ? 'Collapse all tracks' : 'Expand all tracks'}
        >
          {allExpanded ? '▲' : '▼'}
        </button>
        {mode === 'edit' && <button className="btn-secondary" onClick={clearPairs} title="Clear all pairs">Clear</button>}
      </div>

      <main className="pairs-list">
        {pairs.map((p, i) => (
          <TrackPairCard
            key={p.id}
            mode={mode}
            pair={p}
            index={i}
            onChange={updated => updatePair(i, updated)}
            onRemove={() => removePair(i)}
            onMoveUp={() => movePair(i, -1)}
            onMoveDown={() => movePair(i, 1)}
            onComplete={() => completePair(i)}
            isFirst={i === 0}
            isLast={i === pairs.length - 1}
            isDragging={dragIdx === i}
            isDragOver={overIdx === i}
            onDragStart={() => handleDragStart(i)}
            onDragOver={() => handleDragOver(i)}
            onDrop={() => handleDrop(i)}
            onDragEnd={handleDragEnd}
          />
        ))}
      </main>

      {mode === 'edit' && (
        <div className="add-pair-row">
          <button className="btn-primary" onClick={addPair}>
            + Add Track Pair
          </button>
        </div>
      )}
    </>
  );
}
