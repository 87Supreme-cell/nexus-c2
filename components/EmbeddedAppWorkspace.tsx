'use client';

import React, { useState } from 'react';
import { AppItem, GoogleCalendarEvent } from '@/types';
import { DriveDocumentItem } from '@/lib/google-drive-bridge';
import { 
  X, 
  RotateCw, 
  ExternalLink, 
  Terminal, 
  Calendar, 
  FolderSync, 
  Bot, 
  Check, 
  Loader2, 
  Maximize2, 
  Minimize2,
  Folder,
  Play,
  FileText
} from 'lucide-react';

interface EmbeddedAppWorkspaceProps {
  app: AppItem | null;
  onClose: () => void;
  calendarEvents?: GoogleCalendarEvent[];
  driveFiles?: DriveDocumentItem[];
}

export const EmbeddedAppWorkspace: React.FC<EmbeddedAppWorkspaceProps> = ({
  app,
  onClose,
  calendarEvents = [],
  driveFiles = [],
}) => {
  const [iframeKey, setIframeKey] = useState(0);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    `[NEXUS-C2 IN-APP WORKSPACE ATTACHED]`,
    `Target: ${app?.name || 'Local App'}`,
    `Status: Runtime connected on loopback interface`,
  ]);
  const [commandInput, setCommandInput] = useState('');
  const [isRunningCommand, setIsRunningCommand] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!app) return null;

  const handleReload = () => {
    setIframeKey((prev) => prev + 1);
  };

  const handleRunCommand = async () => {
    if (!commandInput.trim() || isRunningCommand) return;
    const cmd = commandInput;
    setCommandInput('');
    setIsRunningCommand(true);
    setTerminalOutput((prev) => [...prev, `$ ${cmd}`]);

    try {
      const res = await fetch('/api/apps/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'run',
          appId: app.id,
          runCommand: cmd,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTerminalOutput((prev) => [...prev, `[SUCCESS]: Process executed.`]);
      } else {
        setTerminalOutput((prev) => [...prev, `[ERROR]: ${data.error || 'Execution failed'}`]);
      }
    } catch (err: any) {
      setTerminalOutput((prev) => [...prev, `[NETWORK ERROR]: ${err.message}`]);
    } finally {
      setIsRunningCommand(false);
    }
  };

  const handleLaunchExternal = () => {
    if (app.url) {
      window.open(app.url, '_blank');
    }
  };

  const isGoogleCalendar = app.name.toLowerCase().includes('calendar') || app.id.includes('calendar');
  const isGoogleDrive = app.name.toLowerCase().includes('drive') || app.id.includes('drive');
  const isTerminalOrCli = app.category === 'local-dev' || app.type === 'local-service';

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-c2-bg/85 backdrop-blur-md animate-fadeIn font-mono ${
      isFullscreen ? 'p-0' : ''
    }`}>
      <div className={`relative w-full ${
        isFullscreen ? 'h-screen rounded-none' : 'max-w-5xl h-[85vh] rounded-2xl'
      } bg-c2-surface border border-c2-cyan/50 shadow-2xl flex flex-col overflow-hidden transition-all duration-300`}>
        {/* Workspace Top Toolbar */}
        <div className="p-3 bg-c2-bg border-b border-c2-border flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-c2-green animate-pulse" />
            <h3 className="font-bold text-white text-sm">{app.name}</h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-c2-cyan/15 text-c2-cyan border border-c2-cyan/30">
              IN-APP WORKSPACE
            </span>
            {app.port && (
              <span className="text-[10px] text-c2-textMuted hidden sm:inline">
                PORT :{app.port}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Reload in-app */}
            <button
              onClick={handleReload}
              className="p-1.5 rounded-lg bg-c2-surface hover:bg-c2-surfaceHover border border-c2-border text-c2-textMuted hover:text-c2-cyan transition-all"
              title="Reload In-App View"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            {/* Toggle Fullscreen */}
            <button
              onClick={() => setIsFullscreen((prev) => !prev)}
              className="p-1.5 rounded-lg bg-c2-surface hover:bg-c2-surfaceHover border border-c2-border text-c2-textMuted hover:text-white transition-all"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {/* Optional external popout */}
            {app.url && (
              <button
                onClick={handleLaunchExternal}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-c2-surface hover:bg-c2-surfaceHover border border-c2-border text-[11px] text-c2-textMuted hover:text-white transition-all"
                title="Open in external browser window"
              >
                <ExternalLink className="w-3 h-3 text-c2-cyan" />
                <span className="hidden sm:inline">Pop Out</span>
              </button>
            )}

            {/* Close in-app workspace */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-c2-surface hover:bg-c2-surfaceHover border border-c2-border text-c2-textMuted hover:text-white transition-all ml-1"
              title="Close In-App View"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Workspace Main Canvas */}
        <div className="flex-1 bg-c2-bg overflow-hidden relative">
          {/* SPECIALIZED IN-APP VIEW 1: GOOGLE CALENDAR */}
          {isGoogleCalendar ? (
            <div className="w-full h-full p-6 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between border-b border-c2-border pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-c2-cyan" />
                  <h4 className="font-bold text-white text-base">In-App Google Calendar Manager</h4>
                </div>
                <span className="text-xs text-c2-green font-bold">
                  {calendarEvents.length} Synchronized Events
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {calendarEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3.5 rounded-xl bg-c2-surface border border-c2-border hover:border-c2-cyan/50 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-c2-cyan font-bold mb-1">
                        <span>{evt.startTime} - {evt.endTime}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-c2-green/15 text-c2-green border border-c2-green/30">
                          {evt.status.toUpperCase()}
                        </span>
                      </div>
                      <h5 className="font-bold text-sm text-white">{evt.title}</h5>
                      <span className="text-[10px] text-c2-textMuted">
                        Account: {evt.accountEmail || 'eighty7supreme@gmail.com'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : isGoogleDrive ? (
            /* SPECIALIZED IN-APP VIEW 2: GOOGLE DRIVE REPOSITORY */
            <div className="w-full h-full p-6 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between border-b border-c2-border pb-3">
                <div className="flex items-center gap-2">
                  <FolderSync className="w-5 h-5 text-c2-green" />
                  <h4 className="font-bold text-white text-base">In-App Google Drive Explorer</h4>
                </div>
                <span className="text-xs text-c2-green font-bold">
                  {driveFiles.length} CloudStorage Files Active
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {driveFiles.map((file) => (
                  <div
                    key={file.id}
                    className="p-3 rounded-xl bg-c2-surface border border-c2-border hover:border-c2-green/50 transition-all flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Folder className="w-4 h-4 text-c2-green shrink-0" />
                      <div className="truncate">
                        <span className="font-bold text-xs text-white block truncate">{file.name}</span>
                        <span className="text-[10px] text-c2-textMuted font-mono block truncate">
                          {file.relativePath || file.sizeFormatted}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : app.url && !isTerminalOrCli ? (
            /* GENERAL WEB RUNTIME EMBEDDED IFRAME */
            <iframe
              key={iframeKey}
              src={app.url}
              className="w-full h-full border-0 bg-c2-bg"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              title={app.name}
            />
          ) : (
            /* IN-APP INTERACTIVE TERMINAL & COMMAND RUNNER */
            <div className="w-full h-full flex flex-col p-4 bg-c2-bg text-xs">
              <div className="flex-1 overflow-y-auto space-y-1 text-slate-300 font-mono p-3 bg-black/60 rounded-xl border border-c2-border">
                {terminalOutput.map((line, idx) => (
                  <div key={idx} className="leading-relaxed">
                    {line.startsWith('$') ? (
                      <span className="text-c2-cyan font-bold">{line}</span>
                    ) : line.includes('[ERROR]') ? (
                      <span className="text-c2-red">{line}</span>
                    ) : line.includes('[SUCCESS]') ? (
                      <span className="text-c2-green">{line}</span>
                    ) : (
                      <span>{line}</span>
                    )}
                  </div>
                ))}
                {isRunningCommand && (
                  <div className="flex items-center gap-2 text-c2-cyan">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Executing process...</span>
                  </div>
                )}
              </div>

              {/* Command Input Bar */}
              <div className="pt-3 flex items-center gap-2">
                <span className="text-c2-cyan font-bold">$</span>
                <input
                  type="text"
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRunCommand();
                  }}
                  placeholder={app.runCommand ? `Run command (e.g. ${app.runCommand})` : 'Enter command...'}
                  className="flex-1 bg-c2-surface border border-c2-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-c2-cyan font-mono"
                />
                <button
                  onClick={handleRunCommand}
                  disabled={isRunningCommand || !commandInput.trim()}
                  className="px-4 py-2 rounded-lg bg-c2-cyan text-c2-bg font-bold text-xs disabled:opacity-40 hover:bg-c2-cyan/90 transition-all flex items-center gap-1.5"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>EXEC</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
