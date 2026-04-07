import {
  type CueEntry,
  type CueColor,
  CUE_COLOR_VALUES,
  CUE_COLORS,
  createEmptyCue,
  generateId,
} from '../types';

interface CueListProps {
  mode: 'edit' | 'mix';
  cues: CueEntry[];
  onChange: (cues: CueEntry[]) => void;
}

export function CueList({ mode, cues, onChange }: CueListProps) {
  function updateCue(id: string, patch: Partial<CueEntry>) {
    onChange(cues.map(c => c.id === id ? { ...c, ...patch } : c));
  }

  function removeCue(id: string) {
    onChange(cues.filter(c => c.id !== id));
  }

  function addCue() {
    onChange([...cues, { ...createEmptyCue(), id: generateId() }]);
  }

  function handleNumberInput(id: string, val: string) {
    if (val === '') {
      updateCue(id, { number: null });
      return;
    }
    const n = parseInt(val, 10);
    if (!isNaN(n) && n >= 1 && n <= 8) {
      updateCue(id, { number: n });
    }
  }

  if (mode === 'mix') {
    return (
      <div className="cue-list cue-list-mix">
        {cues.map(cue => (
          <span
            key={cue.id}
            className="cue-badge cue-badge-static"
            style={{ background: CUE_COLOR_VALUES[cue.color] }}
            title={`Cue ${cue.number ?? ''}`.trim()}
          >
            <span className="cue-number-static">{cue.number ?? '·'}</span>
            <span className="cue-color-static">{cue.color[0].toUpperCase()}</span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="cue-list">
      {cues.map(cue => (
        <span
          key={cue.id}
          className="cue-badge"
          style={{ background: CUE_COLOR_VALUES[cue.color] }}
        >
          <input
            className="cue-number-input"
            type="text"
            inputMode="numeric"
            value={cue.number ?? ''}
            placeholder="#"
            onChange={e => handleNumberInput(cue.id, e.target.value)}
            onFocus={e => e.target.select()}
            title="Cue number (1-8)"
          />
          <select
            className="cue-color-select"
            value={cue.color}
            onChange={e => updateCue(cue.id, { color: e.target.value as CueColor })}
            title="Cue colour"
          >
            {CUE_COLORS.map(c => (
              <option key={c} value={c}>{c[0].toUpperCase()}</option>
            ))}
          </select>
          <button
            className="cue-remove-btn"
            onClick={() => removeCue(cue.id)}
            title="Remove"
          >×</button>
        </span>
      ))}
      <button className="cue-add-btn" onClick={addCue} title="Add cue">+</button>
    </div>
  );
}
