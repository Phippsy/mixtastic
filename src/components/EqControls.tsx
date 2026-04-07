interface EqControlsProps {
  mode: 'edit' | 'mix';
  low: number | null;
  mid: number | null;
  high: number | null;
  onChangeLow: (v: number | null) => void;
  onChangeMid: (v: number | null) => void;
  onChangeHigh: (v: number | null) => void;
}

function parseEq(val: string): number | null {
  if (val === '') return null;
  const n = parseInt(val, 10);
  if (isNaN(n)) return null;
  return Math.max(0, Math.min(100, n));
}

function displayEq(val: number | null): string {
  return val === null ? '' : String(val);
}

function getEqStateClass(val: number | null): string {
  if (val === 0) return ' eq-input-cut';
  if (val === 100) return ' eq-input-full';
  if (val !== null) return ' eq-input-active';
  return '';
}

function renderEqValue(label: string, value: number | null) {
  return (
    <div className={`eq-display${getEqStateClass(value)}`} title={`${label} ${value === null ? 'unset' : `${value}%`}`}>
      {value === null ? label : value}
    </div>
  );
}

export function EqControls({ mode, low, mid, high, onChangeLow, onChangeMid, onChangeHigh }: EqControlsProps) {
  if (mode === 'mix') {
    return (
      <div className="eq-controls eq-controls-mix">
        {renderEqValue('L', low)}
        {renderEqValue('M', mid)}
        {renderEqValue('H', high)}
      </div>
    );
  }

  return (
    <div className="eq-controls">
      <input
        className={`eq-input${getEqStateClass(low)}`}
        type="number"
        min={0}
        max={100}
        value={displayEq(low)}
        onChange={e => onChangeLow(parseEq(e.target.value))}
        placeholder="L"
      />
      <input
        className={`eq-input${getEqStateClass(mid)}`}
        type="number"
        min={0}
        max={100}
        value={displayEq(mid)}
        onChange={e => onChangeMid(parseEq(e.target.value))}
        placeholder="M"
      />
      <input
        className={`eq-input${getEqStateClass(high)}`}
        type="number"
        min={0}
        max={100}
        value={displayEq(high)}
        onChange={e => onChangeHigh(parseEq(e.target.value))}
        placeholder="H"
      />
    </div>
  );
}
