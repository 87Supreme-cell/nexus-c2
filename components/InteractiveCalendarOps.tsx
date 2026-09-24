'use client';

import React, { useState, useEffect } from 'react';
import { GoogleCalendarEvent } from '@/types';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  Trash2, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  ExternalLink, 
  AlertCircle,
  RotateCw,
  Zap,
  Filter
} from 'lucide-react';

interface InteractiveCalendarOpsProps {
  events: GoogleCalendarEvent[];
  onAddEvent: (title: string, startTime: string, accountEmail?: string) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<void>;
  onTriggerScheduleAnalysis: () => void;
  isAnalyzing: boolean;
  onRefresh: () => void;
}

export const InteractiveCalendarOps: React.FC<InteractiveCalendarOpsProps> = ({
  events,
  onAddEvent,
  onDeleteEvent,
  onTriggerScheduleAnalysis,
  isAnalyzing,
  onRefresh,
}) => {
  const [filterAccount, setFilterAccount] = useState<'all' | 'eighty7supreme@gmail.com' | 'josh@symbrook.com'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // New Event Form State
  const [newTitle, setNewTitle] = useState('');
  const [newStartTime, setNewStartTime] = useState('14:00');
  const [newEndTime, setNewEndTime] = useState('15:00');
  const [newEventAccount, setNewEventAccount] = useState<'eighty7supreme@gmail.com' | 'josh@symbrook.com'>('eighty7supreme@gmail.com');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Countdown to next event
  const [countdownStr, setCountdownStr] = useState<string>('00:00:00');

  const filteredEvents = events.filter((e) => {
    if (filterAccount === 'all') return true;
    return e.accountEmail === filterAccount || (!e.accountEmail && filterAccount === 'eighty7supreme@gmail.com');
  });

  const nextUpcoming = filteredEvents.find((e) => e.status === 'confirmed') || filteredEvents[0];

  useEffect(() => {
    const updateCountdown = () => {
      if (!nextUpcoming) {
        setCountdownStr('STANDBY');
        return;
      }
      const now = new Date();
      const [h, m] = (nextUpcoming.startTime || '14:00').split(':').map(Number);
      const target = new Date();
      target.setHours(h, m, 0, 0);

      const diffMs = target.getTime() - now.getTime();
      if (diffMs <= 0) {
        setCountdownStr('NOW ACTIVE');
      } else {
        const hrs = Math.floor(diffMs / 3600000).toString().padStart(2, '0');
        const mins = Math.floor((diffMs % 3600000) / 60000).toString().padStart(2, '0');
        const secs = Math.floor((diffMs % 60000) / 1000).toString().padStart(2, '0');
        setCountdownStr(`T-${hrs}:${mins}:${secs}`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [nextUpcoming]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onAddEvent(newTitle, newStartTime, newEventAccount);
      setNewTitle('');
      setIsAddModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-mono animate-fadeIn">
      {/* Top Mission Schedule Hero */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-c2-surface via-c2-card to-c2-surface border border-c2-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-c2-cyan/15 text-c2-cyan border border-c2-cyan/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-c2-cyan animate-pulse" />
              MISSION SCHEDULER
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-c2-bg border border-c2-border text-c2-textMuted">
              {events.length} SYNCHRONIZED EVENTS
            </span>
          </div>
          <h2 className="font-bold text-lg text-white">INTERACTIVE CALENDAR OPERATIONS</h2>
          <p className="text-xs text-c2-textMuted font-sans">
            Coordinate defense timelines and enterprise client commitments directly with automated AI schedule analysis
          </p>
        </div>

        {/* Action Controls & Countdown Ticker */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mission Countdown Ticker */}
          <div className="px-3 py-2 rounded-xl bg-c2-bg border border-c2-cyan/40 text-right">
            <span className="text-[9px] text-c2-textMuted block">NEXT BRIEFING IN:</span>
            <span className="font-bold text-sm text-c2-cyan tracking-wider">{countdownStr}</span>
          </div>

          <button
            onClick={onTriggerScheduleAnalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-c2-cyan/15 hover:bg-c2-cyan/25 border border-c2-cyan/40 text-c2-cyan font-bold text-xs shadow-cyan-glow transition-all disabled:opacity-50"
          >
            <Zap className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>AI SYNTHESIS</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-c2-cyan text-c2-bg font-bold text-xs shadow-cyan-glow hover:bg-c2-cyan/90 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>SCHEDULE EVENT</span>
          </button>
        </div>
      </div>

      {/* Account Filters Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-c2-surface border border-c2-border text-xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilterAccount('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterAccount === 'all'
                ? 'bg-c2-cyan/20 border border-c2-cyan text-c2-cyan font-bold'
                : 'text-c2-textMuted hover:text-white hover:bg-c2-surfaceHover'
            }`}
          >
            ALL CALENDARS ({events.length})
          </button>
          <button
            onClick={() => setFilterAccount('eighty7supreme@gmail.com')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterAccount === 'eighty7supreme@gmail.com'
                ? 'bg-c2-cyan/20 border border-c2-cyan text-c2-cyan font-bold'
                : 'text-c2-textMuted hover:text-white hover:bg-c2-surfaceHover'
            }`}
          >
            CAANG DEFENSE (eighty7supreme)
          </button>
          <button
            onClick={() => setFilterAccount('josh@symbrook.com')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterAccount === 'josh@symbrook.com'
                ? 'bg-c2-green/20 border border-c2-green text-c2-green font-bold'
                : 'text-c2-textMuted hover:text-white hover:bg-c2-surfaceHover'
            }`}
          >
            SYMBROOK ENTERPRISE (josh@symbrook)
          </button>
        </div>

        <button
          onClick={onRefresh}
          className="p-1.5 rounded-lg text-c2-textMuted hover:text-c2-cyan"
          title="Refresh calendar sync"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      {/* TIMELINE & EVENTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEvents.map((evt, idx) => {
          const isDefense = evt.accountEmail === 'eighty7supreme@gmail.com' || !evt.accountEmail;
          return (
            <div
              key={evt.id || idx}
              className="p-4 rounded-xl bg-c2-card border border-c2-border hover:border-c2-cyan/50 transition-all flex flex-col justify-between group shadow-md"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center gap-1.5 font-bold text-c2-cyan">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{evt.startTime} - {evt.endTime}</span>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                    evt.status === 'confirmed' ? 'bg-c2-green/15 text-c2-green border border-c2-green/30' : 'bg-c2-amber/15 text-c2-amber border border-c2-amber/30'
                  }`}>
                    {evt.status}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-white mb-2 group-hover:text-c2-cyan transition-colors">
                  {evt.title}
                </h4>

                <div className="text-[11px] text-c2-textMuted flex items-center justify-between">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                    isDefense ? 'bg-c2-cyan/10 text-c2-cyan border border-c2-cyan/20' : 'bg-c2-green/10 text-c2-green border border-c2-green/20'
                  }`}>
                    {isDefense ? 'DoD / CAANG' : 'Symbrook Enterprise'}
                  </span>
                  <span>{evt.accountEmail?.split('@')[0] || 'supreme'}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-c2-border/60 flex items-center justify-between mt-3 text-xs">
                <button
                  onClick={() => onDeleteEvent(evt.id)}
                  className="p-1 rounded text-c2-textMuted hover:text-c2-red transition-colors"
                  title="Delete event"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <a
                  href={evt.link || 'https://calendar.google.com/'}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[11px] text-c2-cyan hover:underline"
                >
                  <span>Google Calendar</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* SCHEDULE EVENT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-c2-bg/85 backdrop-blur-md animate-fadeIn">
          <form
            onSubmit={handleCreateEvent}
            className="w-full max-w-md bg-c2-surface border border-c2-cyan/50 rounded-2xl p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-c2-border pb-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-c2-cyan" />
                <h3 className="font-bold text-white text-sm">SCHEDULE MISSION EVENT</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-c2-textMuted hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] text-c2-textMuted block mb-1">EVENT TITLE:</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. CAANG Tactical Cyber Briefing"
                  className="w-full bg-c2-bg border border-c2-border rounded-lg p-2 text-xs text-white focus:outline-none focus:border-c2-cyan"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-c2-textMuted block mb-1">START TIME:</label>
                  <input
                    type="time"
                    required
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full bg-c2-bg border border-c2-border rounded-lg p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-c2-textMuted block mb-1">END TIME:</label>
                  <input
                    type="time"
                    required
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full bg-c2-bg border border-c2-border rounded-lg p-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-c2-textMuted block mb-1">CALENDAR ACCOUNT:</label>
                <select
                  value={newEventAccount}
                  onChange={(e: any) => setNewEventAccount(e.target.value)}
                  className="w-full bg-c2-bg border border-c2-border rounded-lg p-2 text-xs text-c2-cyan"
                >
                  <option value="eighty7supreme@gmail.com">eighty7supreme@gmail.com (DoD / CAANG)</option>
                  <option value="josh@symbrook.com">josh@symbrook.com (Symbrook Enterprise)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !newTitle.trim()}
                className="w-full py-2.5 rounded-xl bg-c2-cyan text-c2-bg font-bold text-xs shadow-cyan-glow hover:bg-c2-cyan/90 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'COMMITTING TO CALENDAR...' : 'CONFIRM & SCHEDULE'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
