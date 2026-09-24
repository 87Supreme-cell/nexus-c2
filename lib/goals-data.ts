import { GoalItem, GoogleCalendarEvent, GoogleTaskItem, GmailAlert } from '@/types';

export const INITIAL_GOALS: GoalItem[] = [
  {
    id: 'goal-1',
    title: 'DOD SE VALIDATION: Antigravity Code Certification',
    description: 'Prove Antigravity agentic capability for defense-grade software architecture & implementation.',
    classification: 'MISSION CRITICAL',
    progress: 88,
    dueDate: '2026-10-01',
    status: 'in-progress',
    milestones: [
      { id: 'm1-1', text: 'Air-gapped local model verification (Ollama)', done: true },
      { id: 'm1-2', text: 'Chrome Apps & local runtime process supervision', done: true },
      { id: 'm1-3', text: 'Tactical C2 visualization & telemetry deck', done: true },
      { id: 'm1-4', text: 'Antigravity CLI headless build trigger integration', done: true },
      { id: 'm1-5', text: 'DoD architecture documentation & audit package', done: false },
    ],
  },
  {
    id: 'goal-2',
    title: 'AIRGAP AI CLUSTER: Local Ollama & Odysseus Bridge',
    description: 'Ensure all local AI inferences execute with zero outbound data egress when air-gap mode is active.',
    classification: 'SECRET',
    progress: 75,
    dueDate: '2026-10-15',
    status: 'in-progress',
    milestones: [
      { id: 'm2-1', text: 'Direct Ollama endpoint handshake (:11434)', done: true },
      { id: 'm2-2', text: 'Automatic tag discovery for 8B-12B models', done: true },
      { id: 'm2-3', text: 'Egress filter validation & token leakage safeguards', done: true },
      { id: 'm2-4', text: 'Odysseus agent coordination pipeline (:7860)', done: false },
    ],
  },
  {
    id: 'goal-3',
    title: 'GOOGLE WORKSPACE UNIFIED RADAR',
    description: 'Orchestrate Calendar, Tasks, Gmail, Drive & GCP through single pane of glass.',
    classification: 'CONFIDENTIAL',
    progress: 90,
    dueDate: '2026-09-30',
    status: 'in-progress',
    milestones: [
      { id: 'm3-1', text: 'OAuth 2.0 PKCE authentication handshake scaffolding', done: true },
      { id: 'm3-2', text: 'Live calendar schedule & task prioritization engine', done: true },
      { id: 'm3-3', text: 'NotebookLM deep linkage for intelligence research', done: true },
    ],
  },
];

export const INITIAL_CALENDAR_EVENTS: GoogleCalendarEvent[] = [
  {
    id: 'ev-1',
    title: 'DoD Software Engineering Readiness Review',
    startTime: '09:00',
    endTime: '10:00',
    status: 'confirmed',
    link: 'https://calendar.google.com/',
  },
  {
    id: 'ev-2',
    title: 'Antigravity Autonomous Agent Architecture Briefing',
    startTime: '11:30',
    endTime: '12:30',
    status: 'confirmed',
    link: 'https://calendar.google.com/',
  },
  {
    id: 'ev-3',
    title: 'Local Ollama & Odysseus Model Tuning Sync',
    startTime: '14:00',
    endTime: '15:00',
    status: 'tentative',
    link: 'https://calendar.google.com/',
  },
  {
    id: 'ev-4',
    title: 'GCP Cloud Run & Docker Cluster Inspection',
    startTime: '16:30',
    endTime: '17:15',
    status: 'confirmed',
    link: 'https://calendar.google.com/',
  },
];

export const INITIAL_GOOGLE_TASKS: GoogleTaskItem[] = [
  { id: 't-1', title: 'Verify zero-trust local model routing in Open WebUI', due: 'Today', completed: true },
  { id: 't-2', title: 'Compile DoD portfolio artifacts and architecture docs', due: 'Tomorrow', completed: false },
  { id: 't-3', title: 'Configure Google Workspace OAuth Client ID in .env.local', due: 'Friday', completed: false },
  { id: 't-4', title: 'Inspect Docker daemon socket permissions on macOS', due: 'Friday', completed: true },
];

export const INITIAL_GMAIL_ALERTS: GmailAlert[] = [
  {
    id: 'em-1',
    from: 'Google Cloud Platform <notifications@google.com>',
    subject: '[GCP Alert] Cloud Monitoring healthy across all regions',
    snippet: 'All monitored resources in your GCP projects are operating within expected thresholds...',
    date: '10 mins ago',
    unread: true,
    priority: 'normal',
  },
  {
    id: 'em-2',
    from: 'GitHub Security <security@github.com>',
    subject: 'Repository 87Supreme-cell: Dependabot status nominal',
    snippet: 'All automated security scans passed with zero critical advisories...',
    date: '1 hour ago',
    unread: true,
    priority: 'high',
  },
  {
    id: 'em-3',
    from: 'Defense Tech Digest <briefing@defensetech.mil>',
    subject: 'Next-Gen Agentic Architectures in Federal C2 Systems',
    snippet: 'Highlights on sovereign AI deployment, air-gapped LLMs, and Antigravity-driven workflows...',
    date: '3 hours ago',
    unread: false,
    priority: 'normal',
  },
];
