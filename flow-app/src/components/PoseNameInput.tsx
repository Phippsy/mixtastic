import { useEffect, useRef, useState } from 'react';
import { type PoseSuggestion, searchPoses } from '../poseLibrary';

interface PoseNameInputProps {
  value: string;
  sanskritValue?: string;
  onCommit: (name: string, sanskritName?: string) => void;
  placeholder?: string;
}

/**
 * Text input with fuzzy autocomplete from the pose library.
 * The practitioner can always type any name freely; suggestions are only
 * a convenience. Selecting a suggestion also fills the Sanskrit name.
 */
export function PoseNameInput({ value, sanskritValue, onCommit, placeholder }: PoseNameInputProps) {
  const [text, setText] = useState(value);
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<PoseSuggestion[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Keep local text in sync if the value changes externally.
  useEffect(() => {
    setText(value);
  }, [value]);

  // Close on outside click.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  function handleChange(next: string) {
    setText(next);
    const results = searchPoses(next, 6);
    setSuggestions(results);
    setActiveIdx(0);
    setOpen(results.length > 0);
  }

  function choose(s: PoseSuggestion) {
    setText(s.name);
    setOpen(false);
    onCommit(s.name, s.sanskritName);
  }

  function commitFreeText() {
    setOpen(false);
    if (text.trim() !== value.trim()) {
      onCommit(text, sanskritValue);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) {
      if (e.key === 'Enter') commitFreeText();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(suggestions[activeIdx]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className="pose-name-input" ref={wrapRef}>
      <input
        className="pose-name-field"
        type="text"
        value={text}
        placeholder={placeholder ?? 'Pose name'}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (text.trim()) {
            const results = searchPoses(text, 6);
            setSuggestions(results);
            setOpen(results.length > 0);
          }
        }}
        onBlur={commitFreeText}
        autoComplete="off"
        spellCheck={false}
      />
      {open && suggestions.length > 0 && (
        <ul className="pose-suggestions" role="listbox">
          {suggestions.map((s, i) => (
            <li
              key={s.name}
              role="option"
              aria-selected={i === activeIdx}
              className={`pose-suggestion${i === activeIdx ? ' pose-suggestion-active' : ''}`}
              // onMouseDown (not onClick) so it fires before input blur.
              onMouseDown={(e) => {
                e.preventDefault();
                choose(s);
              }}
              onMouseEnter={() => setActiveIdx(i)}
            >
              <span className="pose-suggestion-name">{s.name}</span>
              {s.sanskritName && (
                <span className="pose-suggestion-sanskrit">{s.sanskritName}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
