import fs from 'fs';
import path from 'path';

export interface EmailMessage {
  id: string;
  accountEmail: 'eighty7supreme@gmail.com' | 'josh@symbrook.com';
  senderName: string;
  senderEmail: string;
  subject: string;
  snippet: string;
  body: string;
  date: string;
  timestamp: string;
  unread: boolean;
  priority: 'critical' | 'high' | 'normal';
  labels: string[];
  suggestedAction?: string;
}

export interface EmailDraft {
  id: string;
  replyToId?: string;
  to: string;
  from: string;
  subject: string;
  body: string;
  tone: 'tactical' | 'executive' | 'concise' | 'urgent';
  createdAt: string;
}

const EMAILS_FILE = path.join(process.cwd(), 'data', 'emails.json');
const DRAFTS_FILE = path.join(process.cwd(), 'data', 'email-drafts.json');

const INITIAL_EMAILS: EmailMessage[] = [
  {
    id: 'msg-def-101',
    accountEmail: 'eighty7supreme@gmail.com',
    senderName: '146th Operations Group // CAANG',
    senderEmail: 'ops.146aw@ca.ang.af.mil',
    subject: '[ACTION REQUIRED] Mission Readiness Review & Cyber Airgap Attestation',
    snippet: 'Commander briefing confirmed for 14:00 Zulu tomorrow. Please verify local cryptographic airgap status...',
    body: `Major / Operator Symbrook,

The upcoming quarterly Readiness Review for the 146th Airlift Wing has been finalized on the schedule for 14:00 Zulu.
All tactical software engineering workstations are required to attest to zero-trust compliance under DISA STIG guidelines.

Required checklist:
1. Verify loopback-only binding on all local API daemons (127.0.0.1).
2. Attest to zero unauthorized WAN egress on LLM model weights.
3. Submit briefing packet or Antigravity audit summary prior to 12:00.

Respectfully,
Maj. K. Vance, Operations Officer
146th AW, California Air National Guard`,
    date: 'Today, 08:30',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    unread: true,
    priority: 'critical',
    labels: ['DoD', 'CAANG', 'Action Required'],
    suggestedAction: 'Draft compliance attestation reply via Gemini',
  },
  {
    id: 'msg-def-102',
    accountEmail: 'eighty7supreme@gmail.com',
    senderName: 'Google Cloud Defense Solutions',
    senderEmail: 'defense-announcements@google.com',
    subject: 'Gemini 3.8 Flash & Gemini 3.1 Pro Authorized for Sovereign Workloads',
    snippet: 'Your Google Account eighty7supreme@gmail.com has been granted high-context inference tier access...',
    body: `Operator,

Your active Google session (eighty7supreme@gmail.com) has successfully completed authorization for low-latency sovereign inference with Gemini 3.8 Flash and deep architectural reasoning with Gemini 3.1 Pro.

API quotas and rate parameters:
- Gemini 3.8 Flash: 1,000 RPM (Sub-300ms latency profile)
- Gemini 3.1 Pro: Extended context reasoning with tool execution
- Antigravity CLI Bridge: Verified active on Darwin ARM64

No action required unless custom IAM role delegations are requested.`,
    date: 'Yesterday, 17:15',
    timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
    unread: true,
    priority: 'high',
    labels: ['Google Cloud', 'AI Cognition'],
    suggestedAction: 'Verify model latency in AI Console',
  },
  {
    id: 'msg-sym-201',
    accountEmail: 'josh@symbrook.com',
    senderName: 'Atlas Labs // Platform Lead',
    senderEmail: 'elena@atlaslabs.io',
    subject: 'Feedback on Managed Growth Framework & Claude Skill Integration',
    snippet: 'Josh, reviewed the latest v1.0 draft in Google Drive. Overall alignment is strong, two quick questions...',
    body: `Hi Josh,

I went through the Managed Growth Framework v1.0 PDF in your Google Drive repository. The tier structure for the managed stack looks solid, particularly the automated workflow agents.

Two quick items before our Thursday sync:
1. Are we packaging the local model inference or relying exclusively on cloud API keys for client deployments?
2. Can we include an executive summary on zero-trust data privacy?

Let me know if you can send over a revised draft or thoughts before 15:00.

Best,
Elena Rostova | Atlas Labs`,
    date: 'Today, 10:45',
    timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
    unread: true,
    priority: 'high',
    labels: ['Symbrook Enterprise', 'Client', 'Atlas Labs'],
    suggestedAction: 'Draft reply confirming local airgap privacy model',
  },
  {
    id: 'msg-sym-202',
    accountEmail: 'josh@symbrook.com',
    senderName: 'Stripe Billing & Invoicing',
    senderEmail: 'invoices@stripe.com',
    subject: 'Monthly Payout Notice: $24,850.00 Dispatched to Symbrook LLC',
    snippet: 'Your scheduled transfer for enterprise software engineering retainers has been initiated...',
    body: `Hello Josh Symbrook,

Your scheduled payout of $24,850.00 USD for enterprise consulting & software retainer milestones has been deposited into your linked primary commercial account.

Transfer ID: po_1Qv49B87Symbrook
Expected Settlement: Tomorrow, 09:00 PST

View full ledger and tax breakdowns in your Stripe Dashboard.`,
    date: 'Sep 22, 14:00',
    timestamp: new Date(Date.now() - 3600000 * 36).toISOString(),
    unread: false,
    priority: 'normal',
    labels: ['Finance', 'Stripe'],
  },
  {
    id: 'msg-def-103',
    accountEmail: 'eighty7supreme@gmail.com',
    senderName: 'DARPA AI Red Team',
    senderEmail: 'redteam-bulletin@darpa.mil',
    subject: 'Vulnerability Bulletin: Local Daemon Binding & DNS Rebinding Defenses',
    snippet: 'Advisory on securing autonomous AI sidecars and loopback daemons against browser-based CSRF...',
    body: `UNCLASSIFIED // FOR OFFICIAL USE ONLY

Tactical developers deploying local agent sidecars must strictly adhere to:
1. Mandatory Sec-Fetch-Site and Origin filtering in reverse proxies and edge middleware.
2. Complete elimination of external interface binding (0.0.0.0 is strictly prohibited).
3. Parameterized execution of system binaries to mitigate CWE-78 command injection.

NEXUS-C2 operators: Ensure pen-test security verification is executed on all new builds.`,
    date: 'Sep 21, 11:20',
    timestamp: new Date(Date.now() - 3600000 * 55).toISOString(),
    unread: false,
    priority: 'high',
    labels: ['DoD', 'Security', 'Advisory'],
  },
];

