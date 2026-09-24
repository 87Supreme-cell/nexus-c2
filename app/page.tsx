'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  AppItem, 
  DockerContainer, 
  OllamaModel, 
  GoalItem, 
  GoogleCalendarEvent, 
  GoogleTaskItem, 
  GmailAlert, 
  SystemTelemetry, 
  TabSpace,
  AiAnalysisReport,
  AnalysisDomain
} from '@/types';
import { HeaderHUD } from '@/components/HeaderHUD';
import { KpiTelemetry } from '@/components/KpiTelemetry';
import { AppGrid } from '@/components/AppGrid';
import { GoogleWorkspaceHub } from '@/components/GoogleWorkspaceHub';
import { GoalTracker } from '@/components/GoalTracker';
import { DockerManager } from '@/components/DockerManager';
import { AiTacticalConsole } from '@/components/AiTacticalConsole';
import { AddAppModal } from '@/components/AddAppModal';
import { GoogleConnectModal } from '@/components/GoogleConnectModal';
import { TacticalDashboard } from '@/components/TacticalDashboard';
import { TacticalAnalysisModal } from '@/components/TacticalAnalysisModal';
import { EmbeddedAppWorkspace } from '@/components/EmbeddedAppWorkspace';
import { PenTestSecurityPanel } from '@/components/PenTestSecurityPanel';
import { INITIAL_GOALS, INITIAL_CALENDAR_EVENTS, INITIAL_GOOGLE_TASKS, INITIAL_GMAIL_ALERTS } from '@/lib/goals-data';
import { GoogleAccountConfig } from '@/lib/google-calendar-service';
import { DriveDocumentItem } from '@/lib/google-drive-bridge';
import { Sparkles, Bot, Calendar, Grid, Target, Boxes, ShieldCheck } from 'lucide-react';

