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
  AlertCircle
} from 'lucide-react';

interface GoogleWorkspaceHubProps {
  events: GoogleCalendarEvent[];
  tasks: GoogleTaskItem[];
  alerts: GmailAlert[];
  onAddTask: (title: string) => void;
  onAddEvent: (title: string, startTime: string) => void;
  oauthConfigured: boolean;
}

export const GoogleWorkspaceHub: React.FC<GoogleWorkspaceHubProps> = ({
  events,
  tasks,
  alerts,
  onAddTask,
  onAddEvent,
  oauthConfigured,
}) => {
  const [activeTab, setActiveTab] = useState<'calendar' | 'tasks' | 'gmail' | 'docs'>('calendar');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('14:00');

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

  return (
    <div className="rounded-xl bg-c2-card border border-c2-border overflow-hidden mb-8 shadow-xl">
      {/* Top Banner */}
      <div className="p-4 bg-c2-surface border-b border-c2-border flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-c2-green/10 border border-c2-green/30 text-c2-green">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-mono font-bold text-sm text-white flex items-center gap-2">
              GOOGLE WORKSPACE MISSION RADAR
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                oauthConfigured ? 'bg-c2-green/20 text-c2-green border border-c2-green/40' : 'bg-c2-cyan/10 text-c2-cyan border border-c2-cyan/30'
              }`}>
                {oauthConfigured ? 'OAUTH SYNC ACTIVE' : 'LOCAL HUB READY'}
              </span>
            </h2>
            <p className="text-xs text-c2-textMuted font-mono">Synchronized Calendar, Tasks, Gmail Triage & Drive Ecosystem</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-c2-bg p-1 rounded-lg border border-c2-border">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
              activeTab === 'calendar' ? 'bg-c2-green text-c2-bg font-bold shadow-green-glow' : 'text-c2-textMuted hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Calendar</span>
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
              activeTab === 'tasks' ? 'bg-c2-green text-c2-bg font-bold shadow-green-glow' : 'text-c2-textMuted hover:text-white'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Tasks</span>
          </button>
          <button
            onClick={() => setActiveTab('gmail')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
              activeTab === 'gmail' ? 'bg-c2-green text-c2-bg font-bold shadow-green-glow' : 'text-c2-textMuted hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Gmail Triage</span>
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
              activeTab === 'docs' ? 'bg-c2-green text-c2-bg font-bold shadow-green-glow' : 'text-c2-textMuted hover:text-white'
            }`}
          >
            <FolderSync className="w-3.5 h-3.5" />
            <span>Drive Suite</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {/* TAB 1: CALENDAR */}
        {activeTab === 'calendar' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="p-3.5 rounded-lg bg-c2-surface border border-c2-border hover:border-c2-green/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-c2-green mb-1.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {event.startTime} - {event.endTime}
                      </span>
                      <span className="capitalize text-[10px] px-1.5 py-0.5 rounded bg-c2-green/10 border border-c2-green/20">
                        {event.status}
                      </span>
                    </div>
                    <h4 className="font-mono font-bold text-xs text-white line-clamp-2">
                      {event.title}
                    </h4>
                  </div>
                  <a
                    href="https://calendar.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-[11px] font-mono text-c2-cyan hover:underline"
                  >
                    Open in Google Calendar
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>

            {/* Quick Add Event Form */}
            <form onSubmit={handleCreateEvent} className="flex flex-wrap items-center gap-2 pt-2 border-t border-c2-border">
              <input
                type="text"
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                placeholder="Schedule new briefing or meeting..."
                className="flex-1 min-w-[200px] bg-c2-surface border border-c2-border rounded-lg px-3 py-1.5 text-xs font-mono text-white placeholder-c2-textMuted focus:outline-none focus:border-c2-green"
              />
              <input
                type="time"
                value={newEventTime}
                onChange={(e) => setNewEventTime(e.target.value)}
                className="bg-c2-surface border border-c2-border rounded-lg px-2 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-c2-green"
              />
              <button
                type="submit"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-c2-green/20 hover:bg-c2-green/30 border border-c2-green text-c2-green text-xs font-mono font-bold transition-all shadow-green-glow"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ADD EVENT</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: GOOGLE TASKS */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3 rounded-lg bg-c2-surface border border-c2-border flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className={`w-4 h-4 ${task.completed ? 'text-c2-green' : 'text-c2-textMuted'}`} />
                    <div>
                      <span className={`text-xs font-mono block ${task.completed ? 'line-through text-c2-textMuted' : 'text-white'}`}>
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

            {/* Quick Add Task Form */}
            <form onSubmit={handleCreateTask} className="flex items-center gap-2 pt-2 border-t border-c2-border">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Log a new task into Google Tasks..."
                className="flex-1 bg-c2-surface border border-c2-border rounded-lg px-3 py-1.5 text-xs font-mono text-white placeholder-c2-textMuted focus:outline-none focus:border-c2-green"
              />
              <button
                type="submit"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-c2-green/20 hover:bg-c2-green/30 border border-c2-green text-c2-green text-xs font-mono font-bold transition-all shadow-green-glow"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ADD TASK</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: GMAIL TRIAGE */}
        {activeTab === 'gmail' && (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3 rounded-lg bg-c2-surface border border-c2-border hover:border-c2-green/30 transition-all flex items-start justify-between gap-4"
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
                  href="https://mail.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded bg-c2-bg hover:bg-c2-surfaceHover border border-c2-border text-[11px] font-mono text-c2-textMuted hover:text-white flex items-center gap-1"
                >
                  <span>Open</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: DRIVE SUITE */}
        {activeTab === 'docs' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { name: 'Google Drive', url: 'https://drive.google.com', icon: FolderSync, desc: 'Cloud storage' },
              { name: 'Google Docs', url: 'https://docs.google.com', icon: FileText, desc: 'Specifications' },
              { name: 'Google Sheets', url: 'https://sheets.google.com', icon: Table, desc: 'Data matrices' },
              { name: 'NotebookLM', url: 'https://notebooklm.google.com', icon: BookOpen, desc: 'AI research' },
              { name: 'Google Cloud (GCP)', url: 'https://console.cloud.google.com', icon: Cloud, desc: 'Infrastructure' },
              { name: 'Google Keep', url: 'https://keep.google.com', icon: CheckSquare, desc: 'Quick scratchpad' },
            ].map((tool) => {
              const ToolIcon = tool.icon;
              return (
                <a
                  key={tool.name}
                  href={tool.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 rounded-lg bg-c2-surface border border-c2-border hover:border-c2-green/40 hover:bg-c2-surfaceHover transition-all flex flex-col items-center text-center group"
                >
                  <ToolIcon className="w-6 h-6 text-c2-green mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-mono font-bold text-white group-hover:text-c2-green">
                    {tool.name}
                  </span>
                  <span className="text-[10px] font-mono text-c2-textMuted mt-0.5">{tool.desc}</span>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