export function getStoredEmails(): EmailMessage[] {
  try {
    if (fs.existsSync(EMAILS_FILE)) {
      return JSON.parse(fs.readFileSync(EMAILS_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Error reading emails.json:', err);
  }
  // Initialize with rich data if not exists
  saveStoredEmails(INITIAL_EMAILS);
  return INITIAL_EMAILS;
}

export function saveStoredEmails(emails: EmailMessage[]): void {
  try {
    const dir = path.dirname(EMAILS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(EMAILS_FILE, JSON.stringify(emails, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving emails.json:', err);
  }
}

export function getStoredDrafts(): EmailDraft[] {
  try {
    if (fs.existsSync(DRAFTS_FILE)) {
      return JSON.parse(fs.readFileSync(DRAFTS_FILE, 'utf-8'));
    }
  } catch {}
  return [];
}

export function saveStoredDrafts(drafts: EmailDraft[]): void {
  try {
    const dir = path.dirname(DRAFTS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DRAFTS_FILE, JSON.stringify(drafts, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving email-drafts.json:', err);
  }
}

export function markEmailRead(id: string, unread: boolean = false): EmailMessage[] {
  const emails = getStoredEmails();
  const updated = emails.map((e) => (e.id === id ? { ...e, unread } : e));
  saveStoredEmails(updated);
  return updated;
}

export function deleteEmail(id: string): EmailMessage[] {
  const emails = getStoredEmails();
  const updated = emails.filter((e) => e.id !== id);
  saveStoredEmails(updated);
  return updated;
}

export function saveDraft(draft: EmailDraft): EmailDraft[] {
  const drafts = getStoredDrafts();
  const filtered = drafts.filter((d) => d.id !== draft.id);
  const updated = [draft, ...filtered];
  saveStoredDrafts(updated);
  return updated;
}
