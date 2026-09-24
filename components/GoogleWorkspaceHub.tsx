'use client';

import React, { useState } from 'react';
import { GoogleCalendarEvent, GoogleTaskItem, GmailAlert } from '@/types';
import { 
  Calendar, 
  CheckSquare, 
  Mail, 
  FolderSync, 
  ExternalLink, 
  Plus, 
  Sparkles, 
  BookOpen, 
  Cloud,
  FileText,
  Table,
  CheckCircle2,
  Clock,
  Trash2,
  Link,
  RefreshCw,
  UserCheck
} from 'lucide-react';
import { GoogleAccountConfig } from '@/lib/google-calendar-service';

interface GoogleWorkspaceHubProps {
  events: GoogleCalendarEvent[];
  tasks: GoogleTaskItem[];
  alerts: GmailAlert[];
  account: GoogleAccountConfig | null;
  onAddTask: (title: string) => void;
  onAddEvent: (title: string, startTime: string) => void;
  onDeleteEvent?: (id: string) => void;
  onOpenConnectModal: () => void;
  onRefreshCalendar: () => void;
}

export const GoogleWorkspaceHub: React.FC<GoogleWorkspaceHubProps> = ({
  events,
  tasks,
  alerts,
  account,
  onAddTask,
  onAddEvent,
  onDeleteEvent,
  onOpenConnectModal,
  onRefreshCalendar,
}) => {
  const [activeTab, setActiveTab] = useState<'calendar' | 'tasks' | 'gmail' | 'docs'>('calendar');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('14:00');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const accountIdx = account?.accountIndex ?? 0;
  const calendarBaseUrl = `https://calendar.google.com/calendar/u/${accountIdx}/r`;
  const gmailBaseUrl = `https://mail.google.com/mail/u/${accountIdx}/`;
  const driveBaseUrl = `https://drive.google.com/drive/u/${accountIdx}/`;

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    onAddTask(newTaskTitle.trim());
    setNewTaskTitle('');
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;
    onAddEvent(newEventTitle.trim(), newEventTime);
    setNewEventTitle('');
  };

  const handleManualSync = async () => {
    setIsRefreshing(true);
    await onRefreshCalendar();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <div className="rounded-2xl bg-c2-card border border-c2-border overflow-hidden shadow-2xl">
      {/* Top Banner & Account Status */}
      <div className="p-5 bg-c2-surface border-b border-c2-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-c2-green/10 border border-c2-green/30 text-c2-green">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-mono font-bold text-base text-white">GOOGLE WORKSPACE HUB</h2>
              {account?.connected ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-c2-green/15 text-c2-green border border-c2-green/40 font-mono font-bold flex items-center gap-1">
                  <UserCheck className="w-3 h-3" />
                  {account.email || 'CONNECTED'} (u/{accountIdx})
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-c2-amber/15 text-c2-amber border border-c2-amber/40 font-mono font-bold">
                  ACCOUNT NOT LINKED
                </span>
              )}
            </div>
            <p className="text-xs text-c2-textMuted font-mono mt-0.5">
              Integrated Calendar Schedule, Google Tasks, Gmail Dispatch & Google Drive Suite
            </p>
          </div>
        </div>

        {/* Account Connector & Live Sync Button */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenConnectModal}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
              account?.connected
                ? 'bg-c2-surface hover:bg-c2-surfaceHover border border-c2-green/40 text-c2-green shadow-green-glow'
                : 'bg-c2-green hover:bg-c2-green/90 text-c2-bg shadow-green-glow animate-pulse'
            }`}
          >
            <Link className="w-3.5 h-3.5" />
            <span>{account?.connected ? 'ACCOUNT SETTINGS' : 'CONNECT GOOGLE ACCOUNT'}</span>
          </button>

          <a
            href={calendarBaseUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-c2-bg hover:bg-c2-surfaceHover border border-c2-border text-xs font-mono text-white transition-all"
            title="Open Google Calendar directly in browser"
          >
            <span>LAUNCH WEB CALENDAR</span>
            <ExternalLink className="w-3.5 h-3.5 text-c2-cyan" />
          </a>
        </div>
      </div>

      {/* Subnav Navigation Bar */}
      <div className="px-5 py-3 bg-c2-bg border-b border-c2-border flex flex-wrap items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-c2-surface p-1 rounded-xl border border-c2-border">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'calendar'
                ? 'bg-c2-green text-c2-bg shadow-green-glow'
                : 'text-c2-textMuted hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>CALENDAR ({events.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'tasks'
                ? 'bg-c2-green text-c2-bg shadow-green-glow'
                : 'text-c2-textMuted hover:text-white'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>TASKS ({tasks.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('gmail')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'gmail'
                ? 'bg-c2-green text-c2-bg shadow-green-glow'
                : 'text-c2-textMuted hover:text-white'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>GMAIL TRIAGE ({alerts.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'docs'
                ? 'bg-c2-green text-c2-bg shadow-green-glow'
                : 'text-c2-textMuted hover:text-white'
            }`}
          >
            <FolderSync className="w-4 h-4" />
            <span>DRIVE SUITE</span>
          </button>
        </div>

        {activeTab === 'calendar' && (
          <button
            onClick={handleManualSync}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-c2-surface hover:bg-c2-surfaceHover border border-c2-border text-xs font-mono text-c2-textMuted hover:text-c2-green transition-all"
            title="Refresh and sync events"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-c2-green' : ''}`} />
            <span>SYNC FEED</span>
          </button>
        )}
      </div>

      {/* Main Tab Workspace Content */}
      <div className="p-6">
        {/* ===================== TAB 1: CALENDAR ===================== */}
        {activeTab === 'calendar' && (
          <div className="space-y-6">
            {!account?.connected && (
              <div className="p-4 rounded-xl bg-c2-green/5 border border-c2-green/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-mono font-bold text-xs text-c2-green flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    CONNECT YOUR LIVE GOOGLE CALENDAR
                  </h4>
                  <p className="text-xs text-c2-textMuted font-sans mt-0.5">
                    Sync your personal or work Google Calendar via secret iCal link or OAuth to view your actual schedule here.
                  </p>
                </div>
                <button
                  onClick={onOpenConnectModal}
                  className="px-3.5 py-1.5 rounded-lg bg-c2-green text-c2-bg font-mono font-bold text-xs whitespace-nowrap shadow-green-glow"
                >
                  Link Calendar Now
                </button>
              </div>
            )}

            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="p-4 rounded-xl bg-c2-surface border border-c2-border hover:border-c2-green/40 transition-all flex flex-col justify-between group shadow-md hover:shadow-green-glow"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono text-c2-green mb-2">
                      <span className="flex items-center gap-1.5 font-bold">
                        <Clock className="w-3.5 h-3.5" />
                        {event.startTime} - {event.endTime}
                      </span>
                      <span className="capitalize text-[10px] px-2 py-0.5 rounded-full bg-c2-green/10 border border-c2-green/20">
                        {event.status}
                      </span>
                    </div>
                    <h4 className="font-mono font-bold text-sm text-white line-clamp-2 mb-1">
                      {event.title}
                    </h4>
                  </div>

                  <div className="pt-4 border-t border-c2-border/60 flex items-center justify-between gap-2 mt-3">
                    <a
                      href={calendarBaseUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-mono text-c2-cyan hover:underline"
                    >
                      Open in Calendar
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    {onDeleteEvent && (
                      <button
                        onClick={() => onDeleteEvent(event.id)}
                        className="p-1 rounded text-c2-textMuted hover:text-c2-red transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete event"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Add Event Form */}
            <div className="p-4 rounded-xl bg-c2-surface border border-c2-border">
              <span className="text-xs font-mono text-c2-textMuted uppercase font-bold block mb-2">
                SCHEDULE NEW BRIEFING / EVENT
              </span>
              <form onSubmit={handleCreateEvent} className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="Event title or briefing description..."
                  className="flex-1 min-w-[240px] bg-c2-bg border border-c2-border rounded-lg px-3.5 py-2 text-xs font-mono text-white placeholder-c2-textMuted focus:outline-none focus:border-c2-green"
                />
                <input
                  type="time"
                  value={newEventTime}
                  onChange={(e) => setNewEventTime(e.target.value)}
                  className="bg-c2-bg border border-c2-border rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-c2-green"
                />
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-c2-green text-c2-bg text-xs font-mono font-bold transition-all shadow-green-glow hover:bg-c2-green/90"
                >
                  <Plus className="w-4 h-4" />
                  <span>ADD TO CALENDAR</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ===================== TAB 2: TASKS ===================== */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3.5 rounded-xl bg-c2-surface border border-c2-border flex items-center justify-between gap-3 shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className={`w-4 h-4 ${task.completed ? 'text-c2-green' : 'text-c2-textMuted'}`} />
                    <div>
                      <span className={`text-xs font-mono block ${task.completed ? 'line-through text-c2-textMuted' : 'text-white font-medium'}`}>
                        {task.title}
                      </span>
                      {task.due && <span className="text-[10px] font-mono text-c2-cyan">Due: {task.due}</span>}
                    </div>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    task.completed ? 'bg-c2-green/10 border-c2-green/30 text-c2-green' : 'bg-c2-amber/10 border-c2-amber/30 text-c2-amber'
                  }`}>
                    {task.completed ? 'DONE' : 'PENDING'}
                  </span>
                </div>
              ))}
            </div>

            {/* Quick Add Task */}
            <form onSubmit={handleCreateTask} className="flex items-center gap-2 pt-2">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Log a new task into Google Tasks..."
                className="flex-1 bg-c2-surface border border-c2-border rounded-lg px-3.5 py-2 text-xs font-mono text-white placeholder-c2-textMuted focus:outline-none focus:border-c2-green"
              />
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-c2-green text-c2-bg text-xs font-mono font-bold transition-all shadow-green-glow"
              >
                <Plus className="w-4 h-4" />
                <span>ADD TASK</span>
              </button>
            </form>
          </div>
        )}

        {/* ===================== TAB 3: GMAIL ===================== */}
        {activeTab === 'gmail' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-mono text-c2-textMuted uppercase font-bold">PRIORITY INBOX DISPATCH</span>
              <a
                href={gmailBaseUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-mono text-c2-cyan hover:underline"
              >
                Open Gmail ({account?.email || 'Default Account'})
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-4 rounded-xl bg-c2-surface border border-c2-border hover:border-c2-green/30 transition-all flex items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-white">{alert.from}</span>
                    <span className="text-[10px] font-mono text-c2-textMuted">{alert.date}</span>
                    {alert.priority === 'high' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-c2-red/10 border border-c2-red/30 text-c2-red font-mono font-bold">
                        HIGH PRIORITY
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-mono text-c2-cyan font-semibold">{alert.subject}</h4>
                  <p className="text-xs text-c2-textMuted font-sans">{alert.snippet}</p>
                </div>
                <a
                  href={gmailBaseUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-c2-bg hover:bg-c2-surfaceHover border border-c2-border text-xs font-mono text-c2-textMuted hover:text-white flex items-center gap-1.5"
                >
                  <span>Open</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        )}

        {/* ===================== TAB 4: DRIVE SUITE ===================== */}
        {activeTab === 'docs' && (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { name: 'Google Drive', url: driveBaseUrl, icon: FolderSync, desc: 'Cloud storage & repos' },
                { name: 'Google Docs', url: `https://docs.google.com/document/u/${accountIdx}/`, icon: FileText, desc: 'Technical specifications' },
                { name: 'Google Sheets', url: `https://docs.google.com/spreadsheets/u/${accountIdx}/`, icon: Table, desc: 'Matrices & telemetry' },
                { name: 'NotebookLM', url: 'https://notebooklm.google.com/', icon: BookOpen, desc: 'AI research notebook' },
                { name: 'Google Cloud (GCP)', url: 'https://console.cloud.google.com/', icon: Cloud, desc: 'Infrastructure & IAM' },
                { name: 'Google Keep', url: `https://keep.google.com/u/${accountIdx}/`, icon: CheckSquare, desc: 'Tactical scratchpad' },
              ].map((tool) => {
                const ToolIcon = tool.icon;
                return (
                  <a
                    key={tool.name}
                    href={tool.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-4 rounded-xl bg-c2-surface border border-c2-border hover:border-c2-green/40 hover:bg-c2-surfaceHover transition-all flex flex-col items-center text-center group shadow-md"
                  >
                    <ToolIcon className="w-8 h-8 text-c2-green mb-2.5 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-mono font-bold text-white group-hover:text-c2-green">
                      {tool.name}
                    </span>
                    <span className="text-[10px] font-mono text-c2-textMuted mt-1">{tool.desc}</span>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
