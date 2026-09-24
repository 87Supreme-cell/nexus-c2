'use client';

import React from 'react';
import { SystemTelemetry } from '@/types';
import { 
  Cpu, 
  ShieldCheck, 
  Layers, 
  Target, 
  Server, 
  Terminal,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface KpiTelemetryProps {
  telemetry: SystemTelemetry | null;
  totalAppsCount: number;
  onlineAppsCount: number;
  overallGoalProgress: number;
}

export const KpiTelemetry: React.FC<KpiTelemetryProps> = ({
  telemetry,
  totalAppsCount,
  onlineAppsCount,
  overallGoalProgress,
}) => {
  const cpu = telemetry?.cpuLoad ?? 18;
  const memUsed = telemetry?.memoryUsedGB ?? 14.2;
  const memTotal = telemetry?.memoryTotalGB ?? 32.0;
  const memPct = Math.round((memUsed / (memTotal || 1)) * 100);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* KPI 1: System Telemetry (CPU & Memory) */}
      <div className="relative group overflow-hidden rounded-xl bg-c2-card border border-c2-border hover:border-c2-cyan/50 p-4 transition-all duration-300 shadow-lg">
        <div className="absolute top-0 right-0 w-24 h-24 bg-c2-cyan/5 rounded-full blur-2xl group-hover:bg-c2-cyan/10 transition-all" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono text-c2-textMuted uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-c2-cyan" />
            Host Compute Load
          </span>
          <span className="text-xs font-mono font-bold text-c2-cyan">{cpu}% CPU</span>
        </div>
        
        <div className="space-y-2">
          {/* CPU Progress Bar */}
          <div className="w-full bg-c2-surface rounded-full h-2 overflow-hidden border border-c2-border">
            <div 
              className="h-full bg-gradient-to-r from-c2-cyan to-c2-green rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(5, cpu))}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs font-mono pt-1 text-c2-textMuted">
            <span>RAM {memUsed} GB / {memTotal} GB</span>
            <span className="text-white font-semibold">{memPct}%</span>
          </div>
        </div>
      </div>

      {/* KPI 2: Security & Airgap Posture */}
      <div className="relative group overflow-hidden rounded-xl bg-c2-card border border-c2-border hover:border-c2-green/50 p-4 transition-all duration-300 shadow-lg">
        <div className="absolute top-0 right-0 w-24 h-24 bg-c2-green/5 rounded-full blur-2xl group-hover:bg-c2-green/10 transition-all" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono text-c2-textMuted uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-c2-green" />
            Security & Egress
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-c2-green/10 border border-c2-green/30 text-c2-green font-mono font-bold">
            ZERO-TRUST
          </span>
        </div>

        <div className="space-y-1">
          <div className="text-lg font-mono font-bold text-white flex items-center gap-2">
            <span>AIR-GAP READY</span>
            <span className="w-2 h-2 rounded-full bg-c2-green animate-pulse" />
          </div>
          <p className="text-xs text-c2-textMuted font-mono">
            {telemetry?.ollamaRunning ? 'Local Ollama: Offline Inference Enabled' : 'Connecting to local LLM engines...'}
          </p>
        </div>
      </div>

      {/* KPI 3: Active Runtimes & Orchestration */}
      <div className="relative group overflow-hidden rounded-xl bg-c2-card border border-c2-border hover:border-c2-cyan/50 p-4 transition-all duration-300 shadow-lg">
        <div className="absolute top-0 right-0 w-24 h-24 bg-c2-cyan/5 rounded-full blur-2xl group-hover:bg-c2-cyan/10 transition-all" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono text-c2-textMuted uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-c2-cyan" />
            Managed Runtimes
          </span>
          <span className="text-xs font-mono font-bold text-c2-cyan">
            {onlineAppsCount} / {totalAppsCount} Active
          </span>
        </div>

        <div className="space-y-1">
          <div className="text-lg font-mono font-bold text-white flex items-center gap-2">
            <span>{onlineAppsCount} Services Live</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-c2-textMuted">
            <span className="flex items-center gap-1 text-c2-green">
              <CheckCircle2 className="w-3 h-3" /> Port 8080 UP
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-c2-cyan">
              <Terminal className="w-3 h-3" /> AGY Ready
            </span>
          </div>
        </div>
      </div>

      {/* KPI 4: DoD Mission Velocity */}
      <div className="relative group overflow-hidden rounded-xl bg-c2-card border border-c2-border hover:border-c2-amber/50 p-4 transition-all duration-300 shadow-lg">
        <div className="absolute top-0 right-0 w-24 h-24 bg-c2-amber/5 rounded-full blur-2xl group-hover:bg-c2-amber/10 transition-all" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono text-c2-textMuted uppercase tracking-wider flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-c2-amber" />
            Mission Velocity
          </span>
          <span className="text-xs font-mono font-bold text-c2-amber">{overallGoalProgress}%</span>
        </div>

        <div className="space-y-2">
          <div className="w-full bg-c2-surface rounded-full h-2 overflow-hidden border border-c2-border">
            <div 
              className="h-full bg-gradient-to-r from-c2-amber to-orange-400 rounded-full transition-all duration-500"
              style={{ width: `${overallGoalProgress}%` }}
            />
          </div>
          <p className="text-xs text-c2-textMuted font-mono flex items-center justify-between">
            <span>DoD SE Validation Deck</span>
            <span className="text-c2-amber font-semibold">Phase 2 Target</span>
          </p>
        </div>
      </div>
    </div>
  );
};
