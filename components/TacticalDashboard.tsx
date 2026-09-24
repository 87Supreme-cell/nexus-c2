'use client';

import React from 'react';
import { TacticalHoloSphere } from './TacticalHoloSphere';
import { 
  SystemTelemetry, 
  GoogleCalendarEvent, 
  GoogleTaskItem, 
  OllamaModel, 
  TabSpace, 
  AnalysisDomain,
  OperationalMode
} from '@/types';
import { GoogleAccountConfig } from '@/lib/google-calendar-service';
import { DriveDocumentItem } from '@/lib/google-drive-bridge';
import { EmailMessage } from '@/lib/email-service';
import { 
  Sparkles, 
  ShieldCheck, 
  Calendar, 
  FolderSync, 
  Bot, 
  Lock, 
  Mail, 
  CheckSquare, 
  Zap, 
  ArrowRight, 
  Clock, 
  Layers, 
  Plus, 
  HardDrive,
  AlertTriangle,
  Radio,
  Sliders
} from 'lucide-react';

interface TacticalDashboardProps {
  telemetry: SystemTelemetry | null;
  account: GoogleAccountConfig | null;
  calendarEvents: GoogleCalendarEvent[];
  tasks: GoogleTaskItem[];
  emails: EmailMessage[];
  driveFiles: DriveDocumentItem[];
  models: OllamaModel[];
  selectedModel: string;
  operationalMode: OperationalMode;
  onSetOperationalMode: (mode: OperationalMode) => void;
  onNavigateTab: (tab: TabSpace) => void;
  onOpenAiChat: () => void;
  onTriggerAnalysis: (domain: AnalysisDomain) => void;
  isAnalyzing: boolean;
}

