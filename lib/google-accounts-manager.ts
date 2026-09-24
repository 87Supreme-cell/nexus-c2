import fs from 'fs';
import path from 'path';

const ACCOUNTS_FILE = path.join(process.cwd(), 'data', 'google-accounts.json');

export interface GoogleAccountProfile {
  id: string;
  name: string;
  email: string;
  slot: number; // 0 for u/0, 1 for u/1
  role: 'defense' | 'enterprise' | 'personal';
  connected: boolean;
  avatarColor: string;
  calendarName?: string;
  drivePath?: string;
  description: string;
}

export const DEFAULT_GOOGLE_ACCOUNTS: GoogleAccountProfile[] = [
  {
    id: 'supreme',
    name: '87Supreme Cell (DoD / CAANG)',
    email: 'eighty7supreme@gmail.com',
    slot: 0,
    role: 'defense',
    connected: true,
    avatarColor: 'cyan',
    calendarName: 'eighty7supreme@gmail.com',
    description: 'Primary Defense Command, CAANG 146th Airlift Wing, Antigravity OAuth, Tactical Directives',
  },
  {
    id: 'symbrook',
    name: 'Symbrook / Atlas Labs (Enterprise)',
    email: 'josh@symbrook.com',
    slot: 1,
    role: 'enterprise',
    connected: true,
    avatarColor: 'green',
    drivePath: path.join(process.env.HOME || '', 'Library/CloudStorage/GoogleDrive-josh@symbrook.com/My Drive'),
    description: 'Work Workspace, Google Drive Cloud Storage, Atlas Labs Client Deliverables & Frameworks',
  },
];

export interface GoogleAccountsState {
  accounts: GoogleAccountProfile[];
  activeAccountId: string; // 'all' | 'supreme' | 'symbrook'
}

export function getGoogleAccountsState(): GoogleAccountsState {
  try {
    if (fs.existsSync(ACCOUNTS_FILE)) {
      const data = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf-8'));
      if (data.accounts && Array.isArray(data.accounts)) {
        return data;
      }
    }
  } catch (err) {
    console.error('Error reading google-accounts.json:', err);
  }

  const initial: GoogleAccountsState = {
    accounts: DEFAULT_GOOGLE_ACCOUNTS,
    activeAccountId: 'all',
  };
  saveGoogleAccountsState(initial);
  return initial;
}

export function saveGoogleAccountsState(state: GoogleAccountsState): void {
  try {
    const dir = path.dirname(ACCOUNTS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(state, null, 2), 'utf-8');
    try {
      fs.chmodSync(ACCOUNTS_FILE, 0o600);
    } catch {}
  } catch (err) {
    console.error('Error saving google-accounts.json:', err);
  }
}
