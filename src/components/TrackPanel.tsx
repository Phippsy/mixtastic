import { type TransitionSide, type CueEntry } from '../types';
import { CueList } from './CueList';
import { EqControls } from './EqControls';

interface TransitionSidePanelProps {
  side: TransitionSide;
  onChange: (side: TransitionSide) => void;
}

export function TransitionSidePanel({ side, onChange }: TransitionSidePanelProps) {
  function patch(updates: Partial<TransitionSide>) {
    onChange({ ...side, ...updates });
  }

  return (
    <div className="transition-side-row">
      <CueList
        cues={side.cues}
        onChange={(cues: CueEntry[]) => patch({ cues })}
      />
      <EqControls
        low={side.low}
        mid={side.mid}
        high={side.high}
        onChangeLow={(low: number | null) => patch({ low })}
        onChangeMid={(mid: number | null) => patch({ mid })}
        onChangeHigh={(high: number | null) => patch({ high })}
      />
      <input
        className="transition-notes"
        type="text"
        placeholder="Notes"
        value={side.notes}
        onChange={e => patch({ notes: e.target.value })}
      />
    </div>
  );
}
