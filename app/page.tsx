'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  OllamaModel, 
  GoogleCalendarEvent, 
  GoogleTaskItem, 
  GmailAlert, 
  SystemTelemetry, 
  TabSpace,
  AiAnalysisReport,
  AnalysisDomain,
  OperationalMode
} from '@/types';
import { HeaderHUD } from '@/components/HeaderHUD';
import { KpiTelemetry } from '@/components/KpiTelemetry';
import { GoogleWorkspaceHub } from '@/components/GoogleWorkspaceHub';
import { AiTacticalConsole } from '@/components/AiTacticalConsole';
import { GoogleConnectModal } from '@/components/GoogleConnectModal';
import { TacticalDashboard } from '@/components/TacticalDashboard';
import { TacticalAnalysisModal } from '@/components/TacticalAnalysisModal';
import { PenTestSecurityPanel } from '@/components/PenTestSecurityPanel';
import { InteractiveInboxDeck } from '@/components/InteractiveInboxDeck';
import { InteractiveCalendarOps } from '@/components/InteractiveCalendarOps';
import { MissionTasksBoard } from '@/components/MissionTasksBoard';
import { TacticalNotificationCenter } from '@/components/TacticalNotificationCenter';
import { INITIAL_CALENDAR_EVENTS, INITIAL_GOOGLE_TASKS, INITIAL_GMAIL_ALERTS } from '@/lib/goals-data';
import { GoogleAccountConfig } from '@/lib/google-calendar-service';
import { DriveDocumentItem } from '@/lib/google-drive-bridge';
import { EmailMessage } from '@/lib/email-service';
import { Sparkles, Bot, Calendar, Boxes } from 'lucide-react';

