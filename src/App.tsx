import { useState, useEffect, useCallback } from 'react';
import { type MixSet } from './types';
import { loadSets, saveSets, loadTheme, saveTheme } from './storage';
import { SetList } from './components/SetList';
import { SetEditor } from './components/SetEditor';
import './App.css';

function getHashSetId(): string | null {
  const hash = window.location.hash;
  const match = hash.match(/^#\/set\/(.+)$/);
  return match ? match[1] : null;
}

export default function App() {
  const [sets, setSets] = useState<MixSet[]>(loadSets);
  const [activeSetId, setActiveSetId] = useState<string | null>(getHashSetId);
  const [theme, setTheme] = useState<'dark' | 'light'>(loadTheme);

  // Persist sets
  useEffect(() => { saveSets(sets); }, [sets]);

  // Persist theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    saveTheme(theme);
  }, [theme]);

  // Sync hash → state
  useEffect(() => {
    function onHashChange() {
      setActiveSetId(getHashSetId());
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Navigate helpers
  function openSet(id: string) {
    window.location.hash = `#/set/${id}`;
  }

  function goHome() {
    window.location.hash = '';
  }

  const updateSet = useCallback((updated: MixSet) => {
    setSets(prev => prev.map(s => s.id === updated.id ? updated : s));
  }, []);

  const activeSet = activeSetId ? sets.find(s => s.id === activeSetId) : null;

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title-row">
          <h1 className="app-title" onClick={goHome} style={{ cursor: 'pointer' }}>Mixtastic</h1>
          {!activeSet && <span className="app-subtitle">DJ Mix Planner</span>}
          <button
            className="theme-toggle"
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </div>
      </header>

      {activeSet ? (
        <SetEditor set={activeSet} onChange={updateSet} onBack={goHome} />
      ) : (
        <SetList sets={sets} onSetsChange={setSets} onOpenSet={openSet} />
      )}
    </div>
  );
}
