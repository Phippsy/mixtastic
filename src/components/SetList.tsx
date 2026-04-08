import { type MixSet, createEmptyMixSet } from '../types';
import { downloadExport, parseImport } from '../storage';
import { useRef, useState, useEffect } from 'react';
import * as drive from '../googleDrive';

interface SetListProps {
  sets: MixSet[];
  onSetsChange: (sets: MixSet[]) => void;
  onOpenSet: (id: string) => void;
}

export function SetList({ sets, onSetsChange, onOpenSet }: SetListProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Google Drive sync state ── */
  const [gisLoaded, setGisLoaded] = useState(drive.isGisLoaded());
  const [clientId, setClientId] = useState(drive.getClientId());
  const [clientIdInput, setClientIdInput] = useState(drive.getClientId());
  const [showClientIdForm, setShowClientIdForm] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'pushing' | 'pulling' | 'checking'>('idle');
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [lastPush, setLastPush] = useState(drive.getLastPush());
  const [lastPull, setLastPull] = useState(drive.getLastPull());
  const [remoteInfo, setRemoteInfo] = useState<drive.RemoteInfo | null>(null);

  useEffect(() => {
    if (drive.isGisLoaded()) {
      setGisLoaded(true);
      return;
    }
    let attempts = 0;
    const timer = setInterval(() => {
      attempts++;
      if (drive.isGisLoaded()) {
        setGisLoaded(true);
        clearInterval(timer);
      } else if (attempts >= 10) {
        clearInterval(timer);
      }
    }, 500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (gisLoaded && clientId) {
      drive.init();
    }
  }, [gisLoaded, clientId]);

  function saveClientId() {
    drive.setClientId(clientIdInput);
    setClientId(clientIdInput.trim());
    setShowClientIdForm(false);
    setSignedIn(false);
    setSyncMessage(null);
    setRemoteInfo(null);
  }

  function clearClientId() {
    drive.setClientId('');
    setClientId('');
    setClientIdInput('');
    setShowClientIdForm(false);
    setSignedIn(false);
    setSyncMessage(null);
    setRemoteInfo(null);
  }

  async function handleSignIn() {
    try {
      await drive.signIn();
      setSignedIn(true);
      setSyncMessage(null);
      // Check remote state after sign-in
      setSyncStatus('checking');
      try {
        const info = await drive.getRemoteInfo();
        setRemoteInfo(info);
      } catch { /* ignore */ }
      setSyncStatus('idle');
    } catch (err) {
      setSyncMessage(err instanceof Error ? err.message : 'Sign-in failed');
    }
  }

  function handleSignOut() {
    drive.signOut();
    setSignedIn(false);
    setSyncMessage(null);
    setRemoteInfo(null);
  }

  function formatSyncTime(iso: string | null): string {
    if (!iso) return 'never';
    try {
      const d = new Date(iso);
      return d.toLocaleString(undefined, {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return 'unknown';
    }
  }

  async function handlePush() {
    // Conflict check: warn if remote is newer than our last push
    if (remoteInfo && lastPush) {
      const remoteTime = new Date(remoteInfo.modifiedTime).getTime();
      const pushTime = new Date(lastPush).getTime();
      if (remoteTime > pushTime) {
        if (!window.confirm(
          `The data on Google Drive was modified after your last push (remote: ${formatSyncTime(remoteInfo.modifiedTime)}, your last push: ${formatSyncTime(lastPush)}).\n\nAnother device may have pushed changes. Pushing now will overwrite the remote data.\n\nContinue?`,
        )) return;
      }
    }

    setSyncStatus('pushing');
    setSyncMessage(null);
    try {
      await drive.uploadSets(sets);
      const now = drive.getLastPush();
      setLastPush(now);
      setSyncMessage(`Pushed ${sets.length} set(s) to Drive ✓`);
      // Refresh remote info
      try {
        setRemoteInfo(await drive.getRemoteInfo());
      } catch { /* ignore */ }
    } catch (err) {
      if (err instanceof Error && err.message.includes('expired')) {
        setSignedIn(false);
      }
      setSyncMessage(err instanceof Error ? err.message : 'Push failed');
    } finally {
      setSyncStatus('idle');
    }
  }

  async function handlePull() {
    setSyncStatus('pulling');
    setSyncMessage(null);
    try {
      const result = await drive.downloadSets();
      if (!result) {
        setSyncMessage('No data on Drive yet. Push your local data first.');
        return;
      }
      const { sets: remoteSets, remoteModified } = result;
      const msg = [
        `Pull ${remoteSets.length} set(s) from Google Drive?`,
        '',
        `Remote last modified: ${formatSyncTime(remoteModified)}`,
        `Your local data: ${sets.length} set(s)`,
        '',
        'This will replace ALL local data with the Drive version.',
      ].join('\n');

      if (!window.confirm(msg)) {
        setSyncMessage(null);
        return;
      }
      onSetsChange(remoteSets);
      setLastPull(drive.getLastPull());
      setSyncMessage(`Pulled ${remoteSets.length} set(s) from Drive ✓`);
      try {
        setRemoteInfo(await drive.getRemoteInfo());
      } catch { /* ignore */ }
    } catch (err) {
      if (err instanceof Error && err.message.includes('expired')) {
        setSignedIn(false);
      }
      setSyncMessage(err instanceof Error ? err.message : 'Pull failed');
    } finally {
      setSyncStatus('idle');
    }
  }

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

      {gisLoaded && (
        <div className="sync-controls">
          <div className="sync-header">
            <span className="sync-label">☁ Google Drive Sync</span>
            {clientId && (
              <button
                className="btn-secondary btn-sm"
                onClick={() => { setShowClientIdForm(true); setClientIdInput(clientId); }}
                title="Settings"
              >
                ⚙
              </button>
            )}
          </div>

          {/* Setup instructions when no client ID is configured */}
          {!clientId && !showClientIdForm && (
            <div className="sync-setup-prompt">
              <p>Sync your sets across devices via Google Drive.</p>
              <button className="btn-primary btn-sm" onClick={() => { setShowClientIdForm(true); setClientIdInput(''); }}>
                Set Up Google Drive
              </button>
            </div>
          )}

          {/* Client ID configuration form */}
          {showClientIdForm && (
            <div className="sync-client-id-form">
              <div className="sync-setup-steps">
                <p className="sync-step"><strong>1.</strong> Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">Google Cloud Console → Credentials</a></p>
                <p className="sync-step"><strong>2.</strong> Create an <strong>OAuth 2.0 Client ID</strong> (type: Web application)</p>
                <p className="sync-step"><strong>3.</strong> Under <em>Authorized JavaScript origins</em>, add:<br/>
                  <code>https://phippsy.github.io</code> and <code>http://localhost:5173</code></p>
                <p className="sync-step"><strong>4.</strong> Also enable the <strong>Google Drive API</strong> in <a href="https://console.cloud.google.com/apis/library/drive.googleapis.com" target="_blank" rel="noopener noreferrer">API Library</a></p>
                <p className="sync-step"><strong>5.</strong> Paste the Client ID below:</p>
              </div>
              <div className="sync-client-id-row">
                <input
                  type="text"
                  className="sync-client-id-input"
                  value={clientIdInput}
                  onChange={e => setClientIdInput(e.target.value)}
                  placeholder="xxxx.apps.googleusercontent.com"
                  spellCheck={false}
                  autoComplete="off"
                />
                <button className="btn-primary btn-sm" onClick={saveClientId} disabled={!clientIdInput.trim()}>
                  Save
                </button>
                {clientId && (
                  <button className="btn-danger btn-sm" onClick={clearClientId} title="Remove Client ID">
                    Remove
                  </button>
                )}
                <button className="btn-secondary btn-sm" onClick={() => setShowClientIdForm(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Sign in / Push / Pull controls */}
          {clientId && !showClientIdForm && (
            <>
              {!signedIn ? (
                <div className="sync-sign-in">
                  <button className="btn-primary btn-sm" onClick={handleSignIn}>
                    Sign in with Google
                  </button>
                </div>
              ) : (
                <div className="sync-actions">
                  <div className="sync-action-buttons">
                    <button
                      className="sync-btn sync-btn-push"
                      onClick={handlePush}
                      disabled={syncStatus !== 'idle' || sets.length === 0}
                      title="Replace Drive data with your local sets"
                    >
                      <span className="sync-btn-icon">↑</span>
                      <span className="sync-btn-text">
                        <strong>{syncStatus === 'pushing' ? 'Pushing…' : 'Push to Drive'}</strong>
                        <span className="sync-btn-desc">Send local → Drive</span>
                      </span>
                    </button>
                    <button
                      className="sync-btn sync-btn-pull"
                      onClick={handlePull}
                      disabled={syncStatus !== 'idle'}
                      title="Replace local data with Drive sets"
                    >
                      <span className="sync-btn-icon">↓</span>
                      <span className="sync-btn-text">
                        <strong>{syncStatus === 'pulling' ? 'Pulling…' : 'Pull from Drive'}</strong>
                        <span className="sync-btn-desc">Get Drive → local</span>
                      </span>
                    </button>
                  </div>
                  <div className="sync-status-bar">
                    <span className="sync-status-item">Local: {sets.length} set(s)</span>
                    {remoteInfo && (
                      <span className="sync-status-item">Drive: {remoteInfo.setCount} set(s)</span>
                    )}
                    {syncStatus === 'checking' && (
                      <span className="sync-status-item">Checking…</span>
                    )}
                  </div>
                  <div className="sync-timestamps">
                    {lastPush && <span>Last push: {formatSyncTime(lastPush)}</span>}
                    {lastPull && <span>Last pull: {formatSyncTime(lastPull)}</span>}
                  </div>
                  <button className="btn-secondary btn-sm sync-sign-out" onClick={handleSignOut}>
                    Sign out
                  </button>
                </div>
              )}
            </>
          )}

          {syncMessage && (
            <div className={`sync-message ${syncMessage.includes('✓') ? 'sync-success' : 'sync-error'}`}>
              {syncMessage}
            </div>
          )}
        </div>
      )}

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
