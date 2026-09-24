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
  ViewMode 
} from '@/types';
import { HeaderHUD } from '@/components/HeaderHUD';
import { KpiTelemetry } from '@/components/KpiTelemetry';
import { AppGrid } from '@/components/AppGrid';
import { GoogleWorkspaceHub } from '@/components/GoogleWorkspaceHub';
import { GoalTracker } from '@/components/GoalTracker';
import { DockerManager } from '@/components/DockerManager';
import { AiTacticalConsole } from '@/components/AiTacticalConsole';
import { AddAppModal } from '@/components/AddAppModal';
import { INITIAL_GOALS, INITIAL_CALENDAR_EVENTS, INITIAL_GOOGLE_TASKS, INITIAL_GMAIL_ALERTS } from '@/lib/goals-data';

export default function CommandCenterPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('tactical-c2');
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isAddAppOpen, setIsAddAppOpen] = useState(false);

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

  // Google Workspace Data
  const [calendarEvents, setCalendarEvents] = useState<GoogleCalendarEvent[]>(INITIAL_CALENDAR_EVENTS);
  const [tasks, setTasks] = useState<GoogleTaskItem[]>(INITIAL_GOOGLE_TASKS);
  const [alerts, setAlerts] = useState<GmailAlert[]>(INITIAL_GMAIL_ALERTS);
  const [oauthConfigured, setOauthConfigured] = useState<boolean>(false);

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
    } catch (err) {
      setOllamaOnline(false);
    }
  }, [selectedModel]);

  // Initial Data Load
  useEffect(() => {
    fetchTelemetry();
    fetchApps();
    fetchDocker();
    fetchOllama();

    const interval = setInterval(() => {
      fetchTelemetry();
      fetchApps();
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchTelemetry, fetchApps, fetchDocker, fetchOllama]);

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
  const handleAddTask = (title: string) => {
    const newTask: GoogleTaskItem = {
      id: `t-${Date.now()}`,
      title,
      due: 'Today',
      completed: false,
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  // Google Event add handler
  const handleAddEvent = (title: string, startTime: string) => {
    const newEvent: GoogleCalendarEvent = {
      id: `ev-${Date.now()}`,
      title,
      startTime,
      endTime: `${parseInt(startTime.split(':')[0], 10) + 1}:00`,
      status: 'confirmed',
      link: 'https://calendar.google.com/',
    };
    setCalendarEvents((prev) => [newEvent, ...prev]);
  };

  // Compute overall goal velocity
  const overallGoalProgress = Math.round(
    goals.reduce((acc, curr) => acc + curr.progress, 0) / (goals.length || 1)
  );

  const onlineAppsCount = apps.filter((a) => a.status === 'online').length;

  const getBackgroundClass = () => {
    switch (viewMode) {
      case 'tactical-c2':
        return 'bg-tactical-grid';
      case 'cyber-glass':
        return 'bg-glass-grid';
      case 'google-ops':
        return 'bg-google-grid';
      default:
        return 'bg-tactical-grid';
    }
  };

  return (
    <div className={`min-h-screen text-slate-100 ${getBackgroundClass()} transition-colors duration-500`}>
      {/* Top Tactical HUD Header */}
      <HeaderHUD
        viewMode={viewMode}
        setViewMode={setViewMode}
        onToggleAi={() => setIsAiOpen((prev) => !prev)}
        isAiOpen={isAiOpen}
        selectedModel={selectedModel}
      />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* KPI Telemetry Banner */}
        <KpiTelemetry
          telemetry={telemetry}
          totalAppsCount={apps.length}
          onlineAppsCount={onlineAppsCount}
          overallGoalProgress={overallGoalProgress}
        />

        {/* View-Specific Arrangements */}
        {viewMode === 'google-ops' ? (
          <>
            {/* Google Ops priority order */}
            <GoogleWorkspaceHub
              events={calendarEvents}
              tasks={tasks}
              alerts={alerts}
              onAddTask={handleAddTask}
              onAddEvent={handleAddEvent}
              oauthConfigured={oauthConfigured}
            />
            <AppGrid
              apps={apps}
              onRefresh={fetchApps}
              onOpenAddModal={() => setIsAddAppOpen(true)}
              isLoading={isLoadingApps}
            />
            <GoalTracker
              goals={goals}
              onToggleMilestone={handleToggleMilestone}
            />
            <DockerManager
              containers={dockerData.containers}
              dockerRunning={dockerData.dockerRunning}
              onRefresh={fetchDocker}
            />
          </>
        ) : (
          <>
            {/* Tactical C2 and Cyber Glass default order */}
            <AppGrid
              apps={apps}
              onRefresh={fetchApps}
              onOpenAddModal={() => setIsAddAppOpen(true)}
              isLoading={isLoadingApps}
            />

            <GoogleWorkspaceHub
              events={calendarEvents}
              tasks={tasks}
              alerts={alerts}
              onAddTask={handleAddTask}
              onAddEvent={handleAddEvent}
              oauthConfigured={oauthConfigured}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <GoalTracker
                goals={goals}
                onToggleMilestone={handleToggleMilestone}
              />
              <DockerManager
                containers={dockerData.containers}
                dockerRunning={dockerData.dockerRunning}
                onRefresh={fetchDocker}
              />
            </div>
          </>
        )}
      </main>

      {/* Embedded Tactical AI Copilot Console */}
      <AiTacticalConsole
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
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
    </div>
  );
}
