import { useState } from 'react';
import {
  ArrowsLeftRight,
  CaretDown,
  CaretRight,
  Check,
  DotsSixVertical,
  Plus,
  X,
} from '@phosphor-icons/react';
import {
  PHASE_COLORS,
  PHASE_LABELS,
  PHASE_ORDER,
  type Phase,
  type Pose,
  type Section,
  createPose,
  flipSide,
} from '../types';
import { PoseRow } from './PoseRow';
import { MuscleChart } from './MuscleChart';
import { aggregateSection } from '../muscleAggregate';

interface SectionCardProps {
  mode: 'edit' | 'practice';
  section: Section;
  index: number;
  onChange: (section: Section) => void;
  onRemove: () => void;
  onComplete: () => void;
  /** Insert a mirrored copy of this section (sides flipped) after it. */
  onMirror: (mirrored: Section) => void;
  /** Re-run muscle analysis for one pose after an error. */
  onRetryAnalysis?: (poseId: string) => void;
  // Drag-and-drop (edit mode)
  isDragging: boolean;
  isDragOver: boolean;
  onDragStart: () => void;
  onDragOver: () => void;
  onDrop: () => void;
  onDragEnd: () => void;
}

export function SectionCard({
  mode,
  section,
  index,
  onChange,
  onRemove,
  onComplete,
  onMirror,
  onRetryAnalysis,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: SectionCardProps) {
  const [showMuscles, setShowMuscles] = useState(false);
  const [showPhasePicker, setShowPhasePicker] = useState(false);

  function patch(updates: Partial<Section>) {
    onChange({ ...section, ...updates });
  }

  function updatePose(poseId: string, updated: Pose) {
    patch({ poses: section.poses.map((p) => (p.id === poseId ? updated : p)) });
  }

  function removePose(poseId: string) {
    const next = section.poses.filter((p) => p.id !== poseId);
    patch({ poses: next.length === 0 ? [createPose()] : next });
  }

  function addPose() {
    patch({ poses: [...section.poses, createPose()] });
  }

  function mirrorSection() {
    const mirrored: Section = {
      ...section,
      id: `mirror-${Date.now()}`,
      name: section.name,
      completed: false,
      expanded: true,
      poses: section.poses.map((p) => ({
        ...p,
        id: `mirror-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        side: flipSide(p.side),
        completed: false,
      })),
    };
    onMirror(mirrored);
  }

  const totals = aggregateSection(section);
  const phaseColor = PHASE_COLORS[section.phase];

  const visiblePoseCount = section.poses.filter((p) => p.name.trim()).length;

  /* ── Practice mode ── */
  if (mode === 'practice') {
    return (
      <div
        className={`section-card section-practice${section.completed ? ' section-done' : ''}`}
        style={{ borderLeftColor: phaseColor }}
      >
        <div className="section-head" onClick={() => patch({ expanded: !section.expanded })}>
          <button className="expand-toggle" aria-label={section.expanded ? 'Collapse' : 'Expand'}>
            {section.expanded ? <CaretDown size={15} weight="bold" /> : <CaretRight size={15} weight="bold" />}
          </button>
          <span className="section-num">{index + 1}</span>
          <span className="phase-dot" style={{ background: phaseColor }} />
          <span className="section-title">{section.name || PHASE_LABELS[section.phase]}</span>
          {section.repeats > 1 && (
            <span className="repeat-counter-practice" title="Rounds">
              x{section.repeats}
            </span>
          )}
          <button
            className={section.completed ? 'done-btn done-active' : 'done-btn'}
            onClick={(e) => {
              e.stopPropagation();
              onComplete();
            }}
            title={section.completed ? 'Mark not done' : 'Mark section done'}
            aria-pressed={section.completed}
          >
            <Check size={14} weight="bold" />{section.completed ? ' Done' : ''}
          </button>
        </div>
        {section.expanded && (
          <div className="section-body">
            {section.notes && <p className="section-notes-practice">{section.notes}</p>}
            {section.poses.map((p, i) => (
              <PoseRow
                key={p.id}
                mode="practice"
                pose={p}
                index={i}
                onChange={(up) => updatePose(p.id, up)}
                onRemove={() => removePose(p.id)}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ── Edit mode ── */
  return (
    <div
      className={`section-card section-edit${isDragging ? ' section-dragging' : ''}${isDragOver ? ' section-dragover' : ''}`}
      style={{ borderLeftColor: phaseColor }}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver();
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
    >
      <div className="section-head">
        <span
          className="drag-handle"
          draggable
          onDragStart={(e) => {
            e.stopPropagation();
            onDragStart();
          }}
          onDragEnd={onDragEnd}
          title="Drag to reorder section"
          aria-label="Drag to reorder section"
        >
          <DotsSixVertical size={16} weight="bold" />
        </span>
        <button className="expand-toggle" onClick={() => patch({ expanded: !section.expanded })} aria-label={section.expanded ? 'Collapse' : 'Expand'}>
          {section.expanded ? <CaretDown size={15} weight="bold" /> : <CaretRight size={15} weight="bold" />}
        </button>
        <span className="section-num">{index + 1}</span>
        <input
          className="section-name-input"
          type="text"
          value={section.name}
          placeholder="Section name…"
          onChange={(e) => patch({ name: e.target.value })}
        />
        <button className="icon-btn danger" title="Remove section" aria-label="Remove section" onClick={onRemove}>
          <X size={16} weight="bold" />
        </button>
      </div>

      {section.expanded && (
        <div className="section-body">
          <div className="section-controls">
            {/* Phase selector */}
            <div className="phase-selector">
              <button
                className="phase-pill"
                style={{ background: phaseColor }}
                onClick={() => setShowPhasePicker((v) => !v)}
                title="Set phase"
              >
                {PHASE_LABELS[section.phase]}
              </button>
              {showPhasePicker && (
                <div className="phase-options">
                  {PHASE_ORDER.map((ph: Phase) => (
                    <button
                      key={ph}
                      className="phase-option"
                      style={{ borderColor: PHASE_COLORS[ph] }}
                      onClick={() => {
                        patch({ phase: ph });
                        setShowPhasePicker(false);
                      }}
                    >
                      <span className="phase-dot" style={{ background: PHASE_COLORS[ph] }} />
                      {PHASE_LABELS[ph]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Repeats */}
            <label className="repeat-input" title="Repeat this section N times">
              <span>Rounds</span>
              <input
                type="number"
                min={1}
                inputMode="numeric"
                value={section.repeats}
                onChange={(e) => patch({ repeats: Math.max(1, Number(e.target.value) || 1) })}
              />
            </label>

            {/* Duration */}
            <label className="duration-input" title="Target duration (minutes)">
              <span>Min</span>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={section.durationMinutes ?? ''}
                placeholder="-"
                onChange={(e) =>
                  patch({ durationMinutes: e.target.value === '' ? null : Math.max(0, Number(e.target.value)) })
                }
              />
            </label>

            <button className="mirror-btn" onClick={mirrorSection} title="Duplicate with sides flipped">
              <ArrowsLeftRight size={14} weight="bold" /> Mirror
            </button>
          </div>

          <textarea
            className="section-notes-input"
            value={section.notes}
            placeholder="Section notes / theme…"
            rows={1}
            onChange={(e) => patch({ notes: e.target.value })}
          />

          <div className="poses-list">
            {section.poses.map((p, i) => (
              <PoseRow
                key={p.id}
                mode="edit"
                pose={p}
                index={i}
                onChange={(up) => updatePose(p.id, up)}
                onRemove={() => removePose(p.id)}
                onRetry={onRetryAnalysis ? () => onRetryAnalysis(p.id) : undefined}
              />
            ))}
          </div>

          <button className="add-pose-btn" onClick={addPose}>
            <Plus size={14} weight="bold" /> Add pose
          </button>

          {/* Section muscle summary */}
          <div className="section-muscle-toggle">
            <button className="muscle-toggle-btn" onClick={() => setShowMuscles((v) => !v)}>
              {showMuscles ? <CaretDown size={13} weight="bold" /> : <CaretRight size={13} weight="bold" />} Muscles worked ({visiblePoseCount} pose{visiblePoseCount !== 1 ? 's' : ''})
            </button>
            {showMuscles && (
              <MuscleChart
                totals={totals}
                compact
                emptyHint="Enter pose names to see muscle analysis (needs OpenAI key)."
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