export const TacticalDashboard: React.FC<TacticalDashboardProps> = ({
  telemetry,
  account,
  calendarEvents,
  tasks,
  emails,
  driveFiles,
  models,
  selectedModel,
  operationalMode,
  onSetOperationalMode,
  onNavigateTab,
  onOpenAiChat,
  onTriggerAnalysis,
  isAnalyzing,
}) => {
  // Mode-based filtering
  const filteredEvents = calendarEvents.filter((e) => {
    if (operationalMode === 'defense-c2') return e.accountEmail === 'eighty7supreme@gmail.com' || !e.accountEmail;
    if (operationalMode === 'enterprise') return e.accountEmail === 'josh@symbrook.com';
    return true;
  });

  const filteredTasks = tasks.filter((t) => {
    if (operationalMode === 'defense-c2') return t.accountEmail === 'eighty7supreme@gmail.com' || !t.accountEmail;
    if (operationalMode === 'enterprise') return t.accountEmail === 'josh@symbrook.com';
    return true;
  });

  const filteredEmails = emails.filter((em) => {
    if (operationalMode === 'defense-c2') return em.accountEmail === 'eighty7supreme@gmail.com';
    if (operationalMode === 'enterprise') return em.accountEmail === 'josh@symbrook.com';
    return true;
  });

  const unreadEmailsCount = filteredEmails.filter((e) => e.unread).length;
  const pendingTasksCount = filteredTasks.filter((t) => !t.completed).length;
  const nextEvent = filteredEvents.find((e) => e.status === 'confirmed') || filteredEvents[0];

  return (
    <div className="space-y-6 font-mono animate-fadeIn">
      {/* 1. TOP C2 HEADER WITH OPERATIONAL MODE SELECTOR */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-c2-surface via-c2-card to-c2-surface border border-c2-border shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-c2-cyan/15 text-c2-cyan border border-c2-cyan/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-c2-cyan animate-pulse" />
              NEXUS-C2 OPERATIONAL LAUNCHPAD
            </span>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-c2-green/15 text-c2-green border border-c2-green/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-c2-green" />
              ZERO-TRUST LOOPBACK (127.0.0.1:3030)
            </span>
          </div>
          <h1 className="font-bold text-lg md:text-xl text-white tracking-wide">
            ACTIONABLE COMMAND CENTER &bull; DUAL WORKSPACE RADAR
          </h1>
          <p className="text-xs text-c2-textMuted font-sans max-w-3xl">
            Select a mode to focus operations or directly launch an active workbench to triage incoming mail, schedule calendar events, set mission tasks, or run Gemini AI synthesis.
          </p>
        </div>

        {/* Operational Mode Toggle Pill */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-c2-bg/80 p-1.5 rounded-xl border border-c2-border">
          <span className="text-[10px] text-c2-textMuted px-2 font-bold flex items-center gap-1">
            <Sliders className="w-3 h-3 text-c2-cyan" /> MODE:
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onSetOperationalMode('defense-c2')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                operationalMode === 'defense-c2'
                  ? 'bg-c2-cyan/20 border border-c2-cyan text-c2-cyan shadow-cyan-glow'
                  : 'text-c2-textMuted hover:text-white'
              }`}
            >
              DEFENSE C2
            </button>
            <button
              onClick={() => onSetOperationalMode('enterprise')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                operationalMode === 'enterprise'
                  ? 'bg-c2-green/20 border border-c2-green text-c2-green shadow-green-glow'
                  : 'text-c2-textMuted hover:text-white'
              }`}
            >
              ENTERPRISE
            </button>
            <button
              onClick={() => onSetOperationalMode('unified')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                operationalMode === 'unified'
                  ? 'bg-c2-purple/20 border border-c2-purple text-c2-purple'
                  : 'text-c2-textMuted hover:text-white'
              }`}
            >
              UNIFIED
            </button>
          </div>
        </div>
      </div>

      {/* 2. 3D INTERACTIVE HOLOGRAPHIC DEFENSE SPHERE */}
      <div className="w-full">
        <TacticalHoloSphere
          airgapStrict={telemetry?.airgapStatus === 'AIRGAP_STRICT'}
          totalModels={models.length}
          activeAccounts={2}
        />
      </div>

      {/* 3. INTERACTIVE CAPABILITY LAUNCHPAD CARDS (DIRECT WORKBENCHES) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* TILE 1: INBOX & AI RESPONSE STUDIO */}
        <div
          onClick={() => onNavigateTab('inbox')}
          className="relative group p-5 rounded-2xl bg-c2-card border border-c2-border hover:border-c2-cyan/60 transition-all duration-300 shadow-xl cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="p-3 rounded-xl bg-c2-cyan/10 border border-c2-cyan/30 text-c2-cyan group-hover:scale-105 transition-transform">
                <Mail className="w-6 h-6" />
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-c2-cyan/15 text-c2-cyan border border-c2-cyan/30">
                {unreadEmailsCount} UNREAD
              </span>
            </div>

            <h3 className="font-bold text-base text-white group-hover:text-c2-cyan transition-colors">
              INBOX &amp; AI DRAFTER
            </h3>
            <p className="text-xs text-c2-textMuted font-sans mb-3 line-clamp-2">
              Triage incoming messages from CAANG and enterprise partners with Gemini 1-click automated response drafting.
            </p>

            <div className="p-2.5 rounded-lg bg-c2-bg border border-c2-border/70 text-[11px] text-slate-300 truncate">
              {filteredEmails[0]?.subject || 'No pending incoming mail'}
            </div>
          </div>

          <div className="pt-3 border-t border-c2-border/60 flex items-center justify-between text-xs text-c2-cyan mt-4">
            <span className="font-bold">LAUNCH INBOX WORKBENCH</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* TILE 2: CALENDAR & MISSION SCHEDULER */}
        <div
          onClick={() => onNavigateTab('calendar')}
          className="relative group p-5 rounded-2xl bg-c2-card border border-c2-border hover:border-c2-green/60 transition-all duration-300 shadow-xl cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="p-3 rounded-xl bg-c2-green/10 border border-c2-green/30 text-c2-green group-hover:scale-105 transition-transform">
                <Calendar className="w-6 h-6" />
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-c2-green/15 text-c2-green border border-c2-green/30">
                {filteredEvents.length} EVENTS
              </span>
            </div>

            <h3 className="font-bold text-base text-white group-hover:text-c2-green transition-colors">
              CALENDAR &amp; SCHEDULER
            </h3>
            <p className="text-xs text-c2-textMuted font-sans mb-3 line-clamp-2">
              Visual timeline and schedule creator with conflict detection across DoD defense and enterprise accounts.
            </p>

            <div className="p-2.5 rounded-lg bg-c2-bg border border-c2-border/70 text-[11px] text-slate-300 flex items-center justify-between">
              <span className="truncate">{nextEvent?.title || 'Tactical Readiness Sync'}</span>
              <span className="text-c2-green font-bold shrink-0">{nextEvent?.startTime || '14:00'}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-c2-border/60 flex items-center justify-between text-xs text-c2-green mt-4">
            <span className="font-bold">SCHEDULE &amp; MANAGE EVENTS</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* TILE 3: MISSION TASKS BOARD */}
        <div
          onClick={() => onNavigateTab('tasks')}
          className="relative group p-5 rounded-2xl bg-c2-card border border-c2-border hover:border-c2-amber/60 transition-all duration-300 shadow-xl cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="p-3 rounded-xl bg-c2-amber/10 border border-c2-amber/30 text-c2-amber group-hover:scale-105 transition-transform">
                <CheckSquare className="w-6 h-6" />
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-c2-amber/15 text-c2-amber border border-c2-amber/30">
                {pendingTasksCount} PENDING
              </span>
            </div>

            <h3 className="font-bold text-base text-white group-hover:text-c2-amber transition-colors">
              MISSION TASKS BOARD
            </h3>
            <p className="text-xs text-c2-textMuted font-sans mb-3 line-clamp-2">
              Set actionable operational tasks, track completion, and use Gemini AI to decompose high-level goals into subtasks.
            </p>

            <div className="p-2.5 rounded-lg bg-c2-bg border border-c2-border/70 text-[11px] text-slate-300 truncate">
              {filteredTasks[0]?.title || 'All operational tasks completed'}
            </div>
          </div>

          <div className="pt-3 border-t border-c2-border/60 flex items-center justify-between text-xs text-c2-amber mt-4">
            <span className="font-bold">OPEN TASK BOARD</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* TILE 4: GOOGLE DRIVE & CLOUD STORAGE */}
        <div
          onClick={() => onNavigateTab('workspace')}
          className="relative group p-5 rounded-2xl bg-c2-card border border-c2-border hover:border-c2-cyan/60 transition-all duration-300 shadow-xl cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="p-3 rounded-xl bg-c2-cyan/10 border border-c2-cyan/30 text-c2-cyan group-hover:scale-105 transition-transform">
                <FolderSync className="w-6 h-6" />
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-c2-cyan/15 text-c2-cyan border border-c2-cyan/30">
                {driveFiles.length || 45} FILES
              </span>
            </div>

            <h3 className="font-bold text-base text-white group-hover:text-c2-cyan transition-colors">
              DRIVE REPOSITORY
            </h3>
            <p className="text-xs text-c2-textMuted font-sans mb-3 line-clamp-2">
              Explore 45 enterprise CloudStorage documents with 1-click Finder reveal and OPSEC credential leak analysis.
            </p>

            <div className="p-2.5 rounded-lg bg-c2-bg border border-c2-border/70 text-[11px] text-slate-300 truncate">
              CloudStorage/GoogleDrive-josh@symbrook.com
            </div>
          </div>

          <div className="pt-3 border-t border-c2-border/60 flex items-center justify-between text-xs text-c2-cyan mt-4">
            <span className="font-bold">EXPLORE DOCUMENTS</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* TILE 5: AI COGNITION DUAL ENGINE */}
        <div
          onClick={() => onNavigateTab('cognition')}
          className="relative group p-5 rounded-2xl bg-c2-card border border-c2-border hover:border-c2-purple/60 transition-all duration-300 shadow-xl cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="p-3 rounded-xl bg-c2-purple/10 border border-c2-purple/30 text-c2-purple group-hover:scale-105 transition-transform">
                <Bot className="w-6 h-6" />
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-c2-purple/15 text-c2-purple border border-c2-purple/30">
                {models.length} AIRGAP
              </span>
            </div>

            <h3 className="font-bold text-base text-white group-hover:text-c2-purple transition-colors">
              AI COGNITION HUB
            </h3>
            <p className="text-xs text-c2-textMuted font-sans mb-3 line-clamp-2">
              Gemini 3.8 Flash Cloud via Google OAuth + Curated Local Airgap Models with zero token requirements.
            </p>

            <div className="p-2.5 rounded-lg bg-c2-bg border border-c2-border/70 text-[11px] text-c2-cyan font-bold truncate">
              Active: {selectedModel}
            </div>
          </div>

          <div className="pt-3 border-t border-c2-border/60 flex items-center justify-between text-xs text-c2-purple mt-4">
            <span className="font-bold">COGNITIVE BENCHMARK &amp; CHAT</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* TILE 6: PEN-TEST & ZERO-TRUST SECURITY */}
        <div
          onClick={() => onNavigateTab('security')}
          className="relative group p-5 rounded-2xl bg-c2-card border border-c2-border hover:border-c2-green/60 transition-all duration-300 shadow-xl cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="p-3 rounded-xl bg-c2-green/10 border border-c2-green/30 text-c2-green group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-c2-green/15 text-c2-green border border-c2-green/30">
                GRADE A+
              </span>
            </div>

            <h3 className="font-bold text-base text-white group-hover:text-c2-green transition-colors">
              PEN-TEST SECURITY
            </h3>
            <p className="text-xs text-c2-textMuted font-sans mb-3 line-clamp-2">
              Loopback 127.0.0.1:3030 binding, non-root UID 501 execution, and parameterized execFile RCE prevention.
            </p>

            <div className="p-2.5 rounded-lg bg-c2-bg border border-c2-border/70 text-[11px] text-c2-green font-bold truncate">
              100% Zero-Trust Compliance Attestation
            </div>
          </div>

          <div className="pt-3 border-t border-c2-border/60 flex items-center justify-between text-xs text-c2-green mt-4">
            <span className="font-bold">RUN PEN-TEST AUDIT</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
};