export default function CommandCenterPage() {
  // Primary Landing Page is 'dashboard' (C2 Overview with 3D HoloSphere & Large KPI Cards)
  const [activeTab, setActiveTab] = useState<TabSpace>('dashboard');
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isAddAppOpen, setIsAddAppOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  // Core Data States
  const [apps, setApps] = useState<AppItem[]>([]);
  const [telemetry, setTelemetry] = useState<SystemTelemetry | null>(null);
  const [dockerData, setDockerData] = useState<{ dockerRunning: boolean; containers: DockerContainer[] }>({
    dockerRunning: false,
    containers: [],
  });
  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([]);
  // Default selected model is Gemini 3.8 Flash (Active Google OAuth Session)
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.8-flash');
  const [ollamaOnline, setOllamaOnline] = useState<boolean>(true);

  // Google Workspace Data & Drive Files
  const [calendarEvents, setCalendarEvents] = useState<GoogleCalendarEvent[]>(INITIAL_CALENDAR_EVENTS);
  const [tasks, setTasks] = useState<GoogleTaskItem[]>(INITIAL_GOOGLE_TASKS);
  const [alerts, setAlerts] = useState<GmailAlert[]>(INITIAL_GMAIL_ALERTS);
  const [account, setAccount] = useState<GoogleAccountConfig | null>(null);
  const [driveFiles, setDriveFiles] = useState<DriveDocumentItem[]>([]);

  // In-App Embedded Workspace Active App
  const [activeEmbeddedApp, setActiveEmbeddedApp] = useState<AppItem | null>(null);

  // 1-Click AI Analysis State
  const [analysisReport, setAnalysisReport] = useState<AiAnalysisReport | null>(null);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Goals
  const [goals, setGoals] = useState<GoalItem[]>(INITIAL_GOALS);
  const [isLoadingApps, setIsLoadingApps] = useState(false);

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

  // Fetch apps & ping
  const fetchApps = useCallback(async () => {
    setIsLoadingApps(true);
    try {
      const res = await fetch('/api/apps');
      if (res.ok) {
        const data: AppItem[] = await res.json();
        setApps(data);
      }
    } catch (err) {
      console.error('Apps fetch error:', err);
    } finally {
      setIsLoadingApps(false);
    }
  }, []);

  // Fetch Docker status
  const fetchDocker = useCallback(async () => {
    try {
      const res = await fetch('/api/docker');
      if (res.ok) {
        const data = await res.json();
        setDockerData({
          dockerRunning: Boolean(data.dockerRunning),
          containers: data.containers || [],
        });
      }
    } catch (err) {
      console.error('Docker fetch error:', err);
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

  // Initial Data Load
  useEffect(() => {
    fetchTelemetry();
    fetchApps();
    fetchDocker();
    fetchOllama();
    fetchGoogleData();
    fetchDriveFiles();

    const interval = setInterval(() => {
      fetchTelemetry();
      fetchApps();
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchTelemetry, fetchApps, fetchDocker, fetchOllama, fetchGoogleData, fetchDriveFiles]);

  // Milestone toggle handler
  const handleToggleMilestone = (goalId: string, milestoneId: string) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;
        const updatedMilestones = g.milestones.map((m) =>
          m.id === milestoneId ? { ...m, done: !m.done } : m
        );
        const doneCount = updatedMilestones.filter((m) => m.done).length;
        const progress = Math.round((doneCount / (updatedMilestones.length || 1)) * 100);
        return { ...g, milestones: updatedMilestones, progress };
      })
    );
  };

  // Google Task add handler
  const handleAddTask = async (title: string) => {
    try {
      const res = await fetch('/api/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add-task', item: { title } }),
      });
      const data = await res.json();
      if (data.task) {
        setTasks((prev) => [data.task, ...prev]);
      }
    } catch {
      const fallback: GoogleTaskItem = {
        id: `t-${Date.now()}`,
        title,
        due: 'Today',
        completed: false,
      };
      setTasks((prev) => [fallback, ...prev]);
    }
  };

  // Google Event add handler
  const handleAddEvent = async (title: string, startTime: string) => {
    try {
      const res = await fetch('/api/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add-event', item: { title, startTime } }),
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
        link: 'https://calendar.google.com/',
      };
      setCalendarEvents((prev) => [fallback, ...prev]);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
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
    } catch {
      setCalendarEvents((prev) => prev.filter((e) => e.id !== eventId));
    }
  };

  const overallGoalProgress = Math.round(
    goals.reduce((acc, curr) => acc + curr.progress, 0) / (goals.length || 1)
  );

  const onlineAppsCount = apps.filter((a) => a.status === 'online').length;

  return (
    <div className="min-h-screen bg-c2-bg text-slate-100 bg-tactical-grid transition-colors">
      {/* Top Tactical HUD Header with Clean Navigation Tabs */}
      <HeaderHUD
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onToggleAi={() => setIsAiOpen((prev) => !prev)}
        isAiOpen={isAiOpen}
        selectedModel={selectedModel}
        account={account}
        onOpenConnectModal={() => setIsConnectModalOpen(true)}
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
          totalAppsCount={apps.length}
          onlineAppsCount={onlineAppsCount}
          overallGoalProgress={overallGoalProgress}
        />

        {/* TAB WORKSPACE 0: LANDING PAGE C2 OVERVIEW (Hero 3D HoloSphere & Large KPI Cards) */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
            <TacticalDashboard
              telemetry={telemetry}
              account={account}
              calendarEvents={calendarEvents}
              driveFiles={driveFiles}
              models={ollamaModels}
              selectedModel={selectedModel}
              onNavigateTab={setActiveTab}
              onOpenAiChat={() => setIsAiOpen(true)}
              onTriggerAnalysis={handleTriggerAnalysis}
              isAnalyzing={isAnalyzing}
            />
          </div>
        )}

        {/* TAB WORKSPACE 1: GOOGLE WORKSPACE */}
        {activeTab === 'workspace' && (
          <div className="space-y-6 animate-fadeIn">
            <GoogleWorkspaceHub
              events={calendarEvents}
              tasks={tasks}
              alerts={alerts}
              account={account}
              onAddTask={handleAddTask}
              onAddEvent={handleAddEvent}
              onDeleteEvent={handleDeleteEvent}
              onOpenConnectModal={() => setIsConnectModalOpen(true)}
              onRefreshCalendar={fetchGoogleData}
            />
          </div>
        )}

        {/* TAB WORKSPACE 2: APPS & RUNTIMES (WITH IN-APP WORKSPACE CAPABILITY) */}
        {activeTab === 'apps' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-mono font-bold text-base text-white">MANAGED APPLICATIONS &amp; RUNTIMES</h2>
                <p className="text-xs text-c2-textMuted font-mono">
                  Supervise local microservices, Docker workloads, and detected Chrome web apps with native in-app view
                </p>
              </div>
            </div>

            <AppGrid
              apps={apps}
              onRefresh={fetchApps}
              onOpenAddModal={() => setIsAddAppOpen(true)}
              isLoading={isLoadingApps}
              onOpenInApp={(app) => setActiveEmbeddedApp(app)}
            />
          </div>
        )}

        {/* TAB WORKSPACE 3: AI COGNITION & MODELS CATALOG */}
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

        {/* TAB WORKSPACE 4: PEN-TEST & SECURITY POSTURE */}
        {activeTab === 'security' && (
          <div className="space-y-6 animate-fadeIn">
            <PenTestSecurityPanel
              telemetry={telemetry}
              onTriggerPenTest={() => handleTriggerAnalysis('security')}
              isAnalyzing={isAnalyzing}
            />
          </div>
        )}

        {/* TAB WORKSPACE 5: MISSION GOALS */}
        {activeTab === 'goals' && (
          <div className="space-y-6 animate-fadeIn">
            <GoalTracker
              goals={goals}
              onToggleMilestone={handleToggleMilestone}
            />
          </div>
        )}

        {/* TAB WORKSPACE 6: DOCKER CLUSTER */}
        {activeTab === 'docker' && (
          <div className="space-y-6 animate-fadeIn">
            <DockerManager
              containers={dockerData.containers}
              dockerRunning={dockerData.dockerRunning}
              onRefresh={fetchDocker}
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

      {/* Embedded In-App Workspace for Running Applications Inside NEXUS-C2 */}
      <EmbeddedAppWorkspace
        app={activeEmbeddedApp}
        onClose={() => setActiveEmbeddedApp(null)}
        calendarEvents={calendarEvents}
        driveFiles={driveFiles}
      />

      {/* Register Custom App Modal */}
      <AddAppModal
        isOpen={isAddAppOpen}
        onClose={() => setIsAddAppOpen(false)}
        onAppAdded={fetchApps}
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
