import { useRef } from 'react';
import { CopySimple, Plus, Trash } from '@phosphor-icons/react';
import { STYLE_LABELS, type Sequence, createSequence } from '../types';
import { downloadExport, parseImport } from '../storage';

interface SequenceListProps {
  sequences: Sequence[];
  onSequencesChange: (sequences: Sequence[]) => void;
  onOpen: (id: string) => void;
}

export function SequenceList({ sequences, onSequencesChange, onOpen }: SequenceListProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function createNew() {
    const seq = createSequence();
    onSequencesChange([seq, ...sequences]);
    onOpen(seq.id);
  }

  function duplicate(id: string) {
    const seq = sequences.find((s) => s.id === id);
    if (!seq) return;
    const now = new Date().toISOString();
    const copy: Sequence = {
      ...JSON.parse(JSON.stringify(seq)),
      id: `copy-${Date.now()}`,
      name: `${seq.name || 'Untitled'} (copy)`,
      createdAt: now,
      updatedAt: now,
    };
    const idx = sequences.findIndex((s) => s.id === id);
    const next = [...sequences];
    next.splice(idx + 1, 0, copy);
    onSequencesChange(next);
  }

  function remove(id: string) {
    const seq = sequences.find((s) => s.id === id);
    if (!seq) return;
    if (!window.confirm(`Delete “${seq.name || 'Untitled'}”? This cannot be undone.`)) return;
    onSequencesChange(sequences.filter((s) => s.id !== id));
  }

  function handleImport() {
    fileInputRef.current?.click();
  }

  function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = parseImport(reader.result as string);
        const existingIds = new Set(sequences.map((s) => s.id));
        const newOnes = imported.filter((s) => !existingIds.has(s.id));
        onSequencesChange([...newOnes, ...sequences]);
        alert(`Imported ${newOnes.length} sequence(s).`);
      } catch (err) {
        alert(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  }

  function formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return '';
    }
  }

  function summary(seq: Sequence): string {
    const total = seq.sections.length;
    const done = seq.sections.filter((s) => s.completed).length;
    const poses = seq.sections.reduce((n, s) => n + s.poses.filter((p) => p.name.trim()).length, 0);
    const base = `${total} section${total !== 1 ? 's' : ''} · ${poses} pose${poses !== 1 ? 's' : ''}`;
    return done > 0 ? `${base} · ${done}/${total} done` : base;
  }

  return (
    <div className="sequence-list">
      <header className="list-header">
        <h1 className="app-title">Sequences</h1>
        <p className="app-subtitle">Design &amp; follow your yoga flows</p>
      </header>

      <div className="list-actions">
        <button className="btn-primary" onClick={createNew}>
          <Plus size={16} weight="bold" /> New Sequence
        </button>
        <div className="list-actions-right">
          <button className="btn-secondary" onClick={handleImport}>
            Import
          </button>
          <button
            className="btn-secondary"
            onClick={() => downloadExport(sequences)}
            disabled={sequences.length === 0}
          >
            Export
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={onFileSelected}
        />
      </div>

      {sequences.length === 0 ? (
        <div className="list-empty">
          <p>No sequences yet.</p>
          <p className="text-muted">Create a new one or import a backup.</p>
        </div>
      ) : (
        <div className="seq-cards">
          {sequences.map((seq) => (
            <div key={seq.id} className="seq-card" onClick={() => onOpen(seq.id)}>
              <div className="seq-card-top">
                <span className="seq-card-name">{seq.name || 'Untitled'}</span>
                <span className="seq-card-style">{STYLE_LABELS[seq.style]}</span>
              </div>
              {seq.intention && <div className="seq-card-intention">“{seq.intention}”</div>}
              <div className="seq-card-meta">
                <span>{summary(seq)}</span>
                <span>{seq.targetDuration ? `${seq.targetDuration} min` : ''}</span>
              </div>
              <div className="seq-card-meta seq-card-date">
                <span>{formatDate(seq.updatedAt)}</span>
              </div>
              <div className="seq-card-actions" onClick={(e) => e.stopPropagation()}>
                <button className="icon-btn" onClick={() => duplicate(seq.id)} title="Duplicate" aria-label="Duplicate sequence">
                  <CopySimple size={18} weight="regular" />
                </button>
                <button className="icon-btn danger" onClick={() => remove(seq.id)} title="Delete" aria-label="Delete sequence">
                  <Trash size={18} weight="regular" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <footer className="list-footer">
        <span className="version-tag">v{__APP_VERSION__}</span>
      </footer>
    </div>
  );
}
