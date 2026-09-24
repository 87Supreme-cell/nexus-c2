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

        {/* TAB WORKSPACE 5: AI COGNITION */}
        {activeTab === 'cognition' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
            <div className="lg:col-span-1 space-y-4">
              <div className="p-5 rounded-2xl bg-c2-card border border-c2-border">
                <div className="flex items-center gap-2 mb-3">
                  <Bot className="w-5 h-5 text-c2-cyan" />
                  <h3 className="font-mono font-bold text-sm text-white">COGNITIVE ENGINE SPECS</h3>
                </div>
                <p className="text-xs text-c2-textMuted font-mono mb-4 leading-relaxed">
                  Tactical dual-engine AI. Operates completely air-gapped via local Ollama daemon or routes authorized queries to Google Gemini.
                </p>

                <div className="space-y-2 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-c2-surface border border-c2-border flex justify-between items-center">
                    <span className="text-c2-textMuted">Airgap Status</span>
                    <span className="text-c2-green font-bold">ACTIVE LOCAL</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-c2-surface border border-c2-border flex justify-between items-center">
                    <span className="text-c2-textMuted">Active Model</span>
                    <span className="text-c2-cyan font-bold">{selectedModel}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-c2-surface border border-c2-border flex justify-between items-center">
                    <span className="text-c2-textMuted">Ollama Engine</span>
                    <span className={ollamaOnline ? 'text-c2-green font-bold' : 'text-c2-red font-bold'}>
                      {ollamaOnline ? '127.0.0.1:11434 UP' : 'OFFLINE'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <AiTacticalConsole
                isOpen={true}
                onClose={() => setActiveTab('workspace')}
                models={ollamaModels}
                selectedModel={selectedModel}
                onSelectModel={setSelectedModel}
                ollamaOnline={ollamaOnline}
              />
            </div>
          </div>
        )}
      </main>

      {/* Floating Tactical AI Copilot (when toggled from HUD in any other tab) */}
      {activeTab !== 'cognition' && (
        <AiTacticalConsole
          isOpen={isAiOpen}
          onClose={() => setIsAiOpen(false)}
          models={ollamaModels}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          ollamaOnline={ollamaOnline}
        />
      )}

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
