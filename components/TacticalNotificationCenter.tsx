'use client';

import React from 'react';
import { 
  Bell, 
  X, 
  Clock, 
  Mail, 
  CheckSquare, 
  ShieldCheck, 
  AlertTriangle, 
  ArrowRight, 
  Sparkles,
  Zap
} from 'lucide-react';
import { GoogleCalendarEvent, GoogleTaskItem } from '@/types';
import { EmailMessage } from '@/lib/email-service';

interface TacticalNotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  calendarEvents: GoogleCalendarEvent[];
  tasks: GoogleTaskItem[];
  emails: EmailMessage[];
  onNavigateTab: (tab: any) => void;
  onOpenAiChat: () => void;
}

export const TacticalNotificationCenter: React.FC<TacticalNotificationCenterProps> = ({
  isOpen,
  onClose,
  calendarEvents,
  tasks,
  emails,
  onNavigateTab,
  onOpenAiChat,
}) => {
  if (!isOpen) return null;

  const unreadEmails = emails.filter((e) => e.unread);
  const urgentTasks = tasks.filter((t) => !t.completed && (t.priority === 'critical' || t.priority === 'high'));
  const nextEvent = calendarEvents.find((e) => e.status === 'confirmed') || calendarEvents[0];

  const totalAlerts = unreadEmails.length + urgentTasks.length + (nextEvent ? 1 : 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn font-mono">
      <div className="w-full max-w-md h-full bg-c2-surface border-l border-c2-cyan/50 shadow-2xl flex flex-col justify-between overflow-hidden animate-slideInRight">
        {/* Top Header */}
        <div className="p-4 bg-c2-bg border-b border-c2-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-c2-cyan/15 border border-c2-cyan/40 text-c2-cyan">
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm">TACTICAL NOTIFICATIONS</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-c2-cyan/15 text-c2-cyan border border-c2-cyan/30">
                  {totalAlerts} ALERTS
                </span>
              </div>
              <span className="text-[10px] text-c2-textMuted font-sans">
                Real-time event triggers, inbox alerts &amp; mission timers
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-c2-textMuted hover:text-white hover:bg-c2-surface transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Alerts Scrollable Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
          {/* SECTION 1: UPCOMING EVENT TRIGGER */}
          {nextEvent && (
            <div className="p-3.5 rounded-xl bg-c2-bg border border-c2-cyan/40 space-y-2">
              <div className="flex items-center justify-between text-[10px] text-c2-cyan font-bold">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-c2-cyan animate-pulse" />
                  UPCOMING MISSION BRIEFING
                </span>
                <span>TODAY {nextEvent.startTime}</span>
              </div>
              <h4 className="font-bold text-white text-xs leading-snug">
                {nextEvent.title}
              </h4>
              <p className="text-[10px] text-c2-textMuted font-sans">
                Account: {nextEvent.accountEmail || 'eighty7supreme@gmail.com'}
              </p>
              <div className="pt-2 border-t border-c2-border/60 flex items-center justify-between">
                <button
                  onClick={() => {
                    onClose();
                    onNavigateTab('calendar');
                  }}
                  className="text-[11px] text-c2-cyan hover:underline flex items-center gap-1 font-bold"
                >
                  <span>Open Calendar Ops</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* SECTION 2: HIGH-PRIORITY INBOX NOTIFICATIONS */}
          <div className="space-y-2">
            <span className="text-[10px] text-c2-textMuted uppercase font-bold tracking-wider block">
              INCOMING INBOX MESSAGES ({unreadEmails.length})
            </span>
            {unreadEmails.length === 0 ? (
              <div className="p-3 rounded-xl bg-c2-bg border border-c2-border text-[11px] text-c2-textMuted">
                All inboxes triaged. Zero pending unread messages.
              </div>
            ) : (
              unreadEmails.map((em) => (
                <div
                  key={em.id}
                  className="p-3 rounded-xl bg-c2-bg border border-c2-border hover:border-c2-cyan/40 transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-white truncate max-w-[200px]">{em.senderName}</span>
                    <span className="text-c2-textMuted">{em.date}</span>
                  </div>
                  <h5 className="font-bold text-xs text-slate-200 truncate">{em.subject}</h5>
                  <p className="text-[10px] text-c2-textMuted font-sans line-clamp-1">{em.snippet}</p>
                  <div className="pt-1.5 border-t border-c2-border/50 flex items-center justify-between text-[10px]">
                    <span className="text-c2-green font-bold">{em.accountEmail.split('@')[0]}</span>
                    <button
                      onClick={() => {
                        onClose();
                        onNavigateTab('inbox');
                      }}
                      className="text-c2-cyan font-bold hover:underline flex items-center gap-1"
                    >
                      <span>Draft Reply with Gemini</span>
                      <Sparkles className="w-3 h-3 text-c2-cyan" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* SECTION 3: URGENT MISSION TASKS */}
          <div className="space-y-2">
            <span className="text-[10px] text-c2-textMuted uppercase font-bold tracking-wider block">
              CRITICAL PENDING TASKS ({urgentTasks.length})
            </span>
            {urgentTasks.map((t) => (
              <div
                key={t.id}
                className="p-3 rounded-xl bg-c2-bg border border-c2-border hover:border-c2-amber/40 transition-all space-y-1.5"
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-c2-red font-bold uppercase flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-c2-red" /> {t.priority || 'HIGH'} PRIORITY
                  </span>
                  <span className="text-c2-textMuted">Due: {t.due || 'Today'}</span>
                </div>
                <h5 className="font-bold text-xs text-white">{t.title}</h5>
                <div className="pt-1.5 border-t border-c2-border/50 flex items-center justify-between text-[10px]">
                  <span className="text-c2-textMuted">{t.accountEmail || 'eighty7supreme'}</span>
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateTab('tasks');
                    }}
                    className="text-c2-cyan font-bold hover:underline flex items-center gap-1"
                  >
                    <span>Execute on Task Board</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div className="p-3 bg-c2-bg border-t border-c2-border flex items-center justify-between text-[11px]">
          <span className="text-c2-green flex items-center gap-1 font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-c2-green" /> ZERO-TRUST TELEMETRY ACTIVE
          </span>
          <button
            onClick={() => {
              onClose();
              onOpenAiChat();
            }}
            className="px-3 py-1.5 rounded-lg bg-c2-cyan/15 hover:bg-c2-cyan/25 border border-c2-cyan/40 text-c2-cyan font-bold transition-all"
          >
            Ask AI Assistant
          </button>
        </div>
      </div>
    </div>
  );
};
