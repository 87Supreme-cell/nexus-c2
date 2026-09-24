'use client';

import React, { useState } from 'react';
import { GoogleTaskItem } from '@/types';
import { 
  CheckSquare, 
  Plus, 
  Trash2, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Loader2,
  Check,
  Zap,
  ListFilter
} from 'lucide-react';

interface MissionTasksBoardProps {
  tasks: GoogleTaskItem[];
  onAddTask: (title: string, accountEmail?: string, priority?: string) => Promise<void>;
  onToggleTask: (id: string, completed: boolean) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onDecomposeTaskWithAi: (taskTitle: string) => Promise<string[]>;
}

export const MissionTasksBoard: React.FC<MissionTasksBoardProps> = ({
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onDecomposeTaskWithAi,
}) => {
  const [filterAccount, setFilterAccount] = useState<'all' | 'eighty7supreme@gmail.com' | 'josh@symbrook.com'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<'critical' | 'high' | 'medium' | 'low'>('high');
  const [newAccount, setNewAccount] = useState<'eighty7supreme@gmail.com' | 'josh@symbrook.com'>('eighty7supreme@gmail.com');
  const [newDue, setNewDue] = useState('Today');
  const [isAdding, setIsAdding] = useState(false);

  // Decomposing task state
  const [decomposingId, setDecomposingId] = useState<string | null>(null);
  const [aiSubtasksModal, setAiSubtasksModal] = useState<{ parentTitle: string; subtasks: string[] } | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || isAdding) return;
    setIsAdding(true);
    try {
      await onAddTask(newTitle, newAccount, newPriority);
      setNewTitle('');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDecompose = async (task: GoogleTaskItem) => {
    setDecomposingId(task.id);
    try {
      const subtasks = await onDecomposeTaskWithAi(task.title);
      if (subtasks && subtasks.length > 0) {
        setAiSubtasksModal({ parentTitle: task.title, subtasks });
      }
    } finally {
      setDecomposingId(null);
    }
  };

  const handleAcceptSubtasks = async () => {
    if (!aiSubtasksModal) return;
    for (const sub of aiSubtasksModal.subtasks) {
      await onAddTask(sub, newAccount, 'medium');
    }
    setAiSubtasksModal(null);
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesAccount = filterAccount === 'all' || t.accountEmail === filterAccount || (!t.accountEmail && filterAccount === 'eighty7supreme@gmail.com');
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'pending' && !t.completed) || (statusFilter === 'completed' && t.completed);
    return matchesAccount && matchesStatus;
  });

  const pendingCount = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="space-y-6 font-mono animate-fadeIn">
      {/* Top Hero Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-c2-surface via-c2-card to-c2-surface border border-c2-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-c2-cyan/15 text-c2-cyan border border-c2-cyan/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-c2-cyan animate-pulse" />
              MISSION OBJECTIVES BOARD
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-c2-bg border border-c2-border text-c2-textMuted">
              {pendingCount} PENDING &bull; {completedCount} COMPLETED
            </span>
          </div>
          <h2 className="font-bold text-lg text-white">ACTIONABLE TASK EXECUTION RADAR</h2>
          <p className="text-xs text-c2-textMuted font-sans">
            Set, prioritize, and accomplish operational tasks across DoD defense and enterprise workspaces with Gemini AI task decomposition
          </p>
        </div>

        {/* Quick Progress Bar */}
        <div className="w-full md:w-56 p-3 rounded-xl bg-c2-bg border border-c2-border">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-c2-textMuted text-[10px]">MISSION COMPLETION:</span>
            <span className="text-c2-green font-bold">
              {Math.round((completedCount / (tasks.length || 1)) * 100)}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-c2-surface overflow-hidden">
            <div
              className="h-full bg-c2-green rounded-full transition-all duration-500 shadow-green-glow"
              style={{ width: `${Math.round((completedCount / (tasks.length || 1)) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* QUICK TASK CREATION FORM */}
      <form
        onSubmit={handleCreate}
        className="p-4 rounded-2xl bg-c2-surface border border-c2-cyan/40 shadow-lg space-y-3"
      >
        <div className="flex items-center gap-2 text-xs text-c2-cyan font-bold">
          <Plus className="w-4 h-4" />
          <span>SET NEW MISSION TASK</span>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-3">
          <input
            type="text"
            required
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Type new mission objective or task (e.g. Verify CAANG medical waiver, finalize PDF)..."
            className="flex-1 bg-c2-bg border border-c2-border rounded-xl px-4 py-2.5 text-xs text-white placeholder-c2-textMuted focus:outline-none focus:border-c2-cyan font-mono"
          />

          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Priority Selector */}
            <select
              value={newPriority}
              onChange={(e: any) => setNewPriority(e.target.value)}
              className="bg-c2-bg border border-c2-border rounded-xl px-3 py-2 text-xs text-c2-amber focus:outline-none font-mono"
            >
              <option value="critical">CRITICAL</option>
              <option value="high">HIGH</option>
              <option value="medium">MEDIUM</option>
              <option value="low">LOW</option>
            </select>

            {/* Account Selector */}
            <select
              value={newAccount}
              onChange={(e: any) => setNewAccount(e.target.value)}
              className="bg-c2-bg border border-c2-border rounded-xl px-3 py-2 text-xs text-c2-cyan focus:outline-none font-mono"
            >
              <option value="eighty7supreme@gmail.com">eighty7supreme (Defense)</option>
              <option value="josh@symbrook.com">josh@symbrook (Enterprise)</option>
            </select>

            <button
              type="submit"
              disabled={isAdding || !newTitle.trim()}
              className="px-5 py-2.5 rounded-xl bg-c2-cyan hover:bg-c2-cyan/90 text-c2-bg font-bold text-xs shadow-cyan-glow transition-all disabled:opacity-50 whitespace-nowrap"
            >
              {isAdding ? 'COMMITTING...' : '+ ADD OBJECTIVE'}
            </button>
          </div>
        </div>
      </form>

      {/* FILTER CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-c2-surface border border-c2-border text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setFilterAccount('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterAccount === 'all'
                ? 'bg-c2-cyan/20 border border-c2-cyan text-c2-cyan font-bold'
                : 'text-c2-textMuted hover:text-white hover:bg-c2-surfaceHover'
            }`}
          >
            ALL ACCOUNTS ({tasks.length})
          </button>
          <button
            onClick={() => setFilterAccount('eighty7supreme@gmail.com')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterAccount === 'eighty7supreme@gmail.com'
                ? 'bg-c2-cyan/20 border border-c2-cyan text-c2-cyan font-bold'
                : 'text-c2-textMuted hover:text-white hover:bg-c2-surfaceHover'
            }`}
          >
            CAANG DEFENSE
          </button>
          <button
            onClick={() => setFilterAccount('josh@symbrook.com')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterAccount === 'josh@symbrook.com'
                ? 'bg-c2-green/20 border border-c2-green text-c2-green font-bold'
                : 'text-c2-textMuted hover:text-white hover:bg-c2-surfaceHover'
            }`}
          >
            SYMBROOK ENTERPRISE
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded text-[11px] ${statusFilter === 'all' ? 'text-white font-bold bg-c2-bg' : 'text-c2-textMuted'}`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-2.5 py-1 rounded text-[11px] ${statusFilter === 'pending' ? 'text-c2-amber font-bold bg-c2-bg' : 'text-c2-textMuted'}`}
          >
            Pending
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-2.5 py-1 rounded text-[11px] ${statusFilter === 'completed' ? 'text-c2-green font-bold bg-c2-bg' : 'text-c2-textMuted'}`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* TASKS LIST */}
      <div className="space-y-3">
        {filteredTasks.map((t) => {
          const isDefense = t.accountEmail === 'eighty7supreme@gmail.com' || !t.accountEmail;
          return (
            <div
              key={t.id}
              className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group ${
                t.completed
                  ? 'bg-c2-bg/40 border-c2-border/50 opacity-60'
                  : 'bg-c2-card border-c2-border hover:border-c2-cyan/50 shadow-md'
              }`}
            >
              <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                {/* Interactive Checkbox */}
                <button
                  onClick={() => onToggleTask(t.id, !t.completed)}
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all mt-0.5 sm:mt-0 shrink-0 ${
                    t.completed
                      ? 'bg-c2-green border-c2-green text-c2-bg shadow-green-glow'
                      : 'border-c2-border hover:border-c2-cyan bg-c2-bg'
                  }`}
                  title={t.completed ? 'Mark incomplete' : 'Mark complete'}
                >
                  {t.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>

                {/* Title & Metadata */}
                <div className="min-w-0 flex-1">
                  <span className={`text-xs font-bold block truncate ${
                    t.completed ? 'line-through text-c2-textMuted' : 'text-white'
                  }`}>
                    {t.title}
                  </span>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-c2-textMuted">
                    <span className={`px-1.5 py-0.2 rounded ${
                      isDefense ? 'text-c2-cyan' : 'text-c2-green'
                    }`}>
                      {isDefense ? 'DoD / CAANG' : 'Symbrook'}
                    </span>
                    <span>&bull;</span>
                    <span>Due: {t.due || 'Today'}</span>
                  </div>
                </div>
              </div>

              {/* Right Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                {/* 1-Click AI Task Decomposition */}
                {!t.completed && (
                  <button
                    onClick={() => handleDecompose(t)}
                    disabled={decomposingId === t.id}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-c2-cyan/10 hover:bg-c2-cyan/20 border border-c2-cyan/30 text-[11px] text-c2-cyan transition-all disabled:opacity-50"
                    title="Decompose into actionable subtasks via Gemini"
                  >
                    {decomposingId === t.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3 text-c2-cyan" />
                    )}
                    <span className="hidden sm:inline">AI DECOMPOSE</span>
                  </button>
                )}

                {/* Delete */}
                <button
                  onClick={() => onDeleteTask(t.id)}
                  className="p-1.5 rounded-lg text-c2-textMuted hover:text-c2-red transition-all"
                  title="Delete task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI SUBTASKS MODAL */}
      {aiSubtasksModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-c2-bg/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg bg-c2-surface border border-c2-cyan/50 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-c2-border pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-c2-cyan" />
                <h3 className="font-bold text-white text-sm">GEMINI AI TASK DECOMPOSITION</h3>
              </div>
              <button
                onClick={() => setAiSubtasksModal(null)}
                className="text-c2-textMuted hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <span className="text-[10px] text-c2-textMuted block">PARENT OBJECTIVE:</span>
              <p className="font-bold text-white bg-c2-bg p-2.5 rounded-lg border border-c2-border">
                {aiSubtasksModal.parentTitle}
              </p>

              <span className="text-[10px] text-c2-cyan font-bold block pt-2">
                PROPOSED ACTIONABLE SUBTASKS:
              </span>
              <div className="space-y-1.5">
                {aiSubtasksModal.subtasks.map((st, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-c2-bg border border-c2-border flex items-start gap-2 text-slate-200">
                    <span className="text-c2-cyan font-bold">0{i + 1}.</span>
                    <span>{st}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  onClick={() => setAiSubtasksModal(null)}
                  className="px-4 py-2 rounded-xl bg-c2-surface border border-c2-border text-xs text-c2-textMuted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAcceptSubtasks}
                  className="px-4 py-2 rounded-xl bg-c2-cyan text-c2-bg font-bold text-xs shadow-cyan-glow hover:bg-c2-cyan/90"
                >
                  Accept &amp; Add Subtasks
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
