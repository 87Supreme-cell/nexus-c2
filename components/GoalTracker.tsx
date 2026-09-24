'use client';

import React from 'react';
import { GoalItem } from '@/types';
import { Target, CheckCircle2, Circle, ShieldCheck, Flag, Clock } from 'lucide-react';

interface GoalTrackerProps {
  goals: GoalItem[];
  onToggleMilestone: (goalId: string, milestoneId: string) => void;
}

export const GoalTracker: React.FC<GoalTrackerProps> = ({ goals, onToggleMilestone }) => {
  const getClassificationStyle = (classification: GoalItem['classification']) => {
    switch (classification) {
      case 'MISSION CRITICAL':
        return 'bg-c2-red/10 border-c2-red/40 text-c2-red';
      case 'SECRET':
        return 'bg-c2-amber/10 border-c2-amber/40 text-c2-amber';
      case 'CONFIDENTIAL':
        return 'bg-c2-cyan/10 border-c2-cyan/40 text-c2-cyan';
      default:
        return 'bg-c2-surface border-c2-border text-c2-textMuted';
    }
  };

  return (
    <div className="rounded-xl bg-c2-card border border-c2-border overflow-hidden mb-8 shadow-xl">
      {/* Banner */}
      <div className="p-4 bg-c2-surface border-b border-c2-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-c2-amber/10 border border-c2-amber/30 text-c2-amber">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-mono font-bold text-sm text-white flex items-center gap-2">
              DOD MISSION OBJECTIVES & GOAL VELOCITY
              <span className="text-[10px] px-2 py-0.5 rounded bg-c2-amber/10 border border-c2-amber/30 text-c2-amber font-mono font-bold">
                PORTFOLIO-GRADE SE
              </span>
            </h2>
            <p className="text-xs text-c2-textMuted font-mono">
              Operational key results, airgap validation milestones & agentic engineering standards
            </p>
          </div>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {goals.map((goal) => {
          const completedMilestones = goal.milestones.filter((m) => m.done).length;
          const totalMilestones = goal.milestones.length;
          const computedProgress = Math.round((completedMilestones / (totalMilestones || 1)) * 100);

          return (
            <div
              key={goal.id}
              className="rounded-xl bg-c2-surface border border-c2-border hover:border-c2-amber/40 p-4 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header: Classification & Date */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${getClassificationStyle(
                      goal.classification
                    )}`}
                  >
                    // {goal.classification} //
                  </span>
                  <span className="text-[10px] font-mono text-c2-textMuted flex items-center gap-1">
                    <Clock className="w-3 h-3 text-c2-amber" />
                    Target: {goal.dueDate}
                  </span>
                </div>

                {/* Title & Desc */}
                <h3 className="font-mono font-bold text-sm text-white mb-1.5 leading-snug">
                  {goal.title}
                </h3>
                <p className="text-xs text-c2-textMuted font-sans mb-3 line-clamp-2">
                  {goal.description}
                </p>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs font-mono mb-1">
                    <span className="text-c2-textMuted">Progress</span>
                    <span className="text-c2-amber font-bold">{computedProgress}%</span>
                  </div>
                  <div className="w-full bg-c2-bg rounded-full h-1.5 overflow-hidden border border-c2-border">
                    <div
                      className="h-full bg-gradient-to-r from-c2-amber to-orange-400 rounded-full transition-all duration-300"
                      style={{ width: `${computedProgress}%` }}
                    />
                  </div>
                </div>

                {/* Milestones checklist */}
                <div className="space-y-2 border-t border-c2-border/60 pt-3">
                  <span className="text-[11px] font-mono text-c2-textMuted block font-semibold uppercase">
                    Milestone Matrix ({completedMilestones}/{totalMilestones})
                  </span>
                  {goal.milestones.map((milestone) => (
                    <button
                      key={milestone.id}
                      onClick={() => onToggleMilestone(goal.id, milestone.id)}
                      className="w-full flex items-start gap-2 text-left group p-1 rounded hover:bg-c2-bg/60 transition-colors"
                    >
                      {milestone.done ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-c2-green mt-0.5 flex-shrink-0" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-c2-textMuted mt-0.5 flex-shrink-0 group-hover:text-c2-amber" />
                      )}
                      <span
                        className={`text-xs font-mono leading-tight ${
                          milestone.done ? 'line-through text-c2-textMuted' : 'text-gray-200 group-hover:text-white'
                        }`}
                      >
                        {milestone.text}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
