import { type MixSet, createEmptyMixSet } from '../types';
import { downloadExport, parseImport } from '../storage';
import { useRef } from 'react';

interface SetListProps {
  sets: MixSet[];
  onSetsChange: (sets: MixSet[]) => void;
  onOpenSet: (id: string) => void;
}

export function SetList({ sets, onSetsChange, onOpenSet }: SetListProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function createSet() {
    const newSet = createEmptyMixSet();
    onSetsChange([newSet, ...sets]);
    onOpenSet(newSet.id);
  }

  function deleteSet(id: string) {
    const set = sets.find(s => s.id === id);
    if (!set) return;
    if (!window.confirm(`Delete "${set.name || 'Untitled'}"? This cannot be undone.`)) return;
    onSetsChange(sets.filter(s => s.id !== id));
  }

  function duplicateSet(id: string) {
    const set = sets.find(s => s.id === id);
    if (!set) return;
    const now = new Date().toISOString();
    const copy: MixSet = {
      ...JSON.parse(JSON.stringify(set)),
      id: `copy-${Date.now()}`,
      name: `${set.name || 'Untitled'} (copy)`,
      createdAt: now,
      updatedAt: now,
    };
    const idx = sets.findIndex(s => s.id === id);
    const next = [...sets];
    next.splice(idx + 1, 0, copy);
    onSetsChange(next);
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
        // Merge: add imported sets, skip duplicates by id
        const existingIds = new Set(sets.map(s => s.id));
        const newSets = imported.filter(s => !existingIds.has(s.id));
        if (newSets.length === 0 && imported.length > 0) {
          if (window.confirm(`All ${imported.length} set(s) already exist. Replace them with imported versions?`)) {
            const importedIds = new Set(imported.map(s => s.id));
            const kept = sets.filter(s => !importedIds.has(s.id));
            onSetsChange([...imported, ...kept]);
          }
        } else {
          onSetsChange([...newSets, ...sets]);
          alert(`Imported ${newSets.length} set(s).`);
        }
      } catch (err) {
        alert(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
      // Reset so the same file can be re-imported
      e.target.value = '';
    };
    reader.readAsText(file);
  }

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        day: 'numeric', month: 'short', year: 'numeric',
      });
    } catch {
      return '';
    }
  }

  function pairSummary(set: MixSet): string {
    const total = set.pairs.length;
    const done = set.pairs.filter(p => p.completed).length;
    return done > 0 ? `${done}/${total} done` : `${total} pair${total !== 1 ? 's' : ''}`;
  }

  return (
    <div className="set-list">
      <div className="set-list-actions">
        <button className="btn-primary" onClick={createSet}>+ New Set</button>
        <div className="set-list-actions-right">
          <button className="btn-secondary" onClick={handleImport}>Import</button>
          <button
            className="btn-secondary"
            onClick={() => downloadExport(sets)}
            disabled={sets.length === 0}
          >
            Export All
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

      {sets.length === 0 ? (
        <div className="set-list-empty">
          <p>No sets yet.</p>
          <p className="text-muted">Create a new set or import a backup.</p>
        </div>
      ) : (
        <div className="set-cards">
          {sets.map(set => (
            <div
              key={set.id}
              className="set-card"
              onClick={() => onOpenSet(set.id)}
            >
              <div className="set-card-name">{set.name || 'Untitled'}</div>
              <div className="set-card-meta">
                <span>{pairSummary(set)}</span>
                <span>{formatDate(set.updatedAt)}</span>
              </div>
              <div className="set-card-actions" onClick={e => e.stopPropagation()}>
                <button
                  className="btn-secondary btn-sm"
                  onClick={() => duplicateSet(set.id)}
                  title="Duplicate"
                >⧉</button>
                <button
                  className="btn-danger btn-sm"
                  onClick={() => deleteSet(set.id)}
                  title="Delete"
                >🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
