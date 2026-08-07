import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, CaretDown, CaretRight, CaretUp, Plus } from '@phosphor-icons/react';
import {
  STYLE_LABELS,
  type MuscleAnalysis,
  type PracticeStyle,
  type Section,
  type Sequence,
  createSection,
} from '../types';
import { SectionCard } from './SectionCard';
import { MuscleChart } from './MuscleChart';
import { aggregateSequence, countUnanalysed } from '../muscleAggregate';
import {
  analysePose,
  getCachedAnalysis,
  isAnalysisAvailable,
} from '../muscleAnalysis';

interface SequenceEditorProps {
  sequence: Sequence;
  onChange: (sequence: Sequence) => void;
  onBack: () => void;
}

const STYLES: PracticeStyle[] = ['vinyasa', 'hatha', 'ashtanga', 'yin', 'restorative', 'power', 'custom'];

export function SequenceEditor({ sequence, onChange, onBack }: SequenceEditorProps) {
  const mode = sequence.viewMode;
  const [showOverall, setShowOverall] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  // Always-current ref so async analysis callbacks read the latest sequence.
  const seqRef = useRef(sequence);
  seqRef.current = sequence;

  // Keys we've already attempted this session (prevents error retry storms).
  const attemptedRef = useRef<Set<string>>(new Set());
  const inFlightRef = useRef<Set<string>>(new Set());

  function touch(updates: Partial<Sequence>) {
    const next = { ...seqRef.current, ...updates, updatedAt: new Date().toISOString() };
    seqRef.current = next;
    onChange(next);
  }

  function setPoseAnalysis(sectionId: string, poseId: string, analysis: MuscleAnalysis) {
    const seq = seqRef.current;
    const next: Sequence = {
      ...seq,
      sections: seq.sections.map((s) =>
        s.id === sectionId
          ? { ...s, poses: s.poses.map((p) => (p.id === poseId ? { ...p, analysis } : p)) }
          : s,
      ),
    };
    seqRef.current = next;
    onChange(next);
  }

  function clearPoseAnalysis(sectionId: string, poseId: string) {
    const seq = seqRef.current;
    const next: Sequence = {
      ...seq,
      sections: seq.sections.map((s) =>
        s.id === sectionId
          ? { ...s, poses: s.poses.map((p) => (p.id === poseId ? { ...p, analysis: undefined } : p)) }
          : s,
      ),
    };
    seqRef.current = next;
    onChange(next);
  }

  /** Re-run analysis for one pose after an error: prune attempt guards so the effect retries. */
  function retryAnalysis(sectionId: string, poseId: string) {
    for (const k of [...attemptedRef.current]) {
      if (k.endsWith(`|${sectionId}|${poseId}`)) attemptedRef.current.delete(k);
    }
    for (const k of [...inFlightRef.current]) {
      if (k.endsWith(`|${sectionId}|${poseId}`)) inFlightRef.current.delete(k);
    }
    clearPoseAnalysis(sectionId, poseId);
  }

  /* ── Background muscle analysis orchestration ── */
  useEffect(() => {
    if (!isAnalysisAvailable()) return;

    for (const section of sequence.sections) {
      for (const pose of section.poses) {
        const name = pose.name.trim();
        if (!name) continue;
        const key = `${name.toLowerCase()}|${(pose.sanskritName ?? '').toLowerCase()}|${section.id}|${pose.id}`;

        const cached = getCachedAnalysis(name, pose.sanskritName);
        if (cached && cached.status === 'ready') {
          // Apply cached result if not already reflected on the pose.
          if (pose.analysis?.analysedAt !== cached.analysedAt) {
            setPoseAnalysis(section.id, pose.id, cached);
          }
          continue;
        }

        // No ready cache for the current name.
        if (pose.analysis?.status === 'pending') continue;
        if (inFlightRef.current.has(key)) continue;
        if (attemptedRef.current.has(key)) continue;

        // Trigger analysis.
        inFlightRef.current.add(key);
        attemptedRef.current.add(key);
        setPoseAnalysis(section.id, pose.id, {
          status: 'pending',
          intensity: 0,
          muscles: [],
        });
        const capturedSectionId = section.id;
        const capturedPoseId = pose.id;
        analysePose(name, pose.sanskritName)
          .then((result) => {
            setPoseAnalysis(capturedSectionId, capturedPoseId, result);
          })
          .finally(() => {
            inFlightRef.current.delete(key);
          });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sequence]);

  /* ── Section operations ── */
  function updateSection(index: number, updated: Section) {
    touch({ sections: sequence.sections.map((s, i) => (i === index ? updated : s)) });
  }

  function removeSection(index: number) {
    const next = sequence.sections.filter((_, i) => i !== index);
    touch({ sections: next.length === 0 ? [createSection()] : next });
  }

  function addSection() {
    touch({ sections: [...sequence.sections, createSection()] });
  }

  function completeSection(index: number) {
    touch({
      sections: sequence.sections.map((s, i) => {
        if (i === index) return { ...s, completed: !s.completed, expanded: s.completed };
        if (i === index + 1 && !sequence.sections[index].completed) return { ...s, expanded: true };
        return s;
      }),
    });
  }

  function mirrorSection(index: number, mirrored: Section) {
    const next = [...sequence.sections];
    next.splice(index + 1, 0, mirrored);
    touch({ sections: next });
  }

  const allExpanded = sequence.sections.length > 0 && sequence.sections.every((s) => s.expanded);
  function toggleExpandAll() {
    const target = !allExpanded;
    touch({ sections: sequence.sections.map((s) => ({ ...s, expanded: target })) });
  }

  /* ── Drag and drop ── */
  function handleDrop(index: number) {
    if (dragIdx === null || dragIdx === index) {
      setDragIdx(null);
      setOverIdx(null);
      return;
    }
    const next = [...sequence.sections];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(index, 0, moved);
    touch({ sections: next });
    setDragIdx(null);
    setOverIdx(null);
  }

  const overallTotals = aggregateSequence(sequence);
  const pending = countUnanalysed(sequence);
  const analysisOn = isAnalysisAvailable();

  return (
    <div className="sequence-editor">
      <header className="editor-header">
        <button className="btn-back" onClick={onBack} title="Back to sequences" aria-label="Back to sequences">
          <ArrowLeft size={16} weight="bold" /> All
        </button>
        {mode === 'edit' ? (
          <input
            className="seq-name-input"
            type="text"
            value={sequence.name}
            placeholder="Sequence name…"
            onChange={(e) => touch({ name: e.target.value })}
          />
        ) : (
          <div className="seq-name-display">{sequence.name || 'Untitled sequence'}</div>
        )}
        <div className="mode-toggle" role="tablist">
          <button
            className={`mode-btn${mode === 'edit' ? ' mode-btn-active' : ''}`}
            onClick={() => touch({ viewMode: 'edit' })}
          >
            Edit
          </button>
          <button
            className={`mode-btn${mode === 'practice' ? ' mode-btn-active' : ''}`}
            onClick={() => touch({ viewMode: 'practice' })}
          >
            Practice
          </button>
        </div>
        <button className="icon-btn" onClick={toggleExpandAll} title={allExpanded ? 'Collapse all' : 'Expand all'} aria-label={allExpanded ? 'Collapse all sections' : 'Expand all sections'}>
          {allExpanded ? <CaretUp size={16} weight="bold" /> : <CaretDown size={16} weight="bold" />}
        </button>
      </header>

      {/* Sequence meta */}
      {mode === 'edit' ? (
        <div className="seq-meta-edit">
          <select
            className="style-select"
            value={sequence.style}
            onChange={(e) => touch({ style: e.target.value as PracticeStyle })}
          >
            {STYLES.map((s) => (
              <option key={s} value={s}>
                {STYLE_LABELS[s]}
              </option>
            ))}
          </select>
          <label className="target-input" title="Target total duration (minutes)">
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={sequence.targetDuration ?? ''}
              placeholder="min"
              onChange={(e) =>
                touch({ targetDuration: e.target.value === '' ? null : Math.max(0, Number(e.target.value)) })
              }
            />
            <span>min</span>
          </label>
          <input
            className="intention-input"
            type="text"
            value={sequence.intention}
            placeholder="Intention / through-line…"
            onChange={(e) => touch({ intention: e.target.value })}
          />
        </div>
      ) : (
        sequence.intention && <div className="intention-banner">“{sequence.intention}”</div>
      )}

      {/* Overall muscle summary */}
      <div className="overall-muscles">
        <button className="muscle-toggle-btn" onClick={() => setShowOverall((v) => !v)}>
          {showOverall ? <CaretDown size={14} weight="bold" /> : <CaretRight size={14} weight="bold" />} Muscle focus, whole sequence
          {analysisOn && pending > 0 && <span className="analysing-tag"> &middot; analysing {pending}</span>}
        </button>
        {showOverall && (
          <MuscleChart
            totals={overallTotals}
            emptyHint={
              analysisOn
                ? 'Add pose names. Muscle analysis runs automatically in the background.'
                : 'Muscle analysis is off. Add an OpenAI API key (.env) to enable it.'
            }
          />
        )}
      </div>

      {/* Sections */}
      <main className="sections-list">
        {sequence.sections.map((section, i) => (
          <SectionCard
            key={section.id}
            mode={mode}
            section={section}
            index={i}
            onChange={(up) => updateSection(i, up)}
            onRemove={() => removeSection(i)}
            onComplete={() => completeSection(i)}
            onMirror={(mirrored) => mirrorSection(i, mirrored)}
            onRetryAnalysis={(poseId) => retryAnalysis(section.id, poseId)}
            isDragging={dragIdx === i}
            isDragOver={overIdx === i}
            onDragStart={() => setDragIdx(i)}
            onDragOver={() => {
              if (dragIdx !== null && dragIdx !== i) setOverIdx(i);
            }}
            onDrop={() => handleDrop(i)}
            onDragEnd={() => {
              setDragIdx(null);
              setOverIdx(null);
            }}
          />
        ))}
      </main>

      {mode === 'edit' && (
        <button className="add-section-btn" onClick={addSection}>
          <Plus size={15} weight="bold" /> Add Section
        </button>
      )}
    </div>
  );
}
