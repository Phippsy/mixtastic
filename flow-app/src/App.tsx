import { useEffect, useState } from 'react';
import { type Sequence } from './types';
import { loadSequences, saveSequences } from './storage';
import { SequenceList } from './components/SequenceList';
import { SequenceEditor } from './components/SequenceEditor';

export function App() {
  const [sequences, setSequences] = useState<Sequence[]>(() => loadSequences());
  const [openId, setOpenId] = useState<string | null>(null);

  // Persist on every change.
  useEffect(() => {
    saveSequences(sequences);
  }, [sequences]);

  const openSequence = sequences.find((s) => s.id === openId) ?? null;

  function updateSequence(updated: Sequence) {
    setSequences((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }

  return (
    <div className="app">
      {openSequence ? (
        <SequenceEditor
          sequence={openSequence}
          onChange={updateSequence}
          onBack={() => setOpenId(null)}
        />
      ) : (
        <SequenceList
          sequences={sequences}
          onSequencesChange={setSequences}
          onOpen={setOpenId}
        />
      )}
    </div>
  );
}
