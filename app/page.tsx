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
  TabSpace 
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
import { INITIAL_GOALS, INITIAL_CALENDAR_EVENTS, INITIAL_GOOGLE_TASKS, INITIAL_GMAIL_ALERTS } from '@/lib/goals-data';
import { GoogleAccountConfig } from '@/lib/google-calendar-service';
import { Sparkles, Bot, Calendar, Grid, Target, Boxes } from 'lucide-react';

export default function CommandCenterPage() {
  const [activeTab, setActiveTab] = useState<TabSpace>('workspace');
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
  const [selectedModel, setSelectedModel] = useState<string>('qwen2.5-coder:7b');
  const [ollamaOnline, setOllamaOnline] = useState<boolean>(true);

  // Google Workspace Data & Account
  const [calendarEvents, setCalendarEvents] = useState<GoogleCalendarEvent[]>(INITIAL_CALENDAR_EVENTS);
  const [tasks, setTasks] = useState<GoogleTaskItem[]>(INITIAL_GOOGLE_TASKS);
  const [alerts, setAlerts] = useState<GmailAlert[]>(INITIAL_GMAIL_ALERTS);
  const [account, setAccount] = useState<GoogleAccountConfig | null>(null);

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

  // Fetch Ollama models
  const fetchOllama = useCallback(async () => {
    try {
      const res = await fetch('/api/ollama');
      if (res.ok) {
        const data = await res.json();
        setOllamaOnline(data.online);
        if (data.models && data.models.length > 0) {
          setOllamaModels(data.models);
          if (!selectedModel || !data.models.some((m: any) => m.name === selectedModel)) {
            setSelectedModel(data.models[0].name);
          }
        }
      }
    } catch {
      setOllamaOnline(false);
    }
  }, [selectedModel]);

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

  // Initial Data Load
  useEffect(() => {
    fetchTelemetry();
    fetchApps();
    fetchDocker();
    fetchOllama();
    fetchGoogleData();

    const interval = setInterval(() => {
      fetchTelemetry();
      fetchApps();
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchTelemetry, fetchApps, fetchDocker, fetchOllama, fetchGoogleData]);

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

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Compact Telemetry & Status Ribbon */}
        <KpiTelemetry
          telemetry={telemetry}
          totalAppsCount={apps.length}
          onlineAppsCount={onlineAppsCount}
          overallGoalProgress={overallGoalProgress}
        />

        {/* TAB WORKSPACE 1: GOOGLE WORKSPACE (Dedicated Clean View) */}
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

        {/* TAB WORKSPACE 2: APPS & RUNTIMES */}
        {activeTab === 'apps' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-mono font-bold text-base text-white">MANAGED APPLICATIONS & RUNTIMES</h2>
                <p className="text-xs text-c2-textMuted font-mono">
                  Supervise local microservices, Docker workloads, and detected Chrome web apps
                </p>
              </div>
            </div>

            <AppGrid
              apps={apps}
              onRefresh={fetchApps}
              onOpenAddModal={() => setIsAddAppOpen(true)}
              isLoading={isLoadingApps}
            />
          </div>
        )}

        {/* TAB WORKSPACE 3: MISSION GOALS */}
        {activeTab === 'goals' && (
          <div className="space-y-6 animate-fadeIn">
            <GoalTracker
              goals={goals}
              onToggleMilestone={handleToggleMilestone}
            />
          </div>
        )}

        {/* TAB WORKSPACE 4: DOCKER CLUSTER */}
        {activeTab === 'docker' && (
          <div className="space-y-6 animate-fadeIn">
            <DockerManager
              containers={dockerData.containers}
              dockerRunning={dockerData.dockerRunning}
              onRefresh={fetchDocker}
            />
          </div>
        )}

        {/* TAB WORKSPACE 5: AI COGNITION & MODELS CATALOG */}
        {activeTab === 'cognition' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-c2-card border border-c2-border">
              <div>
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-c2-cyan" />
                  <h2 className="font-mono font-bold text-base text-white">AI COGNITION & MODEL REPOSITORY</h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-c2-cyan/15 text-c2-cyan border border-c2-cyan/30 font-mono font-bold">
                    {ollamaModels.length} Models Detected
                  </span>
                </div>
                <p className="text-xs text-c2-textMuted font-mono mt-1">
                  Air-gapped local runtimes (Ollama, Apple MLX, LM Studio, Hugging Face) and Google OAuth Gemini 3.8
                </p>
              </div>

              <button
                onClick={() => setIsAiOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-c2-cyan hover:bg-c2-cyan/90 text-c2-bg font-mono font-bold text-xs shadow-cyan-glow transition-all whitespace-nowrap"
              >
                <Bot className="w-4 h-4" />
                <span>OPEN CHAT (BOTTOM RIGHT)</span>
              </button>
            </div>

            {/* Models Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ollamaModels.map((m) => (
                <div
                  key={m.name}
                  onClick={() => {
                    setSelectedModel(m.name);
                    setIsAiOpen(true);
                  }}
                  className="p-4 rounded-xl bg-c2-surface border border-c2-border hover:border-c2-cyan/40 hover:bg-c2-surfaceHover transition-all cursor-pointer flex flex-col justify-between group shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono mb-2">
                      <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] border ${
                        m.source === 'ollama' ? 'bg-c2-green/10 text-c2-green border-c2-green/30' :
                        m.source === 'mlx' ? 'bg-c2-purple/10 text-c2-purple border-c2-purple/30' :
                        m.source === 'lmstudio' ? 'bg-c2-amber/10 text-c2-amber border-c2-amber/30' :
                        'bg-c2-cyan/10 text-c2-cyan border-c2-cyan/30'
                      }`}>
                        {m.source}
                      </span>
                      <span className="text-c2-textMuted">{m.size}</span>
                    </div>

                    <h4 className="font-mono font-bold text-sm text-white group-hover:text-c2-cyan transition-colors line-clamp-1 mb-1">
                      {m.name}
                    </h4>
                    <p className="text-[11px] font-mono text-c2-textMuted">{m.format || 'Standard Weights'}</p>
                  </div>

                  <div className="pt-3 border-t border-c2-border/60 flex items-center justify-between text-[10px] font-mono text-c2-cyan mt-3">
                    <span>Click to chat</span>
                    <span>→</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Floating Tactical AI Copilot (Always pinned to bottom-right corner) */}
      <AiTacticalConsole
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        onOpen={() => setIsAiOpen(true)}
        models={ollamaModels}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        ollamaOnline={ollamaOnline}
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
