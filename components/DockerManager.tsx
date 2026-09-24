'use client';

import React, { useState } from 'react';
import { DockerContainer } from '@/types';
import { 
  Boxes, 
  Play, 
  Square, 
  RotateCw, 
  CheckCircle2, 
  AlertTriangle,
  Loader2,
  Terminal,
  Power
} from 'lucide-react';

interface DockerManagerProps {
  containers: DockerContainer[];
  dockerRunning: boolean;
  onRefresh: () => void;
}

export const DockerManager: React.FC<DockerManagerProps> = ({
  containers,
  dockerRunning,
  onRefresh,
}) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [startingDaemon, setStartingDaemon] = useState(false);

  const handleContainerAction = async (action: 'start' | 'stop' | 'restart', containerId: string) => {
    setLoadingId(containerId);
    try {
      await fetch('/api/docker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, containerId }),
      });
      onRefresh();
    } catch (err) {
      console.error('Docker action failed:', err);
    } finally {
      setLoadingId(null);
    }
  };

  const handleStartDaemon = async () => {
    setStartingDaemon(true);
    try {
      await fetch('/api/docker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start-daemon' }),
      });
      setTimeout(() => {
        onRefresh();
        setStartingDaemon(false);
      }, 5000);
    } catch (err) {
      setStartingDaemon(false);
    }
  };

  return (
    <div className="rounded-xl bg-c2-card border border-c2-border overflow-hidden mb-8 shadow-xl">
      {/* Header */}
      <div className="p-4 bg-c2-surface border-b border-c2-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-c2-amber/10 border border-c2-amber/30 text-c2-amber">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-mono font-bold text-sm text-white flex items-center gap-2">
              DOCKER CLUSTER & VIRTUALIZATION ENGINE
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                  dockerRunning
                    ? 'bg-c2-green/10 text-c2-green border border-c2-green/30'
                    : 'bg-c2-amber/10 text-c2-amber border border-c2-amber/30'
                }`}
              >
                {dockerRunning ? 'DAEMON ONLINE' : 'DAEMON STANDBY'}
              </span>
            </h2>
            <p className="text-xs text-c2-textMuted font-mono">
              Containerized microservices, isolated testing sandboxes & DOD edge images
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!dockerRunning && (
            <button
              onClick={handleStartDaemon}
              disabled={startingDaemon}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-c2-amber/20 hover:bg-c2-amber/30 border border-c2-amber text-c2-amber text-xs font-mono font-bold transition-all shadow-amber-glow disabled:opacity-50"
            >
              <Power className="w-3.5 h-3.5" />
              <span>{startingDaemon ? 'STARTING DOCKER...' : 'START DOCKER DESKTOP'}</span>
            </button>
          )}
          <button
            onClick={onRefresh}
            className="p-1.5 rounded-lg bg-c2-bg hover:bg-c2-surfaceHover border border-c2-border text-c2-textMuted hover:text-c2-amber transition-all"
            title="Refresh Docker containers"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {!dockerRunning ? (
          <div className="py-6 text-center rounded-lg bg-c2-surface border border-c2-border/60">
            <AlertTriangle className="w-8 h-8 text-c2-amber mx-auto mb-2 opacity-80" />
            <h4 className="text-sm font-mono font-bold text-white mb-1">Docker Daemon Currently Offline</h4>
            <p className="text-xs text-c2-textMuted font-mono max-w-md mx-auto mb-3">
              Docker Desktop is not currently active on this Mac. Click &quot;START DOCKER DESKTOP&quot; to initialize container virtualization.
            </p>
          </div>
        ) : containers.length === 0 ? (
          <div className="py-6 text-center rounded-lg bg-c2-surface border border-c2-border/60">
            <CheckCircle2 className="w-8 h-8 text-c2-green mx-auto mb-2 opacity-80" />
            <h4 className="text-sm font-mono font-bold text-white mb-1">Docker Daemon Running</h4>
            <p className="text-xs text-c2-textMuted font-mono">
              No containers currently deployed. Launch a container via Docker CLI or register a docker service.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-c2-border text-c2-textMuted text-[11px]">
                  <th className="pb-2">NAME / ID</th>
                  <th className="pb-2">IMAGE</th>
                  <th className="pb-2">STATE</th>
                  <th className="pb-2">PORTS</th>
                  <th className="pb-2 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-c2-border/40">
                {containers.map((container) => {
                  const isRunning = container.state === 'running';
                  return (
                    <tr key={container.id} className="hover:bg-c2-surface/60 transition-colors">
                      <td className="py-3 font-bold text-white">
                        <div>{container.name}</div>
                        <div className="text-[10px] text-c2-textMuted font-normal">{container.id.slice(0, 12)}</div>
                      </td>
                      <td className="py-3 text-c2-cyan">{container.image}</td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                            isRunning
                              ? 'bg-c2-green/10 border-c2-green/30 text-c2-green'
                              : 'bg-c2-textMuted/10 border-c2-border text-c2-textMuted'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-c2-green' : 'bg-c2-textMuted'}`} />
                          {container.state.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 text-c2-textMuted">{container.ports || '—'}</td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isRunning ? (
                            <button
                              onClick={() => handleContainerAction('stop', container.id)}
                              disabled={loadingId === container.id}
                              className="px-2 py-1 rounded bg-c2-red/10 hover:bg-c2-red/20 border border-c2-red/30 text-c2-red transition-all"
                              title="Stop container"
                            >
                              {loadingId === container.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Square className="w-3 h-3" />}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleContainerAction('start', container.id)}
                              disabled={loadingId === container.id}
                              className="px-2 py-1 rounded bg-c2-green/10 hover:bg-c2-green/20 border border-c2-green/30 text-c2-green transition-all"
                              title="Start container"
                            >
                              {loadingId === container.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                            </button>
                          )}
                          <button
                            onClick={() => handleContainerAction('restart', container.id)}
                            disabled={loadingId === container.id}
                            className="px-2 py-1 rounded bg-c2-surface hover:bg-c2-surfaceHover border border-c2-border text-c2-textMuted hover:text-white transition-all"
                            title="Restart container"
                          >
                            <RotateCw className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
