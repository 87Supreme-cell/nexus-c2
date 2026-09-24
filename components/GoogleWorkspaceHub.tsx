'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  UserCheck,
  Search,
  Folder,
  Shield,
  Laptop,
  ArrowUpRight,
  HardDrive,
  Eye,
  AlertTriangle,
  Check,
  Layers,
  Users,
  Presentation,
  FileCode,
  FileSpreadsheet
} from 'lucide-react';
import { GoogleAccountConfig } from '@/lib/google-calendar-service';
import { DriveDocumentItem } from '@/lib/google-drive-bridge';

type AccountFilter = 'all' | 'eighty7supreme@gmail.com' | 'josh@symbrook.com';
type HubTab = 'calendar' | 'drive' | 'gmail' | 'tasks' | 'suite';

interface GoogleWorkspaceHubProps {
  events: GoogleCalendarEvent[];
  tasks: GoogleTaskItem[];
  alerts: GmailAlert[];
  account: GoogleAccountConfig | null;
  onAddTask: (title: string, accountEmail?: string) => void;
  onAddEvent: (title: string, startTime: string) => void;
  onDeleteEvent?: (id: string) => void;
  onOpenConnectModal: () => void;
  onRefreshCalendar: () => void;
}

export const GoogleWorkspaceHub: React.FC<GoogleWorkspaceHubProps> = ({
  events: initialEvents,
  tasks: initialTasks,
  alerts: initialAlerts,
  account,
  onAddTask,
  onAddEvent,
  onDeleteEvent,
  onOpenConnectModal,
  onRefreshCalendar,
}) => {
  const [activeTab, setActiveTab] = useState<HubTab>('calendar');
  const [accountFilter, setAccountFilter] = useState<AccountFilter>('all');
  
  // Local task and event states for immediate optimistic updates
  const [localTasks, setLocalTasks] = useState<GoogleTaskItem[]>(initialTasks);
  const [localEvents, setLocalEvents] = useState<GoogleCalendarEvent[]>(initialEvents);
  const [localAlerts, setLocalAlerts] = useState<GmailAlert[]>(initialAlerts);

  // Form inputs
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAccount, setNewTaskAccount] = useState<'eighty7supreme@gmail.com' | 'josh@symbrook.com'>('eighty7supreme@gmail.com');
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('14:00');
  
  // Drive state
  const [driveFiles, setDriveFiles] = useState<DriveDocumentItem[]>([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveSearch, setDriveSearch] = useState('');
  const [driveCategory, setDriveCategory] = useState<'all' | 'document' | 'spreadsheet' | 'folder' | 'pdf'>('all');
  const [driveActionNotice, setDriveActionNotice] = useState<string | null>(null);

  // Sync state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [launchNotice, setLaunchNotice] = useState<string | null>(null);

  // Sync prop changes into local state
  useEffect(() => {
    setLocalTasks(initialTasks);
  }, [initialTasks]);

  useEffect(() => {
    setLocalEvents(initialEvents);
  }, [initialEvents]);

  useEffect(() => {
    setLocalAlerts(initialAlerts);
  }, [initialAlerts]);

  // Fetch Google Drive synced files from local desktop bridge
  const fetchDriveFiles = useCallback(async () => {
    setDriveLoading(true);
    try {
      const res = await fetch('/api/google/drive');
      if (res.ok) {
        const data = await res.json();
        if (data.files && Array.isArray(data.files)) {
          setDriveFiles(data.files);
        }
      }
    } catch (err) {
      console.error('Failed fetching Google Drive files:', err);
    } finally {
      setDriveLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDriveFiles();
  }, [fetchDriveFiles]);

  // Handle revealing a Google Drive file in Finder
  const handleRevealInFinder = async (filePath: string, fileName: string) => {
    try {
      setDriveActionNotice(`Revealing "${fileName}" in macOS Finder...`);
      const res = await fetch('/api/google/drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reveal', path: filePath }),
      });
      const data = await res.json();
      if (data.success) {
        setDriveActionNotice(`Highlighted "${fileName}" in Finder`);
      } else {
        setDriveActionNotice(`Could not reveal file: ${data.message || 'Error'}`);
      }
    } catch {
      setDriveActionNotice(`Error communicating with Finder bridge`);
    } finally {
      setTimeout(() => setDriveActionNotice(null), 4000);
    }
  };

  // Handle opening a Google Drive file directly
  const handleOpenFile = async (filePath: string, fileName: string) => {
    try {
      setDriveActionNotice(`Opening "${fileName}"...`);
      const res = await fetch('/api/google/drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'open', path: filePath }),
      });
      const data = await res.json();
      if (data.success) {
        setDriveActionNotice(`Opened "${fileName}"`);
      } else {
        setDriveActionNotice(`Could not open file: ${data.message || 'Error'}`);
      }
    } catch {
      setDriveActionNotice(`Error opening file`);
    } finally {
      setTimeout(() => setDriveActionNotice(null), 4000);
    }
  };

  // Launch macOS Calendar app directly
  const handleOpenAppleCalendar = async () => {
    try {
      setLaunchNotice('Launching macOS Calendar.app...');
      const res = await fetch('/api/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'open-calendar-app' }),
      });
      const data = await res.json();
      if (data.success) {
        setLaunchNotice('Opened macOS Calendar.app');
      }
    } catch {
      setLaunchNotice('Failed to launch Calendar.app');
    } finally {
      setTimeout(() => setLaunchNotice(null), 3500);
    }
  };

  // Toggle task status
  const handleToggleTask = async (taskId: string) => {
    setLocalTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
    try {
      await fetch('/api/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle-task', taskId }),
      });
    } catch (err) {
      console.error('Error toggling task:', err);
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    setLocalTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await fetch('/api/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete-task', taskId }),
      });
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  // Create new task with account assignment
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const title = newTaskTitle.trim();
    setNewTaskTitle('');

    // Optimistic item
    const tempId = `t-${Date.now()}`;
    const optimisticTask: GoogleTaskItem = {
      id: tempId,
      title,
      due: 'Today',
      completed: false,
      accountEmail: newTaskAccount,
    };
    setLocalTasks((prev) => [optimisticTask, ...prev]);

    try {
      const res = await fetch('/api/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add-task',
          item: { title, accountEmail: newTaskAccount },
        }),
      });
      const data = await res.json();
      if (data.task) {
        setLocalTasks((prev) => prev.map((t) => (t.id === tempId ? data.task : t)));
      }
    } catch (err) {
      console.error('Error adding task:', err);
    }
  };

  // Create new calendar briefing / event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;
    const title = newEventTitle.trim();
    setNewEventTitle('');
    onAddEvent(title, newEventTime);
  };

  // Refresh both Google calendar and drive
  const handleManualSync = async () => {
    setIsRefreshing(true);
    await Promise.all([onRefreshCalendar(), fetchDriveFiles()]);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  // Filtered views based on selected account
  const filteredEvents = useMemo(() => {
    if (accountFilter === 'all') return localEvents;
    return localEvents.filter(
      (e) => (e.accountEmail || 'eighty7supreme@gmail.com') === accountFilter
    );
  }, [localEvents, accountFilter]);

  const filteredTasks = useMemo(() => {
    if (accountFilter === 'all') return localTasks;
    return localTasks.filter(
      (t) => (t.accountEmail || 'eighty7supreme@gmail.com') === accountFilter
    );
  }, [localTasks, accountFilter]);

  const filteredAlerts = useMemo(() => {
    if (accountFilter === 'all') return localAlerts;
    return localAlerts.filter(
      (a) => (a.accountEmail || 'eighty7supreme@gmail.com') === accountFilter
    );
  }, [localAlerts, accountFilter]);

  const filteredDriveFiles = useMemo(() => {
    return driveFiles.filter((file) => {
      const matchesSearch =
        !driveSearch.trim() ||
        file.name.toLowerCase().includes(driveSearch.toLowerCase()) ||
        file.category.toLowerCase().includes(driveSearch.toLowerCase());
      const matchesCategory =
        driveCategory === 'all' || file.category === driveCategory;
      return matchesSearch && matchesCategory;
    });
  }, [driveFiles, driveSearch, driveCategory]);

  return (
    <div className="rounded-2xl bg-c2-card border border-c2-border overflow-hidden shadow-2xl">
      {/* ==================== 1. TOP DUAL-ACCOUNT COMMAND HUD ==================== */}
      <div className="p-5 bg-c2-surface border-b border-c2-border flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-c2-cyan/10 border border-c2-cyan/30 text-c2-cyan">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-mono font-bold text-base text-white tracking-wide">
                GOOGLE WORKSPACE C2 COMMAND
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-c2-green/15 text-c2-green border border-c2-green/40 font-mono font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-c2-green animate-pulse" />
                DUAL ACCOUNTS LINKED
              </span>
            </div>
            <p className="text-xs text-c2-textMuted font-mono mt-0.5">
              Live macOS Calendar Bridge &bull; Synced Google Drive &bull; Priority Gmail &bull; Google Tasks
            </p>
          </div>
        </div>

        {/* Quick Launch & External Bridge Action Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleOpenAppleCalendar}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-c2-bg hover:bg-c2-surfaceHover border border-c2-border text-xs font-mono text-white transition-all shadow-sm"
            title="Open macOS Calendar.app natively"
          >
            <Calendar className="w-3.5 h-3.5 text-c2-cyan" />
            <span>OPEN APPLE CALENDAR</span>
          </button>

          <a
            href="https://drive.google.com/drive/u/1/my-drive"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-c2-bg hover:bg-c2-surfaceHover border border-c2-border text-xs font-mono text-white transition-all shadow-sm"
            title="Open Google Drive directly in browser"
          >
            <FolderSync className="w-3.5 h-3.5 text-c2-green" />
            <span>CLOUD DRIVE (u/1)</span>
            <ExternalLink className="w-3 h-3 text-c2-textMuted" />
          </a>

          <button
            onClick={handleManualSync}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-c2-green/10 hover:bg-c2-green/20 border border-c2-green/30 text-xs font-mono font-bold text-c2-green transition-all shadow-green-glow"
            title="Force refresh live calendars and drive files"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>SYNC DATA</span>
          </button>
        </div>
      </div>

      {/* Action Notification Toast */}
      {(driveActionNotice || launchNotice) && (
        <div className="bg-c2-cyan/10 border-b border-c2-cyan/30 px-5 py-2 flex items-center justify-between text-xs font-mono text-c2-cyan animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-c2-cyan animate-pulse" />
            <span>{driveActionNotice || launchNotice}</span>
          </div>
          <span className="text-[10px] text-c2-textMuted">macOS Bridge Active</span>
        </div>
      )}

      {/* ==================== 2. DUAL-ACCOUNT FILTER BAR ==================== */}
      <div className="px-5 py-2.5 bg-c2-bg border-b border-c2-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-c2-textMuted font-bold uppercase flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-c2-cyan" />
            SELECT ACTIVE ACCOUNT:
          </span>
          <div className="flex items-center gap-1.5 bg-c2-surface p-1 rounded-xl border border-c2-border">
            <button
              onClick={() => setAccountFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                accountFilter === 'all'
                  ? 'bg-c2-cyan text-c2-bg shadow-cyan-glow'
                  : 'text-c2-textMuted hover:text-white'
              }`}
            >
              UNIFIED COMMAND (ALL)
            </button>

            <button
              onClick={() => setAccountFilter('eighty7supreme@gmail.com')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                accountFilter === 'eighty7supreme@gmail.com'
                  ? 'bg-c2-cyan text-c2-bg shadow-cyan-glow'
                  : 'text-c2-cyan hover:bg-c2-cyan/10'
              }`}
              title="Slot u/0 — CAANG 146th Airlift Wing, DoD, Antigravity OAuth"
            >
              <span className="w-2 h-2 rounded-full bg-c2-cyan" />
              <span>eighty7supreme@gmail.com</span>
              <span className="text-[10px] opacity-75 font-normal">(u/0 · Defense)</span>
            </button>

            <button
              onClick={() => setAccountFilter('josh@symbrook.com')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                accountFilter === 'josh@symbrook.com'
                  ? 'bg-c2-green text-c2-bg shadow-green-glow'
                  : 'text-c2-green hover:bg-c2-green/10'
              }`}
              title="Slot u/1 — Symbrook Enterprise, Atlas Labs, Cloud Storage"
            >
              <span className="w-2 h-2 rounded-full bg-c2-green" />
              <span>josh@symbrook.com</span>
              <span className="text-[10px] opacity-75 font-normal">(u/1 · Enterprise)</span>
            </button>
          </div>
        </div>

        {/* Account Info Pill */}
        <div className="text-[11px] font-mono text-c2-textMuted flex items-center gap-2">
          {accountFilter === 'eighty7supreme@gmail.com' && (
            <span className="text-c2-cyan">
              DoD / CAANG 146th Airlift Wing &bull; Live Calendar Active
            </span>
          )}
          {accountFilter === 'josh@symbrook.com' && (
            <span className="text-c2-green">
              Symbrook Enterprise &bull; 45 Synced Drive Docs in ~/Library/CloudStorage/
            </span>
          )}
          {accountFilter === 'all' && (
            <span>Dual Stream: CAANG Defense (u/0) + Symbrook Enterprise (u/1)</span>
          )}
        </div>
      </div>

      {/* ==================== 3. NAVIGATION TABS ==================== */}
      <div className="px-5 py-3 bg-c2-surface border-b border-c2-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-c2-bg p-1 rounded-xl border border-c2-border flex-wrap">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'calendar'
                ? 'bg-c2-cyan text-c2-bg shadow-cyan-glow'
                : 'text-c2-textMuted hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>CALENDAR AGENDA ({filteredEvents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('drive')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'drive'
                ? 'bg-c2-green text-c2-bg shadow-green-glow'
                : 'text-c2-textMuted hover:text-white'
            }`}
          >
            <FolderSync className="w-3.5 h-3.5" />
            <span>GOOGLE DRIVE ({driveFiles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('gmail')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'gmail'
                ? 'bg-c2-amber text-c2-bg'
                : 'text-c2-textMuted hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>GMAIL DISPATCH ({filteredAlerts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'tasks'
                ? 'bg-c2-cyan text-c2-bg shadow-cyan-glow'
                : 'text-c2-textMuted hover:text-white'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>TASKS & DIRECTIVES ({filteredTasks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('suite')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'suite'
                ? 'bg-c2-purple text-c2-bg'
                : 'text-c2-textMuted hover:text-white'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>CLOUD LAUNCHPAD</span>
          </button>
        </div>
      </div>

      {/* ==================== 4. TAB CONTENTS ==================== */}
      <div className="p-6">
        {/* ==================== TAB 1: CALENDAR AGENDA ==================== */}
        {activeTab === 'calendar' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Calendar Header with Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-c2-cyan/5 border border-c2-cyan/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-c2-cyan/15 text-c2-cyan border border-c2-cyan/30">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-mono font-bold text-xs text-white flex items-center gap-2">
                    <span>LIVE MACOS & GOOGLE CALENDAR STREAM</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-c2-cyan/20 text-c2-cyan border border-c2-cyan/30 font-mono">
                      {filteredEvents.length} Synchronized Events
                    </span>
                  </h4>
                  <p className="text-xs text-c2-textMuted font-mono mt-0.5">
                    Synced from Calendar.app for <strong className="text-c2-cyan">eighty7supreme@gmail.com</strong> (DoD/CAANG)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="https://calendar.google.com/calendar/u/0/r"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-c2-bg hover:bg-c2-surfaceHover border border-c2-border text-xs font-mono text-c2-cyan transition-all"
                >
                  <span>Google Calendar (u/0)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://calendar.google.com/calendar/u/1/r"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-c2-bg hover:bg-c2-surfaceHover border border-c2-border text-xs font-mono text-c2-green transition-all"
                >
                  <span>Google Calendar (u/1)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEvents.map((event) => {
                const isSupreme = (event.accountEmail || 'eighty7supreme@gmail.com') === 'eighty7supreme@gmail.com';
                const calUrl = `https://calendar.google.com/calendar/u/${event.accountSlot ?? (isSupreme ? 0 : 1)}/r`;

                return (
                  <div
                    key={event.id}
                    className="p-4 rounded-xl bg-c2-surface border border-c2-border hover:border-c2-cyan/40 transition-all flex flex-col justify-between group shadow-md hover:shadow-cyan-glow"
                  >
                    <div>
                      {/* Event Meta Badges */}
                      <div className="flex items-center justify-between text-xs font-mono mb-2">
                        <span className="flex items-center gap-1.5 font-bold text-c2-cyan">
                          <Clock className="w-3.5 h-3.5" />
                          {event.startTime}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono ${
                          isSupreme
                            ? 'bg-c2-cyan/10 border-c2-cyan/30 text-c2-cyan'
                            : 'bg-c2-green/10 border-c2-green/30 text-c2-green'
                        }`}>
                          {isSupreme ? 'CAANG / Defense' : 'Symbrook'}
                        </span>
                      </div>

                      {/* Event Title */}
                      <h4 className="font-mono font-bold text-sm text-white line-clamp-2 mb-1.5">
                        {event.title}
                      </h4>

                      {event.calendarName && (
                        <span className="text-[10px] font-mono text-c2-textMuted block">
                          Cal: {event.calendarName}
                        </span>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-c2-border/60 flex items-center justify-between gap-2 mt-3">
                      <a
                        href={calUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-mono text-c2-cyan hover:underline"
                      >
                        Open in Google Calendar
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      {onDeleteEvent && (
                        <button
                          onClick={() => onDeleteEvent(event.title)}
                          className="p-1 rounded text-c2-textMuted hover:text-c2-red transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete / cancel event in Calendar.app"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Schedule New Event Form */}
            <div className="p-4 rounded-xl bg-c2-surface border border-c2-border">
              <span className="text-xs font-mono text-c2-textMuted uppercase font-bold block mb-2">
                SCHEDULE NEW BRIEFING / EVENT INTO CALENDAR.APP
              </span>
              <form onSubmit={handleCreateEvent} className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="Briefing title (e.g. CAANG Readiness Review, Atlas Labs Sync)..."
                  className="flex-1 min-w-[260px] bg-c2-bg border border-c2-border rounded-lg px-3.5 py-2 text-xs font-mono text-white placeholder-c2-textMuted focus:outline-none focus:border-c2-cyan"
                />
                <input
                  type="time"
                  value={newEventTime}
                  onChange={(e) => setNewEventTime(e.target.value)}
                  className="bg-c2-bg border border-c2-border rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-c2-cyan"
                />
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-c2-cyan text-c2-bg text-xs font-mono font-bold transition-all shadow-cyan-glow hover:bg-c2-cyan/90"
                >
                  <Plus className="w-4 h-4" />
                  <span>SCHEDULE IN CALENDAR</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ==================== TAB 2: GOOGLE DRIVE CLOUD ASSETS ==================== */}
        {activeTab === 'drive' && (
          <div className="space-y-5 animate-fadeIn">
            {/* Drive Desktop Sync Banner */}
            <div className="p-4 rounded-xl bg-c2-green/5 border border-c2-green/20 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-c2-green/15 text-c2-green border border-c2-green/30">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-mono font-bold text-xs text-white flex items-center gap-2">
                    <span>LOCAL GOOGLE DRIVE STORAGE BRIDGE</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-c2-green/15 text-c2-green border border-c2-green/30 font-mono font-bold">
                      josh@symbrook.com (u/1)
                    </span>
                  </h4>
                  <p className="text-xs text-c2-textMuted font-mono mt-0.5">
                    Storage: <code className="text-white text-[11px]">~/Library/CloudStorage/GoogleDrive-josh@symbrook.com/My Drive</code>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRevealInFinder('/Users/symbrook/Library/CloudStorage/GoogleDrive-josh@symbrook.com/My Drive', 'Google Drive Root')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-c2-bg hover:bg-c2-surfaceHover border border-c2-border text-xs font-mono text-white transition-all shadow-sm"
                  title="Open root Drive folder in macOS Finder"
                >
                  <Eye className="w-3.5 h-3.5 text-c2-green" />
                  <span>REVEAL DRIVE IN FINDER</span>
                </button>
                <button
                  onClick={fetchDriveFiles}
                  disabled={driveLoading}
                  className="p-2 rounded-lg bg-c2-surface hover:bg-c2-surfaceHover border border-c2-border text-c2-green"
                  title="Refresh files"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${driveLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Category Pills */}
              <div className="flex items-center gap-1 bg-c2-surface p-1 rounded-xl border border-c2-border overflow-x-auto">
                {(['all', 'document', 'spreadsheet', 'pdf', 'folder'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setDriveCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold uppercase transition-all whitespace-nowrap ${
                      driveCategory === cat
                        ? 'bg-c2-green text-c2-bg shadow-green-glow'
                        : 'text-c2-textMuted hover:text-white'
                    }`}
                  >
                    {cat === 'all' ? `ALL (${driveFiles.length})` : cat}
                  </button>
                ))}
              </div>

              {/* Search Input */}
              <div className="relative min-w-[240px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-c2-textMuted" />
                <input
                  type="text"
                  value={driveSearch}
                  onChange={(e) => setDriveSearch(e.target.value)}
                  placeholder="Filter 45 Drive documents & files..."
                  className="w-full bg-c2-surface border border-c2-border rounded-xl pl-9 pr-3.5 py-1.5 text-xs font-mono text-white placeholder-c2-textMuted focus:outline-none focus:border-c2-green"
                />
              </div>
            </div>

            {/* Synced Files Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredDriveFiles.map((file) => {
                let FileIcon = FileText;
                let catBadgeColor = 'bg-c2-cyan/10 border-c2-cyan/30 text-c2-cyan';

                if (file.category === 'folder') {
                  FileIcon = Folder;
                  catBadgeColor = 'bg-c2-amber/10 border-c2-amber/30 text-c2-amber';
                } else if (file.category === 'spreadsheet') {
                  FileIcon = Table;
                  catBadgeColor = 'bg-c2-green/10 border-c2-green/30 text-c2-green';
                } else if (file.category === 'pdf') {
                  FileIcon = FileText;
                  catBadgeColor = 'bg-c2-red/10 border-c2-red/30 text-c2-red';
                } else if (file.category === 'code') {
                  FileIcon = FileCode;
                  catBadgeColor = 'bg-c2-purple/10 border-c2-purple/30 text-c2-purple';
                }

                const webSearchUrl = `https://drive.google.com/drive/u/1/search?q=${encodeURIComponent(file.name.replace(/\.[^/.]+$/, ''))}`;

                return (
                  <div
                    key={file.id}
                    className="p-4 rounded-xl bg-c2-surface border border-c2-border hover:border-c2-green/40 transition-all flex flex-col justify-between group shadow-md hover:shadow-green-glow"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-c2-bg border border-c2-border text-c2-green group-hover:text-white transition-colors">
                            <FileIcon className="w-4 h-4" />
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-mono font-bold border ${catBadgeColor}`}>
                            {file.category}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-c2-textMuted">
                          {file.sizeFormatted}
                        </span>
                      </div>

                      <h4 className="font-mono font-bold text-xs text-white line-clamp-2 mb-1 group-hover:text-c2-green transition-colors" title={file.name}>
                        {file.name}
                      </h4>

                      <span className="text-[10px] font-mono text-c2-textMuted block">
                        Mod: {new Date(file.modified).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    {/* Drill-through Actions */}
                    <div className="pt-3 border-t border-c2-border/60 flex items-center justify-between gap-1.5 mt-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleRevealInFinder(file.fullPath, file.name)}
                          className="px-2 py-1 rounded bg-c2-bg hover:bg-c2-surfaceHover border border-c2-border text-[11px] font-mono text-c2-cyan hover:text-white flex items-center gap-1 transition-all"
                          title="Reveal file in macOS Finder"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Finder</span>
                        </button>

                        <button
                          onClick={() => handleOpenFile(file.fullPath, file.name)}
                          className="px-2 py-1 rounded bg-c2-bg hover:bg-c2-surfaceHover border border-c2-border text-[11px] font-mono text-c2-green hover:text-white flex items-center gap-1 transition-all"
                          title="Open locally"
                        >
                          <ArrowUpRight className="w-3 h-3" />
                          <span>Open</span>
                        </button>
                      </div>

                      <a
                        href={webSearchUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-mono text-c2-textMuted hover:text-c2-cyan flex items-center gap-1"
                        title="Search and view in Google Drive web"
                      >
                        <span>Cloud</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredDriveFiles.length === 0 && (
              <div className="p-8 text-center bg-c2-surface rounded-xl border border-c2-border font-mono text-xs text-c2-textMuted">
                No matching documents found in Google Drive folder.
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 3: TACTICAL GMAIL ==================== */}
        {activeTab === 'gmail' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Quick Inbox Dispatch Bar */}
            <div className="p-4 rounded-xl bg-c2-surface border border-c2-border flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h4 className="font-mono font-bold text-xs text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-c2-amber" />
                  <span>TACTICAL GMAIL DISPATCH DECK</span>
                </h4>
                <p className="text-xs text-c2-textMuted font-mono mt-0.5">
                  Direct deep-links into targeted search streams across both profiles
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href="https://mail.google.com/mail/u/0/#inbox"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-c2-cyan/10 hover:bg-c2-cyan/20 border border-c2-cyan/30 text-xs font-mono font-bold text-c2-cyan transition-all"
                >
                  <span>CAANG Inbox (u/0)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <a
                  href="https://mail.google.com/mail/u/1/#inbox"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-c2-green/10 hover:bg-c2-green/20 border border-c2-green/30 text-xs font-mono font-bold text-c2-green transition-all"
                >
                  <span>Symbrook Inbox (u/1)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <a
                  href="https://mail.google.com/mail/u/0/#search/is%3Aunread"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-c2-bg hover:bg-c2-surfaceHover border border-c2-border text-xs font-mono text-white transition-all"
                >
                  <span>All Unread</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Quick Drill-down Search Chips */}
            <div className="flex items-center gap-2 flex-wrap pb-1">
              <span className="text-[11px] font-mono text-c2-textMuted uppercase">DRILL-THROUGH STREAMS:</span>
              {[
                { label: '146th Airlift Wing', url: 'https://mail.google.com/mail/u/0/#search/146th+Airlift+Wing' },
                { label: 'CAANG Reenlistment', url: 'https://mail.google.com/mail/u/0/#search/CAANG+reenlistment' },
                { label: 'Medical Waiver', url: 'https://mail.google.com/mail/u/0/#search/medical+waiver' },
                { label: 'Atlas Labs Client Reviews', url: 'https://mail.google.com/mail/u/1/#search/Atlas+Labs' },
                { label: 'Client Intake Form Submissions', url: 'https://mail.google.com/mail/u/1/#search/intake+form' },
              ].map((chip) => (
                <a
                  key={chip.label}
                  href={chip.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-c2-surface hover:bg-c2-surfaceHover border border-c2-border text-[11px] font-mono text-c2-textMuted hover:text-white flex items-center gap-1 transition-all"
                >
                  <span>{chip.label}</span>
                  <ArrowUpRight className="w-2.5 h-2.5 text-c2-cyan" />
                </a>
              ))}
            </div>

            {/* Priority Alerts List */}
            <div className="space-y-3">
              {filteredAlerts.map((alert) => {
                const isSupreme = (alert.accountEmail || 'eighty7supreme@gmail.com') === 'eighty7supreme@gmail.com';
                const directUrl = alert.directUrl || (isSupreme
                  ? `https://mail.google.com/mail/u/0/#search/${encodeURIComponent(alert.subject)}`
                  : `https://mail.google.com/mail/u/1/#search/${encodeURIComponent(alert.subject)}`);

                return (
                  <div
                    key={alert.id}
                    className="p-4 rounded-xl bg-c2-surface border border-c2-border hover:border-c2-cyan/30 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4 group"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-white">{alert.from}</span>
                        <span className="text-[10px] font-mono text-c2-textMuted">{alert.date || alert.time}</span>
                        <span className={`text-[10px] px-2 py-0.2 rounded-full font-mono border ${
                          isSupreme
                            ? 'bg-c2-cyan/10 border-c2-cyan/30 text-c2-cyan'
                            : 'bg-c2-green/10 border-c2-green/30 text-c2-green'
                        }`}>
                          {alert.accountEmail || (isSupreme ? 'eighty7supreme@gmail.com' : 'josh@symbrook.com')}
                        </span>
                        {alert.priority === 'high' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-c2-red/10 border border-c2-red/30 text-c2-red font-mono font-bold">
                            CRITICAL
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-mono text-c2-cyan font-semibold">{alert.subject}</h4>
                      <p className="text-xs text-c2-textMuted font-sans leading-relaxed">{alert.snippet}</p>
                    </div>

                    <a
                      href={directUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-c2-bg hover:bg-c2-surfaceHover border border-c2-border text-xs font-mono text-c2-cyan hover:text-white flex items-center gap-1.5 whitespace-nowrap self-start"
                    >
                      <span>Open Thread</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== TAB 4: TASKS & DIRECTIVES ==================== */}
        {activeTab === 'tasks' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Tasks Header Bar */}
            <div className="flex items-center justify-between pb-2">
              <div>
                <span className="text-xs font-mono text-c2-textMuted uppercase font-bold">
                  PERSISTED MISSION DIRECTIVES & GOOGLE TASKS
                </span>
                <p className="text-xs text-c2-textMuted font-mono">
                  State is persisted to <code className="text-white">data/google-tasks.json</code> and categorized by account
                </p>
              </div>

              <a
                href="https://tasks.google.com/embed/?origin=https://calendar.google.com"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-mono text-c2-cyan hover:underline flex items-center gap-1"
              >
                <span>Launch Google Tasks Web</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Task Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredTasks.map((task) => {
                const isSupreme = (task.accountEmail || 'eighty7supreme@gmail.com') === 'eighty7supreme@gmail.com';

                return (
                  <div
                    key={task.id}
                    className="p-3.5 rounded-xl bg-c2-surface border border-c2-border flex items-center justify-between gap-3 shadow-md hover:border-c2-cyan/30 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => handleToggleTask(task.id)}
                        className="text-c2-textMuted hover:text-c2-green transition-colors flex-shrink-0"
                        title={task.completed ? 'Mark pending' : 'Mark complete'}
                      >
                        <CheckCircle2
                          className={`w-5 h-5 ${task.completed ? 'text-c2-green' : 'text-c2-textMuted'}`}
                        />
                      </button>
                      <div className="min-w-0">
                        <span
                          className={`text-xs font-mono block truncate ${
                            task.completed ? 'line-through text-c2-textMuted' : 'text-white font-medium'
                          }`}
                        >
                          {task.title}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          {task.due && (
                            <span className="text-[10px] font-mono text-c2-cyan">
                              Due: {task.due}
                            </span>
                          )}
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono border ${
                            isSupreme
                              ? 'bg-c2-cyan/10 border-c2-cyan/30 text-c2-cyan'
                              : 'bg-c2-green/10 border-c2-green/30 text-c2-green'
                          }`}>
                            {isSupreme ? 'eighty7supreme' : 'symbrook'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          task.completed
                            ? 'bg-c2-green/10 border-c2-green/30 text-c2-green'
                            : 'bg-c2-amber/10 border-c2-amber/30 text-c2-amber'
                        }`}
                      >
                        {task.completed ? 'DONE' : 'PENDING'}
                      </span>

                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1 rounded text-c2-textMuted hover:text-c2-red transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Add Task Form */}
            <form onSubmit={handleCreateTask} className="flex flex-wrap items-center gap-2.5 pt-2">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Log a new task into Google Tasks..."
                className="flex-1 min-w-[240px] bg-c2-surface border border-c2-border rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-c2-textMuted focus:outline-none focus:border-c2-cyan"
              />

              <select
                value={newTaskAccount}
                onChange={(e) => setNewTaskAccount(e.target.value as any)}
                className="bg-c2-surface border border-c2-border rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-c2-cyan"
              >
                <option value="eighty7supreme@gmail.com">eighty7supreme (u/0 · Defense)</option>
                <option value="josh@symbrook.com">josh@symbrook.com (u/1 · Enterprise)</option>
              </select>

              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-c2-cyan text-c2-bg text-xs font-mono font-bold transition-all shadow-cyan-glow hover:bg-c2-cyan/90"
              >
                <Plus className="w-4 h-4" />
                <span>ADD TASK</span>
              </button>
            </form>
          </div>
        )}

        {/* ==================== TAB 5: CLOUD SUITE LAUNCHPAD ==================== */}
        {activeTab === 'suite' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Section 1: eighty7supreme@gmail.com Launchpad */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-c2-cyan" />
                <h3 className="font-mono font-bold text-xs text-c2-cyan uppercase">
                  PRIMARY DEFENSE DECK &bull; eighty7supreme@gmail.com (Chrome Profile u/0)
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                {[
                  { name: 'Google Calendar', url: 'https://calendar.google.com/calendar/u/0/r', icon: Calendar, desc: 'Schedule & Drill' },
                  { name: 'Gmail Dispatch', url: 'https://mail.google.com/mail/u/0/', icon: Mail, desc: 'DoD & 146th Wing' },
                  { name: 'Google Drive', url: 'https://drive.google.com/drive/u/0/', icon: FolderSync, desc: 'Personal Drive' },
                  { name: 'Google Docs', url: 'https://docs.google.com/document/u/0/', icon: FileText, desc: 'DoD Documents' },
                  { name: 'Google Cloud (GCP)', url: 'https://console.cloud.google.com/', icon: Cloud, desc: 'Cloud IAM & Vertex' },
                  { name: 'Google Keep', url: 'https://keep.google.com/u/0/', icon: CheckSquare, desc: 'Scratchpad' },
                ].map((tool) => {
                  const ToolIcon = tool.icon;
                  return (
                    <a
                      key={tool.name}
                      href={tool.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-4 rounded-xl bg-c2-surface border border-c2-border hover:border-c2-cyan/50 hover:bg-c2-surfaceHover transition-all flex flex-col items-center text-center group shadow-md"
                    >
                      <ToolIcon className="w-7 h-7 text-c2-cyan mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-mono font-bold text-white group-hover:text-c2-cyan">
                        {tool.name}
                      </span>
                      <span className="text-[10px] font-mono text-c2-textMuted mt-1">{tool.desc}</span>
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Section 2: josh@symbrook.com Launchpad */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-c2-green" />
                <h3 className="font-mono font-bold text-xs text-c2-green uppercase">
                  ENTERPRISE WORKSPACE &bull; josh@symbrook.com (Chrome Profile u/1)
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                {[
                  { name: 'Google Drive', url: 'https://drive.google.com/drive/u/1/my-drive', icon: FolderSync, desc: 'Atlas Labs / Symbrook' },
                  { name: 'Google Docs', url: 'https://docs.google.com/document/u/1/', icon: FileText, desc: 'Service Frameworks' },
                  { name: 'Google Sheets', url: 'https://docs.google.com/spreadsheets/u/1/', icon: Table, desc: 'Pricing & Matrices' },
                  { name: 'Google Slides', url: 'https://docs.google.com/presentation/u/1/', icon: Presentation, desc: 'Client Deliverables' },
                  { name: 'NotebookLM', url: 'https://notebooklm.google.com/', icon: BookOpen, desc: 'AI Knowledge Engine' },
                  { name: 'Google Meet', url: 'https://meet.google.com/', icon: Users, desc: 'Conference Bridge' },
                ].map((tool) => {
                  const ToolIcon = tool.icon;
                  return (
                    <a
                      key={tool.name}
                      href={tool.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-4 rounded-xl bg-c2-surface border border-c2-border hover:border-c2-green/50 hover:bg-c2-surfaceHover transition-all flex flex-col items-center text-center group shadow-md"
                    >
                      <ToolIcon className="w-7 h-7 text-c2-green mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-mono font-bold text-white group-hover:text-c2-green">
                        {tool.name}
                      </span>
                      <span className="text-[10px] font-mono text-c2-textMuted mt-1">{tool.desc}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
