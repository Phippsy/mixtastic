interface EqControlsProps {
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

export function EqControls({ low, mid, high, onChangeLow, onChangeMid, onChangeHigh }: EqControlsProps) {
  return (
    <div className="eq-controls">
      <input
        className="eq-input"
        type="number"
        min={0}
        max={100}
        value={displayEq(low)}
        onChange={e => onChangeLow(parseEq(e.target.value))}
        placeholder="L"
      />
      <input
        className="eq-input"
        type="number"
        min={0}
        max={100}
        value={displayEq(mid)}
        onChange={e => onChangeMid(parseEq(e.target.value))}
        placeholder="M"
      />
      <input
        className="eq-input"
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
