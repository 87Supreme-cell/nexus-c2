'use client';

import React, { useEffect, useState } from 'react';
import { TabSpace } from '@/types';
import { 
  Terminal, 
  Bot, 
  Activity, 
  Radio, 
  Sparkles,
  Calendar,
  Grid,
  Target,
  Boxes,
  Link,
  UserCheck
} from 'lucide-react';
import { GoogleAccountConfig } from '@/lib/google-calendar-service';

interface HeaderHUDProps {
  activeTab: TabSpace;
  setActiveTab: (tab: TabSpace) => void;
  onToggleAi: () => void;
  isAiOpen: boolean;
  selectedModel: string;
  account: GoogleAccountConfig | null;
  onOpenConnectModal: () => void;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  activeTab,
  setActiveTab,
  onToggleAi,
  isAiOpen,
  selectedModel,
  account,
  onOpenConnectModal,
}) => {
  const [zuluTime, setZuluTime] = useState<string>('');
  const [localTime, setLocalTime] = useState<string>('');
  const [isLaunchingAgy, setIsLaunchingAgy] = useState(false);
  const [agyMessage, setAgyMessage] = useState<string | null>(null);

  useEffect(() => {
    const updateClocks = () => {
      const now = new Date();
      setZuluTime(now.toISOString().substring(11, 19) + 'Z');
      setLocalTime(now.toLocaleTimeString('en-US', { hour12: false }));
    };
    updateClocks();
    const interval = setInterval(updateClocks, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLaunchAntigravity = async () => {
    setIsLaunchingAgy(true);
    setAgyMessage('Initiating Antigravity terminal bridge...');
    try {
      const res = await fetch('/api/antigravity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'open-terminal' }),
      });
      const data = await res.json();
      if (data.success) {
        setAgyMessage('AGY Builder spawned in Terminal');
      } else {
        setAgyMessage(data.error || 'Failed spawning AGY');
      }
    } catch {
      setAgyMessage('Failed reaching AGY bridge');
    } finally {
      setTimeout(() => {
        setIsLaunchingAgy(false);
        setAgyMessage(null);
      }, 4000);
    }
  };

  const TABS: { id: TabSpace; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: 'workspace', label: 'Google Workspace', icon: Calendar, badge: account?.connected ? 'Linked' : undefined },
    { id: 'apps', label: 'App Launcher', icon: Grid },
    { id: 'goals', label: 'Mission Objectives', icon: Target },
    { id: 'docker', label: 'Docker Cluster', icon: Boxes },
    { id: 'cognition', label: 'AI Cognition', icon: Bot },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-c2-border bg-c2-bg/95 backdrop-blur-md">
      {/* Top DoD Micro-bar */}
      <div className="bg-c2-surface border-b border-c2-border px-4 py-1 flex items-center justify-between text-[11px] font-mono text-c2-textMuted">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-c2-green animate-pulse" />
          <span className="text-c2-cyan font-bold">// C2 COMMAND DECK //</span>
          <span className="hidden sm:inline text-c2-textMuted">SECURITY: ZERO-TRUST AIRGAP</span>
        </div>

        {/* Zulu and Local Clocks */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-c2-textMuted text-[10px]">ZULU:</span>
            <span className="text-c2-cyan font-semibold">{zuluTime || '00:00:00Z'}</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-c2-textMuted text-[10px]">LOCAL:</span>
            <span className="text-white font-semibold">{localTime || '00:00:00'}</span>
          </div>
          <div className="flex items-center gap-1 text-c2-green">
            <Radio className="w-3 h-3 animate-pulse" />
            <span className="text-[10px] font-bold">DEFCON 1</span>
          </div>
        </div>
      </div>

      {/* Main Bar with Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Branding */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-c2-surface border border-c2-cyan/60 shadow-cyan-glow">
            <Activity className="w-5 h-5 text-c2-cyan animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold font-mono tracking-wider text-white">
                NEXUS<span className="text-c2-cyan">-C2</span>
              </h1>
            </div>
          </div>
        </div>

        {/* Center: REAL WORKSPACE TABS */}
        <nav className="flex items-center gap-1 bg-c2-surface p-1 rounded-xl border border-c2-border overflow-x-auto scrollbar-none">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-c2-cyan text-c2-bg shadow-cyan-glow scale-[1.02]'
                    : 'text-c2-textMuted hover:text-white hover:bg-c2-surfaceHover'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-c2-bg text-c2-green font-bold' : 'bg-c2-green/20 text-c2-green'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Connect Account & Antigravity Launcher */}
        <div className="flex items-center gap-2">
          {/* Quick Connect Account Button */}
          <button
            onClick={onOpenConnectModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
              account?.connected
                ? 'bg-c2-green/10 border-c2-green/40 text-c2-green hover:bg-c2-green/20'
                : 'bg-c2-amber/10 border-c2-amber/50 text-c2-amber hover:bg-c2-amber/20 shadow-amber-glow animate-pulse'
            }`}
            title="Configure and connect your Google Calendar & Account"
          >
            {account?.connected ? <UserCheck className="w-3.5 h-3.5" /> : <Link className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">
              {account?.connected ? (account.email ? account.email.split('@')[0] : 'Linked') : 'Connect Account'}
            </span>
          </button>

          {/* Antigravity CLI Launcher */}
          <button
            onClick={handleLaunchAntigravity}
            disabled={isLaunchingAgy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-c2-amber/60 text-c2-amber hover:bg-c2-amber/20 transition-all font-mono text-xs font-bold shadow-amber-glow disabled:opacity-50"
            title="Launch Antigravity CLI in a new dedicated terminal"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{isLaunchingAgy ? 'LAUNCHING...' : 'AGY BUILDER'}</span>
          </button>
        </div>
      </div>

      {/* Temporary Toast for Antigravity spawn */}
      {agyMessage && (
        <div className="bg-c2-amber/10 border-t border-b border-c2-amber/30 px-4 py-1 text-center text-xs font-mono text-c2-amber flex items-center justify-center gap-2 animate-fadeIn">
          <Terminal className="w-3.5 h-3.5" />
          <span>{agyMessage}</span>
        </div>
      )}
    </header>
  );
};
