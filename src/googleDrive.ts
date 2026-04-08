import { type MixSet } from './types';

const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const FILE_NAME = 'mixtastic-data.json';
const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';
const CLIENT_ID_KEY = 'mixtastic-google-client-id';
const LAST_PUSH_KEY = 'mixtastic-drive-last-push';
const LAST_PULL_KEY = 'mixtastic-drive-last-pull';

let tokenClient: google.accounts.oauth2.TokenClient | null = null;
let accessToken: string | null = null;
let currentClientId: string | null = null;

export function getClientId(): string {
  return localStorage.getItem(CLIENT_ID_KEY) ?? '';
}

export function setClientId(id: string) {
  const trimmed = id.trim();
  if (trimmed) {
    localStorage.setItem(CLIENT_ID_KEY, trimmed);
  } else {
    localStorage.removeItem(CLIENT_ID_KEY);
  }
  // Reset token client so it re-initialises with new ID
  tokenClient = null;
  accessToken = null;
  currentClientId = null;
}

/** True when the GIS library has loaded. */
export function isGisLoaded(): boolean {
  return typeof google !== 'undefined' && !!google.accounts?.oauth2;
}

/** True when GIS is loaded and a client ID is configured. */
export function isAvailable(): boolean {
  return !!getClientId() && isGisLoaded();
}

export function isSignedIn(): boolean {
  return accessToken !== null;
}

/** Call once after GIS script has loaded (or after client ID changes). */
export function init() {
  const clientId = getClientId();
  if (!clientId || !isGisLoaded()) return;
  if (currentClientId === clientId && tokenClient) return;
  currentClientId = clientId;
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: SCOPES,
    callback: () => {},
  });
}

/** Opens the Google sign-in popup and obtains an access token. */
export function signIn(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Google auth not initialised'));
      return;
    }
    tokenClient.callback = (resp) => {
      if (resp.error) {
        reject(new Error(resp.error));
        return;
      }
      accessToken = resp.access_token;
      resolve();
    };
    tokenClient.error_callback = (err) => {
      reject(new Error(err.message || err.type || 'Sign-in cancelled'));
    };
    tokenClient.requestAccessToken({ prompt: '' });
  });
}

export function signOut() {
  if (accessToken) {
    google.accounts.oauth2.revoke(accessToken, () => {});
    accessToken = null;
  }
}

/* ── Internal helpers ── */

async function driveRequest(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  if (!accessToken) throw new Error('Not signed in');
  const resp = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers as Record<string, string>),
    },
  });
  if (resp.status === 401) {
    accessToken = null;
    throw new Error('Session expired. Please sign in again.');
  }
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Drive API error (${resp.status}): ${body}`);
  }
  return resp;
}

export interface DriveFileInfo {
  id: string;
  modifiedTime: string;
}

async function findFile(): Promise<DriveFileInfo | null> {
  const q = encodeURIComponent(
    `name='${FILE_NAME}' and mimeType='application/json' and trashed=false`,
  );
  const resp = await driveRequest(
    `${DRIVE_FILES_URL}?q=${q}&fields=files(id,modifiedTime)&spaces=drive`,
  );
  const data = await resp.json();
  const file = data.files?.[0];
  return file ? { id: file.id, modifiedTime: file.modifiedTime } : null;
}

export function getLastPush(): string | null {
  return localStorage.getItem(LAST_PUSH_KEY);
}

export function getLastPull(): string | null {
  return localStorage.getItem(LAST_PULL_KEY);
}

export interface RemoteInfo {
  setCount: number;
  modifiedTime: string;
}

export async function getRemoteInfo(): Promise<RemoteInfo | null> {
  const file = await findFile();
  if (!file) return null;
  const resp = await driveRequest(`${DRIVE_FILES_URL}/${file.id}?alt=media`);
  const text = await resp.text();
  const data = JSON.parse(text);
  let setCount = 0;
  if (data.version === 1 && Array.isArray(data.sets)) {
    setCount = data.sets.length;
  } else if (Array.isArray(data) && data.length > 0) {
    setCount = data.length;
  }
  return { setCount, modifiedTime: file.modifiedTime };
}

/* ── Public API ── */

export interface ExportData {
  version: 1;
  exportedAt: string;
  sets: MixSet[];
}

/** Upload all sets to Google Drive as a JSON file. */
export async function uploadSets(sets: MixSet[]): Promise<void> {
  const now = new Date().toISOString();
  const exportData: ExportData = {
    version: 1,
    exportedAt: now,
    sets,
  };
  const jsonData = JSON.stringify(exportData, null, 2);
  const file = await findFile();

  if (file) {
    // Update existing file
    await driveRequest(`${DRIVE_UPLOAD_URL}/${file.id}?uploadType=media`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: jsonData,
    });
  } else {
    // Create new file (multipart upload)
    const metadata = JSON.stringify({
      name: FILE_NAME,
      mimeType: 'application/json',
    });
    const boundary = '---mixtastic-boundary';
    const body = [
      `--${boundary}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      metadata,
      `--${boundary}`,
      'Content-Type: application/json',
      '',
      jsonData,
      `--${boundary}--`,
    ].join('\r\n');

    await driveRequest(`${DRIVE_UPLOAD_URL}?uploadType=multipart`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    });
  }
  localStorage.setItem(LAST_PUSH_KEY, now);
}

export interface DownloadResult {
  sets: MixSet[];
  remoteModified: string;
}

/** Download sets from Google Drive. Returns null if no file exists yet. */
export async function downloadSets(): Promise<DownloadResult | null> {
  const file = await findFile();
  if (!file) return null;

  const resp = await driveRequest(`${DRIVE_FILES_URL}/${file.id}?alt=media`);
  const text = await resp.text();
  const data = JSON.parse(text);

  let sets: MixSet[];
  if (data.version === 1 && Array.isArray(data.sets)) {
    sets = data.sets as MixSet[];
  } else if (Array.isArray(data) && data.length > 0 && 'pairs' in data[0]) {
    sets = data as MixSet[];
  } else {
    throw new Error('Unrecognised data format in Drive file');
  }

  localStorage.setItem(LAST_PULL_KEY, new Date().toISOString());
  return { sets, remoteModified: file.modifiedTime };
}
