import fs from 'fs';
import path from 'path';

export interface TaskItem {
  id: string;
  title: string;
  due: string;
  completed: boolean;
  accountEmail: string;
  accountSlot: number;
  priority?: 'critical' | 'high' | 'medium' | 'low';
}

const TASKS_FILE = path.join(process.cwd(), 'data', 'google-tasks.json');

const INITIAL_REAL_TASKS: TaskItem[] = [
  {
    id: 't-supreme-1',
    title: 'Verify CAANG Reenlistment medical waiver status with 146th Airlift Wing',
    due: 'Thursday 14:30',
    completed: false,
    accountEmail: 'eighty7supreme@gmail.com',
    accountSlot: 0,
    priority: 'critical',
  },
  {
    id: 't-supreme-2',
    title: 'Review Antigravity CLI zero-trust airgap security posture for pen-test report',
    due: 'Today',
    completed: false,
    accountEmail: 'eighty7supreme@gmail.com',
    accountSlot: 0,
    priority: 'high',
  },
  {
    id: 't-supreme-3',
    title: 'Audit local model inference endpoints across Ollama, MLX, and LM Studio',
    due: 'Tomorrow',
    completed: true,
    accountEmail: 'eighty7supreme@gmail.com',
    accountSlot: 0,
    priority: 'medium',
  },
  {
    id: 't-symbrook-1',
    title: 'Review Atlas Labs Service Delivery Framework: Managed Growth v1.0',
    due: 'Friday',
    completed: false,
    accountEmail: 'josh@symbrook.com',
    accountSlot: 1,
    priority: 'high',
  },
  {
    id: 't-symbrook-2',
    title: 'Finalize Managed Growth Stack pricing model PDF in Google Drive',
    due: 'Next Week',
    completed: false,
    accountEmail: 'josh@symbrook.com',
    accountSlot: 1,
    priority: 'medium',
  },
  {
    id: 't-symbrook-3',
    title: 'Update Claude Skill Intake Form and SMX v1.0 standard specs',
    due: 'Next Week',
    completed: true,
    accountEmail: 'josh@symbrook.com',
    accountSlot: 1,
    priority: 'low',
  },
];

export function getStoredTasks(): TaskItem[] {
  try {
    if (fs.existsSync(TASKS_FILE)) {
      const data = JSON.parse(fs.readFileSync(TASKS_FILE, 'utf-8'));
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.error('Error reading google-tasks.json:', err);
  }
  saveStoredTasks(INITIAL_REAL_TASKS);
  return INITIAL_REAL_TASKS;
}

export function saveStoredTasks(tasks: TaskItem[]): void {
  try {
    const dir = path.dirname(TASKS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving google-tasks.json:', err);
  }
}

export function addTask(title: string, accountEmail = 'eighty7supreme@gmail.com'): TaskItem {
  const tasks = getStoredTasks();
  const isSymbrook = accountEmail.includes('symbrook');
  const newTask: TaskItem = {
    id: `task-${Date.now()}`,
    title,
    due: 'Today',
    completed: false,
    accountEmail,
    accountSlot: isSymbrook ? 1 : 0,
    priority: 'high',
  };
  const updated = [newTask, ...tasks];
  saveStoredTasks(updated);
  return newTask;
}

export function toggleTask(taskId: string): TaskItem | null {
  const tasks = getStoredTasks();
  let modified: TaskItem | null = null;
  const updated = tasks.map((t) => {
    if (t.id === taskId) {
      modified = { ...t, completed: !t.completed };
      return modified;
    }
    return t;
  });
  saveStoredTasks(updated);
  return modified;
}

export function deleteTask(taskId: string): boolean {
  const tasks = getStoredTasks();
  const updated = tasks.filter((t) => t.id !== taskId);
  saveStoredTasks(updated);
  return true;
}