export default function CommandCenterPage() {
  // Operational Mode State ('defense-c2' | 'enterprise' | 'unified')
  const [operationalMode, setOperationalMode] = useState<OperationalMode>('defense-c2');

  // Primary Landing Page is 'dashboard' (C2 Overview with 3D HoloSphere & Capability Launchpad)
  const [activeTab, setActiveTab] = useState<TabSpace>('dashboard');
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Core Data States
  const [telemetry, setTelemetry] = useState<SystemTelemetry | null>(null);
  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.8-flash');
  const [ollamaOnline, setOllamaOnline] = useState<boolean>(true);

  // Google Workspace Data & Drive Files
  const [calendarEvents, setCalendarEvents] = useState<GoogleCalendarEvent[]>(INITIAL_CALENDAR_EVENTS);
  const [tasks, setTasks] = useState<GoogleTaskItem[]>(INITIAL_GOOGLE_TASKS);
  const [alerts, setAlerts] = useState<GmailAlert[]>(INITIAL_GMAIL_ALERTS);
  const [account, setAccount] = useState<GoogleAccountConfig | null>(null);
  const [driveFiles, setDriveFiles] = useState<DriveDocumentItem[]>([]);
  const [emails, setEmails] = useState<EmailMessage[]>([]);

  // 1-Click AI Analysis State
  const [analysisReport, setAnalysisReport] = useState<AiAnalysisReport | null>(null);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch telemetry
  const fetchTelemetry = useCallback(async () => {
    try {
      const res = await fetch('/api/system/status');
      if (res.ok) {
        const data = await res.json();
        setTelemetry(data);
      }
    } catch (err) {
      console.error('Telemetry fetch error:', err);
    }
  }, []);

  // Fetch Ollama models without stomping selected model
  const fetchOllama = useCallback(async () => {
    try {
      const res = await fetch('/api/ollama');
      if (res.ok) {
        const data = await res.json();
        setOllamaOnline(data.online);
        if (data.models && data.models.length > 0) {
          setOllamaModels(data.models);
        }
      }
    } catch {
      setOllamaOnline(false);
    }
  }, []);

  // Fetch Google Account & Calendar
  const fetchGoogleData = useCallback(async () => {
    try {
      const res = await fetch('/api/google');
      if (res.ok) {
        const data = await res.json();
        if (data.account) setAccount(data.account);
        if (data.events && data.events.length > 0) setCalendarEvents(data.events);
        if (data.tasks) setTasks(data.tasks);
        if (data.alerts) setAlerts(data.alerts);
      }
    } catch (err) {
      console.error('Failed fetching Google data:', err);
    }
  }, []);

  // Fetch Google Drive synced files
  const fetchDriveFiles = useCallback(async () => {
    try {
      const res = await fetch('/api/google/drive');
      if (res.ok) {
        const data = await res.json();
        if (data.files && Array.isArray(data.files)) {
          setDriveFiles(data.files);
        }
      }
    } catch (err) {
      console.error('Failed fetching Drive files:', err);
    }
  }, []);

  // Fetch Emails
  const fetchEmails = useCallback(async () => {
    try {
      const res = await fetch('/api/email');
      if (res.ok) {
        const data = await res.json();
        if (data.emails) {
          setEmails(data.emails);
        }
      }
    } catch (err) {
      console.error('Failed fetching emails:', err);
    }
  }, []);

  // 1-Click AI Synthesis Trigger
  const handleTriggerAnalysis = async (domain: AnalysisDomain) => {
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, model: selectedModel }),
      });
      const data = await res.json();
      if (data.success && data.report) {
        setAnalysisReport(data.report);
        setIsAnalysisModalOpen(true);
      }
    } catch (err) {
      console.error('1-Click Analysis request failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Initial Data Load & Tab URL routing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      let tabParam = params.get('tab');
      if (tabParam === 'drive') tabParam = 'workspace';
      if (tabParam === 'pentest') tabParam = 'security';
      if (tabParam && ['dashboard', 'inbox', 'calendar', 'tasks', 'workspace', 'cognition', 'security'].includes(tabParam)) {
        setActiveTab(tabParam as TabSpace);
      }
    }

    fetchTelemetry();
    fetchOllama();
    fetchGoogleData();
    fetchDriveFiles();
    fetchEmails();

    const interval = setInterval(() => {
      fetchTelemetry();
      fetchEmails();
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchTelemetry, fetchOllama, fetchGoogleData, fetchDriveFiles, fetchEmails]);

  // Real Task Creation Handler
  const handleAddTask = async (title: string, accountEmail?: string, priority?: string) => {
    try {
      const res = await fetch('/api/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add-task',
          item: {
            title,
            accountEmail: accountEmail || 'eighty7supreme@gmail.com',
            priority: priority || 'high',
            due: 'Today',
          },
        }),
      });
      const data = await res.json();
      if (data.task) {
        setTasks((prev) => [data.task, ...prev]);
      } else if (data.tasks) {
        setTasks(data.tasks);
      }
    } catch {
      const fallback: GoogleTaskItem = {
        id: `t-${Date.now()}`,
        title,
        due: 'Today',
        completed: false,
        accountEmail: accountEmail || 'eighty7supreme@gmail.com',
      };
      setTasks((prev) => [fallback, ...prev]);
    }
  };

  // Task Toggle Handler
  const handleToggleTask = async (id: string, completed: boolean) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed } : t)));
    try {
      await fetch('/api/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle-task', taskId: id, completed }),
      });
    } catch {}
  };

  // Task Delete Handler
  const handleDeleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await fetch('/api/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete-task', taskId: id }),
      });
    } catch {}
  };

  // 1-Click AI Task Decomposition via Gemini 3.8 Flash
  const handleDecomposeTaskWithAi = async (taskTitle: string): Promise<string[]> => {
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Decompose this operational objective into exactly 3 concise, highly actionable tactical subtasks:\n"${taskTitle}"\nReturn ONLY the 3 subtasks separated by newlines, with no bullet characters, no numbers, and no commentary.`,
          model: 'gemini-3.8-flash',
        }),
      });
      const data = await res.json();
      if (data.response) {
        return data.response
          .split('\n')
          .map((s: string) => s.replace(/^[0-9\-\*\.\s]+/, '').trim())
          .filter((s: string) => s.length > 0)
          .slice(0, 4);
      }
    } catch (err) {
      console.error('Task decomposition error:', err);
    }
    return [
      `Review prerequisite requirements for "${taskTitle}"`,
      `Execute direct verification test`,
      `Log compliance report and sign off`,
    ];
  };

  // Real Calendar Event Add Handler
  const handleAddEvent = async (title: string, startTime: string, accountEmail?: string) => {
    try {
      const res = await fetch('/api/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add-event',
          item: {
            title,
            startTime,
            accountEmail: accountEmail || 'eighty7supreme@gmail.com',
            status: 'confirmed',
          },
        }),
      });
      const data = await res.json();
      if (data.events) {
        setCalendarEvents(data.events);
      }
    } catch {
      const fallback: GoogleCalendarEvent = {
        id: `ev-${Date.now()}`,
        title,
        startTime,
        endTime: `${parseInt(startTime.split(':')[0], 10) + 1}:00`,
        status: 'confirmed',
        accountEmail: accountEmail || 'eighty7supreme@gmail.com',
        link: 'https://calendar.google.com/',
      };
      setCalendarEvents((prev) => [fallback, ...prev]);
    }
  };

  // Calendar Event Delete Handler
  const handleDeleteEvent = async (eventId: string) => {
    setCalendarEvents((prev) => prev.filter((e) => e.id !== eventId));
    try {
      const res = await fetch('/api/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete-event', eventId }),
      });
      const data = await res.json();
      if (data.events) {
        setCalendarEvents(data.events);
      }
    } catch {}
  };

  const completedTasksCount = tasks.filter((t) => t.completed).length;
  const overallTaskProgress = Math.round((completedTasksCount / (tasks.length || 1)) * 100);
  const unreadAlertsCount = emails.filter((e) => e.unread).length;

  return (
    <div className="min-h-screen bg-c2-bg text-slate-100 bg-tactical-grid transition-colors">
      {/* Top Tactical HUD Header with Clean Navigation Tabs & Notification Bell */}
      <HeaderHUD
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onToggleAi={() => setIsAiOpen((prev) => !prev)}
        isAiOpen={isAiOpen}
        selectedModel={selectedModel}
        account={account}
        onOpenConnectModal={() => setIsConnectModalOpen(true)}
        unreadNotificationsCount={unreadAlertsCount}
        onToggleNotifications={() => setIsNotificationOpen((prev) => !prev)}
      />

      <main
        className={`transition-all duration-300 px-4 pt-6 ${
          isAiOpen
            ? 'max-w-7xl mx-auto xl:max-w-none xl:mr-[440px] xl:ml-6 pb-[560px] xl:pb-16'
            : 'max-w-7xl mx-auto pb-24'
        }`}
      >
        {/* Compact Telemetry & Status Ribbon */}
        <KpiTelemetry
          telemetry={telemetry}
          totalAppsCount={tasks.length}
          onlineAppsCount={completedTasksCount}
          overallGoalProgress={overallTaskProgress}
        />

        {/* WORKBENCH 0: LANDING PAGE C2 OVERVIEW & CAPABILITY LAUNCHPAD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
            <TacticalDashboard
              telemetry={telemetry}
              account={account}
              calendarEvents={calendarEvents}
              tasks={tasks}
              emails={emails}
              driveFiles={driveFiles}
              models={ollamaModels}
              selectedModel={selectedModel}
              operationalMode={operationalMode}
              onSetOperationalMode={setOperationalMode}
              onNavigateTab={setActiveTab}
              onOpenAiChat={() => setIsAiOpen(true)}
              onTriggerAnalysis={handleTriggerAnalysis}
              isAnalyzing={isAnalyzing}
            />
          </div>
        )}

        {/* WORKBENCH 1: INTERACTIVE EMAIL INBOX & GEMINI AI RESPONSE STUDIO */}
        {activeTab === 'inbox' && (
          <div className="space-y-6 animate-fadeIn">
            <InteractiveInboxDeck
              defaultAccountFilter={
                operationalMode === 'defense-c2'
                  ? 'eighty7supreme@gmail.com'
                  : operationalMode === 'enterprise'
                  ? 'josh@symbrook.com'
                  : 'all'
              }
            />
          </div>
        )}

        {/* WORKBENCH 2: INTERACTIVE VISUAL CALENDAR & MISSION SCHEDULER */}
        {activeTab === 'calendar' && (
          <div className="space-y-6 animate-fadeIn">
            <InteractiveCalendarOps
              events={calendarEvents}
              onAddEvent={handleAddEvent}
              onDeleteEvent={handleDeleteEvent}
              onTriggerScheduleAnalysis={() => handleTriggerAnalysis('calendar')}
              isAnalyzing={isAnalyzing}
              onRefresh={fetchGoogleData}
            />
          </div>
        )}

        {/* WORKBENCH 3: ACTIONABLE MISSION TASKS & OBJECTIVES BOARD */}
        {activeTab === 'tasks' && (
          <div className="space-y-6 animate-fadeIn">
            <MissionTasksBoard
              tasks={tasks}
              onAddTask={handleAddTask}
              onToggleTask={handleToggleTask}
              onDeleteTask={handleDeleteTask}
              onDecomposeTaskWithAi={handleDecomposeTaskWithAi}
            />
          </div>
        )}

        {/* WORKBENCH 4: GOOGLE WORKSPACE DRIVE & ASSET REPOSITORY */}
        {activeTab === 'workspace' && (
          <div className="space-y-6 animate-fadeIn">
            <GoogleWorkspaceHub
              events={calendarEvents}
              tasks={tasks}
              alerts={alerts}
              account={account}
              onAddTask={(title) => handleAddTask(title)}
              onAddEvent={(title, time) => handleAddEvent(title, time)}
              onDeleteEvent={handleDeleteEvent}
              onOpenConnectModal={() => setIsConnectModalOpen(true)}
              onRefreshCalendar={fetchGoogleData}
            />
          </div>
        )}

        {/* WORKBENCH 5: AI COGNITION & MULTI-MODEL ORCHESTRATION */}
        {activeTab === 'cognition' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Top Operational Status Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-c2-card border border-c2-border">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Bot className="w-5 h-5 text-c2-cyan" />
                  <h2 className="font-mono font-bold text-base text-white">TACTICAL AI COGNITION HUB</h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-c2-green/15 text-c2-green border border-c2-green/30 font-mono font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-c2-green animate-pulse" />
                    DUAL ENGINES READY
                  </span>
                </div>
                <p className="text-xs text-c2-textMuted font-mono">
                  Google Gemini Cloud (OAuth: <span className="text-c2-cyan">eighty7supreme@gmail.com</span>) + Air-Gapped Local Inference
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTriggerAnalysis('cognition')}
                  disabled={isAnalyzing}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-c2-purple/15 hover:bg-c2-purple/25 border border-c2-purple/40 text-c2-purple font-mono font-bold text-xs transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>1-CLICK BENCHMARK</span>
                </button>
                <button
                  onClick={() => setIsAiOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-c2-cyan hover:bg-c2-cyan/90 text-c2-bg font-mono font-bold text-xs shadow-cyan-glow transition-all whitespace-nowrap"
                >
                  <Bot className="w-4 h-4" />
                  <span>OPEN CHAT CONSOLE</span>
                </button>
              </div>
            </div>

            {/* SECTION 1: GOOGLE GEMINI CLOUD (OAUTH LINKED) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-c2-cyan" />
                  <span className="font-mono font-bold text-xs text-white uppercase tracking-wide">
                    GOOGLE GEMINI CLOUD &bull; AUTHENTICATED VIA ACTIVE GOOGLE SESSION
                  </span>
                </div>
                <span className="text-[10px] font-mono text-c2-green font-bold">
                  SESSION ACTIVE (eighty7supreme@gmail.com)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    id: 'gemini-3.8-flash',
                    name: 'Google Gemini 3.8 Flash',
                    role: 'SPEED & REASONING',
                    desc: 'Frontier speed, tactical synthesis, multimodal tool execution, and live workspace search.',
                    badge: 'Google OAuth 2.0',
                    color: 'cyan',
                  },
                  {
                    id: 'gemini-3.1-pro',
                    name: 'Google Gemini 3.1 Pro',
                    role: 'DEEP THINKING',
                    desc: 'Complex system architecture, zero-trust pen-test validation, and high-context analysis.',
                    badge: 'Google OAuth 2.0',
                    color: 'purple',
                  },
                  {
                    id: 'claude-sonnet-4-6',
                    name: 'Claude Sonnet 4.6',
                    role: 'EXTENDED CODING',
                    desc: 'Frontier code generation, refactoring, and algorithmic reasoning via OAuth bridge.',
                    badge: 'Antigravity OAuth',
                    color: 'amber',
                  },
                ].map((item) => {
                  const isSelected = selectedModel === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedModel(item.id);
                        setIsAiOpen(true);
                      }}
                      className={`p-4 rounded-xl bg-c2-surface border transition-all cursor-pointer flex flex-col justify-between group shadow-md ${
                        isSelected
                          ? 'border-c2-cyan shadow-cyan-glow bg-c2-surfaceHover'
                          : 'border-c2-border hover:border-c2-cyan/50 hover:bg-c2-surfaceHover'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs font-mono mb-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-c2-cyan/10 text-c2-cyan border border-c2-cyan/30">
                            {item.role}
                          </span>
                          <span className="text-[10px] font-mono text-c2-green font-bold">
                            {item.badge}
                          </span>
                        </div>
                        <h4 className="font-mono font-bold text-sm text-white group-hover:text-c2-cyan transition-colors mb-1.5">
                          {item.name}
                        </h4>
                        <p className="text-xs text-c2-textMuted font-sans leading-relaxed">
                          {item.desc}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-c2-border/60 flex items-center justify-between text-xs font-mono text-c2-cyan mt-3">
                        <span className="font-bold">{isSelected ? 'ACTIVE LLM' : 'ENGAGE MODEL'}</span>
                        <span>→</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECTION 2: CURATED LOCAL AIR-GAPPED MODELS */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-c2-green" />
                  <span className="font-mono font-bold text-xs text-white uppercase tracking-wide">
                    LOCAL AIRGAP INFERENCE &bull; CURATED RUNTIME ({ollamaModels.length} Models)
                  </span>
                </div>
                <span className="text-[10px] font-mono text-c2-green font-bold">
                  ZERO-EGRESS AIRGAP (NO OAUTH REQUIRED)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {ollamaModels.map((m) => {
                  const isSelected = selectedModel === m.name;
                  let role = 'GENERAL INFERENCE';
                  if (m.name.includes('coder')) role = 'CODE SPECIALIST';
                  else if (m.name.includes('r1')) role = 'REASONING (CoT)';
                  else if (m.name.includes('gemma')) role = 'GOOGLE INSTRUCTION';
                  else if (m.name.includes('bonsai')) role = 'APPLE METAL (MLX)';

                  return (
                    <div
                      key={m.name}
                      onClick={() => {
                        setSelectedModel(m.name);
                        setIsAiOpen(true);
                      }}
                      className={`p-4 rounded-xl bg-c2-surface border transition-all cursor-pointer flex flex-col justify-between group shadow-md ${
                        isSelected
                          ? 'border-c2-green shadow-green-glow bg-c2-surfaceHover'
                          : 'border-c2-border hover:border-c2-green/50 hover:bg-c2-surfaceHover'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs font-mono mb-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-c2-green/10 text-c2-green border border-c2-green/30">
                            {role}
                          </span>
                          <span className="text-[10px] font-mono text-c2-textMuted">
                            {m.size}
                          </span>
                        </div>
                        <h4 className="font-mono font-bold text-sm text-white group-hover:text-c2-green transition-colors mb-1">
                          {m.name}
                        </h4>
                        <p className="text-xs text-c2-textMuted font-mono">
                          {m.format || 'Local Weights'}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-c2-border/60 flex items-center justify-between text-xs font-mono text-c2-green mt-3">
                        <span className="font-bold">{isSelected ? 'ACTIVE LLM' : 'ENGAGE MODEL'}</span>
                        <span>→</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* WORKBENCH 6: PEN-TEST & ZERO-TRUST SECURITY POSTURE */}
        {activeTab === 'security' && (
          <div className="space-y-6 animate-fadeIn">
            <PenTestSecurityPanel
              telemetry={telemetry}
              onTriggerPenTest={() => handleTriggerAnalysis('security')}
              isAnalyzing={isAnalyzing}
            />
          </div>
        )}
      </main>

      {/* Floating Tactical AI Copilot (Pinned to bottom-right corner) */}
      <AiTacticalConsole
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        onOpen={() => setIsAiOpen(true)}
        models={ollamaModels}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        ollamaOnline={ollamaOnline}
      />

      {/* 1-Click Tactical Analysis Modal */}
      <TacticalAnalysisModal
        report={analysisReport}
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
        onRerun={handleTriggerAnalysis}
        isLoading={isAnalyzing}
      />

      {/* Tactical Notifications & Event Triggers Center */}
      <TacticalNotificationCenter
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        calendarEvents={calendarEvents}
        tasks={tasks}
        emails={emails}
        onNavigateTab={setActiveTab}
        onOpenAiChat={() => setIsAiOpen(true)}
      />

      {/* Connect Google Account Modal */}
      <GoogleConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        account={account}
        onAccountUpdated={fetchGoogleData}
      />
    </div>
  );
}
