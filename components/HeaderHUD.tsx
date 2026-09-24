'use client';

import React, { useEffect, useState } from 'react';
import { ViewMode } from '@/types';
import { 
  ShieldAlert, 
  Terminal, 
  Bot, 
  Layers, 
  Activity, 
  Radio, 
  Sparkles,
  Command,
  ExternalLink
} from 'lucide-react';

interface HeaderHUDProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onToggleAi: () => void;
  isAiOpen: boolean;
  selectedModel: string;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  viewMode,
  setViewMode,
  onToggleAi,
  isAiOpen,
  selectedModel,
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
    } catch (err: any) {
      setAgyMessage('Failed reaching AGY bridge');
    } finally {
      setTimeout(() => {
        setIsLaunchingAgy(false);
        setAgyMessage(null);
      }, 4000);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-c2-border bg-c2-bg/90 backdrop-blur-md">
      {/* Classification Banner - DoD Standard */}
      <div className="bg-gradient-to-r from-c2-surface via-c2-surfaceHover to-c2-surface border-b border-c2-cyan/20 px-4 py-0.5 text-center flex items-center justify-between text-[11px] font-mono tracking-widest text-c2-cyan">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-c2-green animate-pulse" />
          <span>// C2 DEFENSE COMMAND // AIRGAP READY //</span>
        </div>
        <div className="hidden md:flex items-center gap-4 text-c2-textMuted">
          <span>HOST: macOS Darwin</span>
          <span>•</span>
          <span>SECURITY POSTURE: ZERO-TRUST</span>
          <span>•</span>
          <span>ANTIGRAVITY: ENGAGED</span>
        </div>
        <div className="flex items-center gap-2 text-c2-green">
          <Radio className="w-3 h-3 animate-pulse" />
          <span>DEFCON 1 : NOMINAL</span>
        </div>
      </div>

      {/* Main Command Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Branding & Core Radar */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-c2-surface border border-c2-cyan shadow-cyan-glow">
            <Activity className="w-5 h-5 text-c2-cyan animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-c2-green border border-c2-bg" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold font-mono tracking-wider text-white">
                NEXUS<span className="text-c2-cyan">-C2</span>
              </h1>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-c2-cyan/10 border border-c2-cyan/30 text-c2-cyan font-mono font-semibold">
                TACTICAL COMMAND DECK
              </span>
            </div>
            <p className="text-xs text-c2-textMuted font-mono">Google Ecosystem • Local Runtimes • Autonomous Agents</p>
          </div>
        </div>

        {/* Center: Mission Clocks & View Switcher */}
        <div className="flex items-center gap-3">
          {/* Zulu & Local Clocks */}
          <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-c2-surface border border-c2-border font-mono text-xs">
            <div>
              <span className="text-c2-textMuted block text-[10px] leading-tight">ZULU / UTC</span>
              <span className="text-c2-cyan font-semibold">{zuluTime || '00:00:00Z'}</span>
            </div>
            <div className="h-6 w-px bg-c2-border" />
            <div>
              <span className="text-c2-textMuted block text-[10px] leading-tight">LOCAL TIME</span>
              <span className="text-white font-semibold">{localTime || '00:00:00'}</span>
            </div>
          </div>

          {/* View Modes Selector */}
          <div className="flex items-center p-1 rounded-lg bg-c2-surface border border-c2-border">
            <button
              onClick={() => setViewMode('tactical-c2')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono transition-all ${
                viewMode === 'tactical-c2'
                  ? 'bg-c2-cyan text-c2-bg font-bold shadow-cyan-glow'
                  : 'text-c2-textMuted hover:text-white'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Tactical C2</span>
            </button>
            <button
              onClick={() => setViewMode('cyber-glass')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono transition-all ${
                viewMode === 'cyber-glass'
                  ? 'bg-c2-purple text-white font-bold shadow-lg'
                  : 'text-c2-textMuted hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Cyber Glass</span>
            </button>
            <button
              onClick={() => setViewMode('google-ops')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono transition-all ${
                viewMode === 'google-ops'
                  ? 'bg-c2-green text-c2-bg font-bold shadow-green-glow'
                  : 'text-c2-textMuted hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Google Ops</span>
            </button>
          </div>
        </div>

        {/* Right: Antigravity Launcher & AI Drawer Toggle */}
        <div className="flex items-center gap-2">
          {/* Antigravity Launch Button */}
          <button
            onClick={handleLaunchAntigravity}
            disabled={isLaunchingAgy}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-c2-amber/60 text-c2-amber hover:bg-c2-amber/20 transition-all font-mono text-xs font-bold shadow-amber-glow disabled:opacity-50"
            title="Launch Antigravity CLI session in dedicated terminal"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>{isLaunchingAgy ? 'SPAWNING...' : 'LAUNCH AGY'}</span>
          </button>

          {/* Tactical AI Copilot Toggle */}
          <button
            onClick={onToggleAi}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-xs font-bold transition-all ${
              isAiOpen
                ? 'bg-c2-cyan text-c2-bg border-c2-cyan shadow-cyan-glow'
                : 'bg-c2-surface border-c2-cyan/40 text-c2-cyan hover:border-c2-cyan'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span className="hidden lg:inline">COGNITION</span>
            <span className="text-[10px] opacity-80 max-w-[90px] truncate">({selectedModel.split(':')[0]})</span>
          </button>
        </div>
      </div>

      {/* Temporary Toast for Antigravity spawn */}
      {agyMessage && (
        <div className="bg-c2-amber/10 border-t border-b border-c2-amber/30 px-4 py-1.5 text-center text-xs font-mono text-c2-amber flex items-center justify-center gap-2 animate-fadeIn">
          <Terminal className="w-3.5 h-3.5" />
          <span>{agyMessage}</span>
        </div>
      )}
    </header>
  );
};
