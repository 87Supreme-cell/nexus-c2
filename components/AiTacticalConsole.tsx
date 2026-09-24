'use client';

import React, { useState } from 'react';
import { OllamaModel } from '@/types';
import { 
  Bot, 
  Sparkles, 
  Send, 
  X, 
  Maximize2, 
  Minimize2, 
  ShieldCheck, 
  Cpu, 
  RotateCw, 
  Terminal,
  Loader2,
  Copy,
  Check
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  provider?: string;
  model?: string;
  airgap?: boolean;
}

interface AiTacticalConsoleProps {
  isOpen: boolean;
  onClose: () => void;
  models: OllamaModel[];
  selectedModel: string;
  onSelectModel: (model: string) => void;
  ollamaOnline: boolean;
}

export const AiTacticalConsole: React.FC<AiTacticalConsoleProps> = ({
  isOpen,
  onClose,
  models,
  selectedModel,
  onSelectModel,
  ollamaOnline,
}) => {
  const [provider, setProvider] = useState<'ollama' | 'gemini'>('ollama');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'TACTICAL AI COGNITION ENGINE ONLINE. Air-gapped local model active. Ready to orchestrate runtimes, analyze telemetry, or coordinate Google Workspace tasks.',
      provider: 'ollama',
      model: selectedModel,
      airgap: true,
    },
  ]);

  if (!isOpen) return null;

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputMessage;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInputMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          provider,
          model: provider === 'ollama' ? selectedModel : 'gemini-1.5-flash',
          geminiApiKey: provider === 'gemini' ? geminiApiKey : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.response) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.response,
            provider: data.provider,
            model: data.model,
            airgap: data.airgap,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `⚠ [DIAGNOSTIC ERROR]: ${data.error || 'Failed generating inference response.'}`,
            provider,
            airgap: provider === 'ollama',
          },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠ [NETWORK ERROR]: ${err.message || 'Could not communicate with AI runtime.'}`,
          provider,
          airgap: provider === 'ollama',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const PROMPT_CHIPS = [
    'System Health & Diagnostic Check',
    'Summarize Today\'s Agenda & Objectives',
    'Verify Zero-Trust Local Airgap Status',
    'Draft DoD Antigravity Audit Summary',
  ];

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-lg md:max-w-xl bg-c2-surface/95 border border-c2-cyan/50 backdrop-blur-xl rounded-2xl shadow-2xl flex flex-col overflow-hidden h-[600px] max-h-[85vh]">
      {/* Console Top Header */}
      <div className="p-3.5 bg-c2-bg border-b border-c2-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-c2-cyan/10 border border-c2-cyan/30 text-c2-cyan">
            <Bot className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-mono font-bold text-sm text-white">NEXUS AI COGNITION</h3>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                provider === 'ollama' ? 'bg-c2-green/10 text-c2-green border border-c2-green/30' : 'bg-c2-purple/10 text-c2-purple border border-c2-purple/30'
              }`}>
                {provider === 'ollama' ? 'LOCAL AIRGAP' : 'GEMINI CLOUD'}
              </span>
            </div>
            <p className="text-[10px] text-c2-textMuted font-mono">Real-time Task & Mission Analysis Copilot</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-c2-textMuted hover:text-white hover:bg-c2-surface transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Model & Engine Selector Sub-bar */}
      <div className="px-3.5 py-2 bg-c2-surface border-b border-c2-border flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        {/* Provider Toggle */}
        <div className="flex items-center gap-1 bg-c2-bg p-0.5 rounded-lg border border-c2-border">
          <button
            onClick={() => setProvider('ollama')}
            className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
              provider === 'ollama' ? 'bg-c2-cyan text-c2-bg shadow-cyan-glow' : 'text-c2-textMuted hover:text-white'
            }`}
          >
            Local Ollama
          </button>
          <button
            onClick={() => setProvider('gemini')}
            className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
              provider === 'gemini' ? 'bg-c2-purple text-white' : 'text-c2-textMuted hover:text-white'
            }`}
          >
            Google Gemini
          </button>
        </div>

        {/* Model Dropdown */}
        {provider === 'ollama' ? (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-c2-textMuted">LOCAL ({models.length}):</span>
            <select
              value={selectedModel}
              onChange={(e) => onSelectModel(e.target.value)}
              className="bg-c2-bg border border-c2-border rounded px-2 py-1 text-[11px] text-c2-cyan font-mono focus:outline-none focus:border-c2-cyan max-w-[240px] truncate"
            >
              <optgroup label="── OLLAMA RUNTIME ──">
                {models.filter(m => m.source === 'ollama').map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name} ({m.size})
                  </option>
                ))}
              </optgroup>
              {models.some(m => m.source === 'mlx') && (
                <optgroup label="── APPLE MLX MODELS ──">
                  {models.filter(m => m.source === 'mlx').map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.name} ({m.size})
                    </option>
                  ))}
                </optgroup>
              )}
              {models.some(m => m.source === 'lmstudio') && (
                <optgroup label="── LM STUDIO MODELS ──">
                  {models.filter(m => m.source === 'lmstudio').map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.name} ({m.size})
                    </option>
                  ))}
                </optgroup>
              )}
              {models.some(m => m.source === 'huggingface') && (
                <optgroup label="── HUGGING FACE GGUF CACHE ──">
                  {models.filter(m => m.source === 'huggingface').map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.name} ({m.size})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
        ) : (
          <input
            type="password"
            placeholder="Gemini API Key..."
            value={geminiApiKey}
            onChange={(e) => setGeminiApiKey(e.target.value)}
            className="bg-c2-bg border border-c2-border rounded px-2 py-1 text-[11px] text-white placeholder-c2-textMuted focus:outline-none focus:border-c2-purple w-40"
          />
        )}
      </div>

      {/* Message History */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 font-mono text-xs">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={idx}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              {/* Badge */}
              <div className="flex items-center gap-2 mb-1 text-[10px] text-c2-textMuted">
                <span>{isUser ? 'OPERATOR' : 'NEXUS COGNITION'}</span>
                {msg.model && <span>• {msg.model.split(':')[0]}</span>}
                {msg.airgap && (
                  <span className="text-c2-green flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3" /> AIRGAP
                  </span>
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`relative group max-w-[90%] p-3 rounded-xl border ${
                  isUser
                    ? 'bg-c2-cyan/15 border-c2-cyan/40 text-white'
                    : 'bg-c2-surface border-c2-border text-gray-200 shadow-md'
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed font-mono">
                  {msg.content}
                </div>

                {!isUser && (
                  <button
                    onClick={() => handleCopy(msg.content, idx)}
                    className="absolute top-2 right-2 p-1 rounded bg-c2-bg/60 text-c2-textMuted hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Copy message"
                  >
                    {copiedIndex === idx ? <Check className="w-3 h-3 text-c2-green" /> : <Copy className="w-3 h-3" />}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-c2-cyan text-xs font-mono p-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Analyzing mission parameters...</span>
          </div>
        )}
      </div>

      {/* Prompt Quick Chips */}
      <div className="px-3 py-1.5 bg-c2-bg border-t border-c2-border/60 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {PROMPT_CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => handleSend(chip)}
            disabled={loading}
            className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-c2-surface hover:bg-c2-surfaceHover border border-c2-border text-c2-textMuted hover:text-c2-cyan whitespace-nowrap transition-all"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="p-3 bg-c2-bg border-t border-c2-border flex items-center gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
          placeholder="Ask copilot to analyze runtimes, summarize tasks, or draft reports..."
          className="flex-1 bg-c2-surface border border-c2-border rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-c2-textMuted focus:outline-none focus:border-c2-cyan"
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !inputMessage.trim()}
          className="p-2 rounded-lg bg-c2-cyan hover:bg-c2-cyan/90 text-c2-bg font-bold transition-all disabled:opacity-40 shadow-cyan-glow"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
