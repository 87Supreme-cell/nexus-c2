'use client';

import React, { useState } from 'react';
import { AiAnalysisReport } from '@/types';
import { 
  X, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  Check, 
  ArrowRight, 
  Activity, 
  Clock, 
  Cpu, 
  FileText,
  RotateCw,
  Zap
} from 'lucide-react';

interface TacticalAnalysisModalProps {
  report: AiAnalysisReport | null;
  isOpen: boolean;
  onClose: () => void;
  onRerun: (domain: any) => void;
  isLoading?: boolean;
}

export const TacticalAnalysisModal: React.FC<TacticalAnalysisModalProps> = ({
  report,
  isOpen,
  onClose,
  onRerun,
  isLoading = false,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !report) return null;

  const handleCopy = () => {
    const text = `=== ${report.title.toUpperCase()} ===
Timestamp: ${report.timestamp}
Threat / Risk Assessment: ${report.threatLevel}
Model: ${report.model} (${report.authType})

[EXECUTIVE SUMMARY]
${report.executiveSummary}

[KEY TACTICAL INSIGHTS]
${report.insights.map((ins, i) => `${i + 1}. ${ins}`).join('\n')}

[ACTIONABLE DIRECTIVES]
${report.actionItems.map((act, i) => `[ ] ${act}`).join('\n')}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getThreatBadge = (level: string) => {
    switch (level) {
      case 'OPTIMAL':
        return 'bg-c2-green/15 text-c2-green border-c2-green/30';
      case 'NOMINAL':
        return 'bg-c2-cyan/15 text-c2-cyan border-c2-cyan/30';
      case 'ELEVATED':
        return 'bg-c2-amber/15 text-c2-amber border-c2-amber/30';
      case 'HIGH':
      case 'CRITICAL':
        return 'bg-c2-red/15 text-c2-red border-c2-red/30';
      default:
        return 'bg-c2-cyan/15 text-c2-cyan border-c2-cyan/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-c2-bg/85 backdrop-blur-md animate-fadeIn font-mono">
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-c2-surface border border-c2-cyan/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header HUD Bar */}
        <div className="p-4 bg-c2-bg border-b border-c2-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-c2-cyan/15 border border-c2-cyan/40 text-c2-cyan">
              <Zap className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-c2-cyan/10 border border-c2-cyan/30 text-c2-cyan">
                  1-CLICK TACTICAL SYNTHESIS
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold border uppercase ${getThreatBadge(report.threatLevel)}`}>
                  STATUS: {report.threatLevel}
                </span>
              </div>
              <h3 className="font-bold text-sm text-white mt-0.5">
                {report.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onRerun(report.domain)}
              disabled={isLoading}
              className="p-2 rounded-lg bg-c2-surface hover:bg-c2-surfaceHover border border-c2-border text-c2-textMuted hover:text-white transition-all disabled:opacity-50"
              title="Re-run analysis with Gemini"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-c2-cyan' : ''}`} />
            </button>
            <button
              onClick={handleCopy}
              className="p-2 rounded-lg bg-c2-surface hover:bg-c2-surfaceHover border border-c2-border text-c2-textMuted hover:text-white transition-all"
              title="Copy Briefing to Clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-c2-green" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-c2-surface hover:bg-c2-surfaceHover border border-c2-border text-c2-textMuted hover:text-white transition-all"
              title="Close modal"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-5 text-xs text-slate-200">
          {/* Subsystem & Engine Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-c2-bg border border-c2-border/80 text-[11px] text-c2-textMuted">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-c2-cyan" />
              <span>COGNITIVE ENGINE: <strong className="text-white">{report.model}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-c2-green" />
              <span>AUTH: <strong className="text-c2-green">{report.authType}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-c2-cyan" />
              <span>ENTITIES PARSED: <strong className="text-white">{report.analyzedItemCount}</strong></span>
            </div>
          </div>

          {/* Section 1: Executive Summary */}
          <div className="p-4 rounded-xl bg-c2-bg/60 border border-c2-border space-y-1.5">
            <div className="flex items-center gap-2 text-[10px] text-c2-cyan font-bold tracking-wider uppercase">
              <FileText className="w-3.5 h-3.5" />
              <span>EXECUTIVE BRIEFING &bull; HIGH COMMAND SUMMARY</span>
            </div>
            <p className="text-sm font-sans text-slate-100 leading-relaxed">
              {report.executiveSummary}
            </p>
          </div>

          {/* Section 2: Key Operational Insights */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-bold text-c2-cyan uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-c2-cyan" />
              KEY OPERATIONAL INSIGHTS &bull; TELEMETRY CORRELATION
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {report.insights.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-3 rounded-lg bg-c2-bg border border-c2-border/70 hover:border-c2-cyan/40 transition-colors"
                >
                  <span className="text-c2-cyan font-bold text-xs mt-0.5">0{idx + 1}.</span>
                  <span className="font-sans text-xs text-slate-200 leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Actionable Directives */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-bold text-c2-green uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-c2-green" />
              ACTIONABLE DIRECTIVES &bull; OPERATIONAL NEXT STEPS
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {report.actionItems.map((act, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-3 rounded-lg bg-c2-green/5 border border-c2-green/20"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-c2-green shrink-0 mt-0.5" />
                  <span className="font-sans text-xs text-white leading-relaxed">{act}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="p-3 bg-c2-bg border-t border-c2-border flex items-center justify-between text-[10px] text-c2-textMuted">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-c2-cyan" />
            <span>ANALYSIS TIMESTAMP: {new Date(report.timestamp).toLocaleTimeString()}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-c2-cyan/15 hover:bg-c2-cyan/25 border border-c2-cyan/40 text-c2-cyan font-bold transition-all"
          >
            ACKNOWLEDGE &amp; DISMISS
          </button>
        </div>
      </div>
    </div>
  );
};
