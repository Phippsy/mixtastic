import { NOTE_COLORS, type TransitionSide, type CueEntry, type NoteColor } from '../types';
import { CueList } from './CueList';
import { EqControls } from './EqControls';

interface TransitionSidePanelProps {
  mode: 'edit' | 'mix';
  side: TransitionSide;
  onChange: (side: TransitionSide) => void;
}

export function TransitionSidePanel({ mode, side, onChange }: TransitionSidePanelProps) {
  function patch(updates: Partial<TransitionSide>) {
    onChange({ ...side, ...updates });
  }

  const noteText = side.notes.text.trim();
  const hasVisibleNote = noteText.length > 0;

  function updateNoteText(value: string) {
    patch({ notes: { ...side.notes, text: value } });
  }

  function updateNoteColor(color: NoteColor) {
    patch({ notes: { ...side.notes, color } });
  }

  return (
    <div className="transition-side-panel">
      <div className="transition-side-row">
        <CueList
          mode={mode}
          cues={side.cues}
          onChange={(cues: CueEntry[]) => patch({ cues })}
        />
        <EqControls
          mode={mode}
          low={side.low}
          mid={side.mid}
          high={side.high}
          onChangeLow={(low: number | null) => patch({ low })}
          onChangeMid={(mid: number | null) => patch({ mid })}
          onChangeHigh={(high: number | null) => patch({ high })}
        />
        {mode === 'edit' ? (
          <div className="transition-notes-edit-wrap">
            <div className="transition-notes-controls">
              <input
                className="transition-notes"
                type="text"
                placeholder="Notes"
                value={side.notes.text}
                onChange={e => updateNoteText(e.target.value)}
              />
              <div className="note-color-picker" aria-label="Note colour">
                {NOTE_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    className={`note-color-btn note-color-btn-${color}${side.notes.color === color ? ' note-color-btn-active' : ''}`}
                    title={`Use ${color} note text`}
                    onClick={() => updateNoteColor(color)}
                  >
                    {color === 'black' ? 'Bk' : color[0].toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            {hasVisibleNote && (
              <div className={`transition-note-pill transition-note-pill-${side.notes.color}`}>
                {side.notes.text}
              </div>
            )}
          </div>
        ) : (
          hasVisibleNote ? (
            <div className={`transition-note-pill transition-note-pill-${side.notes.color}`}>
              {side.notes.text}
            </div>
          ) : null
        )}
      </div>
      {(mode === 'edit' || (mode === 'mix' && side.kill)) && (
        <button
          className={`kill-toggle kill-toggle-bar${side.kill ? ' kill-toggle-active' : ''}`}
          type="button"
          title={side.kill ? 'Kill enabled' : 'Toggle kill'}
          onClick={() => patch({ kill: !side.kill })}
          disabled={mode === 'mix'}
        >
          KILL
        </button>
      )}
    </div>
  );
}
