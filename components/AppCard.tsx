'use client';

import React, { useState } from 'react';
import { AppItem } from '@/types';
import { 
  Bot, 
  Compass, 
  Sparkles, 
  BookOpen, 
  GitPullRequest, 
  Video, 
  Calendar, 
  CheckSquare, 
  FolderSync, 
  Mail, 
  Cloud, 
  Cpu, 
  Boxes, 
  Terminal, 
  Play, 
  Square, 
  ExternalLink,
  Loader2,
  Check,
  AlertCircle,
  Box
} from 'lucide-react';

interface AppCardProps {
  app: AppItem;
  onRefresh: () => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Bot,
  Compass,
  Sparkles,
  BookOpen,
  GitPullRequest,
  Video,
  Calendar,
  CheckSquare,
  FolderSync,
  Mail,
  Cloud,
  Cpu,
  Boxes,
  Terminal,
  Box,
};

export const AppCard: React.FC<AppCardProps> = ({ app, onRefresh }) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const IconComponent = ICON_MAP[app.icon] || Box;

  const handleAction = async (action: 'launch' | 'run' | 'stop') => {
    setLoadingAction(action);
    setActionSuccess(null);
    try {
      const res = await fetch('/api/apps/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          appId: app.id,
          macAppPath: app.macAppPath,
          url: app.url,
          runCommand: app.runCommand,
          port: app.port,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(action === 'launch' ? 'Launched' : action === 'run' ? 'Started' : 'Stopped');
        setTimeout(() => setActionSuccess(null), 2500);
        onRefresh();
      }
    } catch (err) {
      console.error('App action failed:', err);
    } finally {
      setLoadingAction(null);
    }
  };

  const getCategoryColor = () => {
    switch (app.category) {
      case 'ai-models': return 'text-c2-cyan border-c2-cyan/30 bg-c2-cyan/10';
      case 'google-workspace': return 'text-c2-green border-c2-green/30 bg-c2-green/10';
      case 'docker': return 'text-c2-amber border-c2-amber/30 bg-c2-amber/10';
      case 'local-dev': return 'text-c2-purple border-c2-purple/30 bg-c2-purple/10';
      default: return 'text-c2-textMuted border-c2-border bg-c2-surface';
    }
  };

  const isOnline = app.status === 'online';

  return (
    <div className="relative group flex flex-col justify-between rounded-xl bg-c2-card border border-c2-border hover:border-c2-cyan/40 p-4 transition-all duration-300 shadow-md hover:shadow-cyan-glow">
      {/* Top row: Icon, Category Badge & Status Pill */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg border ${getCategoryColor()} transition-all group-hover:scale-105`}>
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-mono font-bold text-sm text-white group-hover:text-c2-cyan transition-colors">
                  {app.name}
                </h3>
                {app.isNativeChromeApp && (
                  <span className="text-[9px] px-1 rounded bg-c2-surface border border-c2-border text-c2-textMuted font-mono">
                    CHROME APP
                  </span>
                )}
              </div>
              <span className="text-[10px] font-mono text-c2-textMuted block">
                {app.port ? `Port :${app.port}` : app.type.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                isOnline ? 'bg-c2-green animate-pulse' : 'bg-c2-textMuted'
              }`}
            />
            <span
              className={`text-[10px] font-mono font-bold ${
                isOnline ? 'text-c2-green' : 'text-c2-textMuted'
              }`}
            >
              {isOnline ? (app.pingMs ? `${app.pingMs}ms` : 'ONLINE') : 'STANDBY'}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-c2-textMuted font-sans mb-4 line-clamp-2">
          {app.description}
        </p>
      </div>

      {/* Action Bar */}
      <div className="pt-3 border-t border-c2-border/60 flex items-center justify-between gap-2">
        {/* Left: Launch / Open Window */}
        <button
          onClick={() => handleAction('launch')}
          disabled={loadingAction === 'launch'}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-c2-surface hover:bg-c2-surfaceHover border border-c2-border text-xs font-mono font-semibold text-white hover:text-c2-cyan transition-all disabled:opacity-50"
          title="Open application window"
        >
          {loadingAction === 'launch' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : actionSuccess === 'Launched' ? (
            <Check className="w-3.5 h-3.5 text-c2-green" />
          ) : (
            <ExternalLink className="w-3.5 h-3.5 text-c2-cyan" />
          )}
          <span>LAUNCH</span>
        </button>

        {/* Right: Run / Start Process (if runCommand exists) */}
        {app.runCommand && (
          <button
            onClick={() => handleAction('run')}
            disabled={loadingAction === 'run'}
            className="flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg bg-c2-green/10 hover:bg-c2-green/20 border border-c2-green/30 text-c2-green text-xs font-mono font-bold transition-all disabled:opacity-50"
            title={`Run command: ${app.runCommand}`}
          >
            {loadingAction === 'run' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3 h-3 fill-current" />
            )}
            <span className="hidden sm:inline">RUN</span>
          </button>
        )}

        {/* Stop button (if port or runCommand exists) */}
        {(app.port || app.runCommand) && isOnline && (
          <button
            onClick={() => handleAction('stop')}
            disabled={loadingAction === 'stop'}
            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-c2-red/10 hover:bg-c2-red/20 border border-c2-red/30 text-c2-red text-xs font-mono font-bold transition-all disabled:opacity-50"
            title="Stop service"
          >
            {loadingAction === 'stop' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Square className="w-3 h-3 fill-current" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};
