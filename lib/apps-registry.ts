import { AppItem } from '@/types';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'apps.json');

export const DEFAULT_APPS: AppItem[] = [
  // Local AI & Web Runtimes
  {
    id: 'open-webui',
    name: 'Open WebUI',
    description: 'Local LLM interface connected to Ollama runtime',
    category: 'ai-models',
    type: 'local-service',
    url: 'http://localhost:8080',
    port: 8080,
    status: 'online',
    icon: 'Bot',
    macAppPath: '/Users/symbrook/Applications/Chrome Apps.localized/Open WebUI.app',
    runCommand: 'bash /Users/symbrook/launch-openwebui.sh',
    isNativeChromeApp: true,
  },
  {
    id: 'odysseus',
    name: 'Odysseus',
    description: 'Autonomous agent runtime & cognitive interface',
    category: 'ai-models',
    type: 'local-service',
    url: 'http://127.0.0.1:7860',
    port: 7860,
    status: 'standby',
    icon: 'Compass',
    macAppPath: '/Users/symbrook/Applications/Chrome Apps.localized/Odysseus.app',
    runCommand: 'python3 /Users/symbrook/odysseus/main.py',
    isNativeChromeApp: true,
  },
  {
    id: 'ollama-daemon',
    name: 'Ollama Engine',
    description: 'Air-gapped local model inference server',
    category: 'ai-models',
    type: 'local-service',
    url: 'http://localhost:11434',
    port: 11434,
    status: 'online',
    icon: 'Cpu',
    runCommand: 'ollama serve',
  },
  {
    id: 'antigravity-builder',
    name: 'Antigravity (AGY)',
    description: 'Autonomous software engineering agent & CLI engine',
    category: 'local-dev',
    type: 'local-service',
    url: '#antigravity',
    status: 'online',
    icon: 'Terminal',
    runCommand: '/opt/homebrew/bin/agy',
  },
  {
    id: 'docker-engine',
    name: 'Docker Daemon',
    description: 'Containerized microservices & workload virtualization',
    category: 'docker',
    type: 'docker-container',
    url: 'http://localhost:2375',
    status: 'standby',
    icon: 'Boxes',
    runCommand: 'open -a Docker',
  },

  // Native Chrome Apps Detected
  {
    id: 'notebooklm',
    name: 'Google NotebookLM',
    description: 'Google AI research assistant & grounded source notebook',
    category: 'google-workspace',
    type: 'chrome-app',
    url: 'https://notebooklm.google.com/',
    status: 'online',
    icon: 'BookOpen',
    macAppPath: '/Users/symbrook/Applications/Chrome Apps.localized/NotebookLM.app',
    isNativeChromeApp: true,
  },
  {
    id: 'claude-app',
    name: 'Claude App',
    description: 'Anthropic AI assistant desktop environment',
    category: 'ai-models',
    type: 'chrome-app',
    url: 'https://claude.ai/',
    status: 'online',
    icon: 'Sparkles',
    macAppPath: '/Users/symbrook/Applications/Chrome Apps.localized/Claude.app',
    isNativeChromeApp: true,
  },
  {
    id: 'github-app',
    name: 'GitHub Portal',
    description: 'Source control, CI/CD pipelines & DoD repositories',
    category: 'local-dev',
    type: 'chrome-app',
    url: 'https://github.com/',
    status: 'online',
    icon: 'GitPullRequest',
    macAppPath: '/Users/symbrook/Applications/Chrome Apps.localized/GitHub.app',
    isNativeChromeApp: true,
  },
  {
    id: 'youtube-app',
    name: 'YouTube Knowledge',
    description: 'Technical briefings, intelligence & video research',
    category: 'google-workspace',
    type: 'chrome-app',
    url: 'https://youtube.com/',
    status: 'online',
    icon: 'Video',
    macAppPath: '/Users/symbrook/Applications/Chrome Apps.localized/YouTube.app',
    isNativeChromeApp: true,
  },

  // Google Workspace Suite Core
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Operations schedule, milestone briefings & agendas',
    category: 'google-workspace',
    type: 'url',
    url: 'https://calendar.google.com/',
    status: 'online',
    icon: 'Calendar',
  },
  {
    id: 'google-tasks',
    name: 'Google Tasks',
    description: 'Operational action items & synchronized to-dos',
    category: 'google-workspace',
    type: 'url',
    url: 'https://tasks.google.com/',
    status: 'online',
    icon: 'CheckSquare',
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    description: 'Secure cloud documentation & project repository',
    category: 'google-workspace',
    type: 'url',
    url: 'https://drive.google.com/',
    status: 'online',
    icon: 'FolderSync',
  },
  {
    id: 'gmail-ops',
    name: 'Gmail Comms',
    description: 'Secure communications & priority dispatch inbox',
    category: 'google-workspace',
    type: 'url',
    url: 'https://mail.google.com/',
    status: 'online',
    icon: 'Mail',
  },
  {
    id: 'gcp-console',
    name: 'Google Cloud Platform',
    description: 'Cloud Run, Kubernetes, IAM & Cloud Monitoring',
    category: 'google-workspace',
    type: 'url',
    url: 'https://console.cloud.google.com/',
    status: 'online',
    icon: 'Cloud',
  },
];

export function getStoredApps(): AppItem[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Failed reading custom apps file:', err);
  }
  return DEFAULT_APPS;
}

export function saveStoredApps(apps: AppItem[]): void {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(apps, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed saving apps file:', err);
  }
}
