export type AppCategory = 
  | 'all'
  | 'ai-models' 
  | 'google-workspace' 
  | 'local-dev' 
  | 'docker' 
  | 'system';

export type AppType = 
  | 'chrome-app' 
  | 'local-service' 
  | 'docker-container' 
  | 'url';

export type AppStatus = 'online' | 'standby' | 'offline' | 'error';

export interface AppItem {
  id: string;
  name: string;
  description: string;
  category: AppCategory;
  type: AppType;
  url: string;
  port?: number;
  status: AppStatus;
  pingMs?: number;
  icon: string;
  runCommand?: string;
  stopCommand?: string;
  dockerContainerId?: string;
  macAppPath?: string;
  isNativeChromeApp?: boolean;
}

export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  status: string;
  state: 'running' | 'exited' | 'paused' | 'created';
  ports: string;
}

export interface OllamaModel {
  name: string;
  size: string;
  modified_at?: string;
  source?: 'ollama' | 'lmstudio' | 'mlx' | 'huggingface';
  format?: string;
  path?: string;
}

export type LocalModelInfo = OllamaModel;

export interface GoalMilestone {
  id: string;
  text: string;
  done: boolean;
}

export interface GoalItem {
  id: string;
  title: string;
  description: string;
  classification: 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'MISSION CRITICAL';
  progress: number;
  milestones: GoalMilestone[];
  dueDate: string;
  status: 'in-progress' | 'completed' | 'on-hold';
}

export interface GoogleCalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'tentative';
  link?: string;
  accountEmail?: string;
  accountSlot?: number;
  calendarName?: string;
  isAllDay?: boolean;
}

export interface GoogleTaskItem {
  id: string;
  title: string;
  due?: string;
  completed: boolean;
  accountEmail?: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
}

export interface GmailAlert {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  date?: string;
  time?: string;
  unread: boolean;
  priority?: 'high' | 'normal';
  accountEmail?: string;
  accountSlot?: number;
  directUrl?: string;
}

export interface SystemTelemetry {
  cpuLoad: number;
  memoryUsedGB: number;
  memoryTotalGB: number;
  uptimeSeconds: number;
  hostname: string;
  airgapStatus: 'AIRGAP_STRICT' | 'HYBRID_EGRESS' | 'CLOUD_AUTHORIZED';
  activeServicesCount: number;
  ollamaRunning: boolean;
  dockerRunning: boolean;
  antigravityDetected: boolean;
}

export type OperationalMode = 'defense-c2' | 'enterprise' | 'unified';

export type TabSpace = 
  | 'dashboard'
  | 'inbox'
  | 'calendar'
  | 'tasks'
  | 'workspace'
  | 'cognition'
  | 'security';

export type AnalysisDomain = 'calendar' | 'drive' | 'security' | 'cognition' | 'briefing';

export interface AiAnalysisReport {
  id: string;
  domain: AnalysisDomain;
  title: string;
  timestamp: string;
  threatLevel: 'NOMINAL' | 'ELEVATED' | 'HIGH' | 'CRITICAL' | 'OPTIMAL';
  executiveSummary: string;
  insights: string[];
  actionItems: string[];
  analyzedItemCount: number;
  model: string;
  authType: string;
}
