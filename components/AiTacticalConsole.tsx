'use client';

import React, { useState, useEffect } from 'react';
import { OllamaModel } from '@/types';
import { 
  Bot, 
  Send, 
  X, 
  ShieldCheck, 
  Loader2, 
  Copy, 
  Check, 
  Sparkles, 
  Key, 
  Lock, 
  ExternalLink,
  UserCheck,
  AlertCircle,
  Minus
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  provider?: string;
  model?: string;
  airgap?: boolean;
  authType?: string;
}

interface AiTacticalConsoleProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen?: () => void;
  models: OllamaModel[];
  selectedModel: string;
  onSelectModel: (model: string) => void;
  ollamaOnline: boolean;
}

export const AiTacticalConsole: React.FC<AiTacticalConsoleProps> = ({
  isOpen,
  onClose,
  onOpen,
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

  // Google OAuth State
  const [oauthStatus, setOauthStatus] = useState<{
    connected: boolean;
    email?: string;
    authUrl?: string | null;
  }>({ connected: false });
  const [isOAuthModalOpen, setIsOAuthModalOpen] = useState(false);
  const [manualOAuthToken, setManualOAuthToken] = useState('');
  const [tokenSaveMsg, setTokenSaveMsg] = useState<string | null>(null);

  // Check Google OAuth on mount
  useEffect(() => {
    fetch('/api/auth/google')
      .then((res) => res.json())
      .then((data) => {
        setOauthStatus({
          connected: Boolean(data.connected),
          email: data.email,
          authUrl: data.authUrl,
        });
      })
      .catch(() => {});
  }, []);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'TACTICAL AI COGNITION ENGINE ONLINE. Air-gapped local models and Google OAuth-enabled Gemini are active. Ready to orchestrate runtimes or analyze mission parameters.',
      provider: 'ollama',
      model: selectedModel,
      airgap: true,
    },
  ]);

  if (!isOpen) {
    return (
      <div className="fixed bottom-5 right-5 z-50 animate-fadeIn">
        <button
          onClick={onOpen || onClose}
          className="group flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-c2-surface/95 border border-c2-cyan/60 hover:border-c2-cyan shadow-cyan-glow hover:scale-[1.03] transition-all backdrop-blur-xl"
          title="Open AI Cognition Chat in bottom right corner"
        >
          <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-c2-bg border border-c2-cyan/50 text-c2-cyan">
            <Bot className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-c2-green animate-pulse" />
          </div>
          <div className="text-left font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white">NEXUS COGNITION</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-c2-cyan/15 text-c2-cyan border border-c2-cyan/30">
                {selectedModel.split(':')[0]}
              </span>
            </div>
            <span className="text-[10px] text-c2-textMuted block">Click to open chat</span>
          </div>
        </button>
      </div>
    );
  }

  const handleModelChange = (modelName: string) => {
    onSelectModel(modelName);
    if (modelName.toLowerCase().startsWith('gemini')) {
      setProvider('gemini');
    } else {
      setProvider('ollama');
    }
  };

  const handleSaveOAuthToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualOAuthToken.trim()) return;

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save-token',
          accessToken: manualOAuthToken.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTokenSaveMsg('Google OAuth Token verified & saved!');
        setOauthStatus({ connected: true, email: data.auth?.email });
        setTimeout(() => {
          setIsOAuthModalOpen(false);
          setTokenSaveMsg(null);
        }, 1200);
      }
    } catch {
      setTokenSaveMsg('Failed saving token');
    }
  };

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputMessage;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInputMessage('');
    setLoading(true);

    const isGemini = provider === 'gemini' || selectedModel.startsWith('gemini');

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          provider: isGemini ? 'gemini' : 'ollama',
          model: selectedModel,
          geminiApiKey: isGemini ? geminiApiKey : undefined,
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
            authType: data.authType,
          },
        ]);
      } else {
        if (data.requiresOAuth) {
          setIsOAuthModalOpen(true);
        }
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `⚠ [AUTHENTICATION / DIAGNOSTIC ERROR]: ${data.error || 'Failed generating inference response.'}`,
            provider: isGemini ? 'gemini' : 'ollama',
            airgap: !isGemini,
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
    <div className="fixed bottom-5 right-5 z-50 w-[440px] max-w-[calc(100vw-2rem)] h-[580px] max-h-[calc(100vh-5rem)] bg-c2-surface/95 border border-c2-cyan/50 backdrop-blur-xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fadeIn">
      {/* Console Top Header */}
      <div className="p-3.5 bg-c2-bg border-b border-c2-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-c2-cyan/10 border border-c2-cyan/30 text-c2-cyan">
            <Bot className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-mono font-bold text-sm text-white">NEXUS AI COGNITION</h3>
              {provider === 'gemini' ? (
                <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-c2-purple/15 text-c2-purple border border-c2-purple/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {oauthStatus.connected ? 'GEMINI (OAUTH 2.0)' : 'GEMINI (AUTH REQUIRED)'}
                </span>
              ) : (
                <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-c2-green/15 text-c2-green border border-c2-green/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> LOCAL AIRGAP
                </span>
              )}
            </div>
            <p className="text-[10px] text-c2-textMuted font-mono">
              Dual-Engine: 19 Local Models + Google OAuth Gemini
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* OAuth Status Button */}
          <button
            onClick={() => setIsOAuthModalOpen(true)}
            className={`px-2 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1 border transition-all ${
              oauthStatus.connected
                ? 'bg-c2-green/10 border-c2-green/30 text-c2-green'
                : 'bg-c2-amber/10 border-c2-amber/30 text-c2-amber hover:bg-c2-amber/20'
            }`}
            title="Configure Google OAuth Token for Gemini"
          >
            {oauthStatus.connected ? <UserCheck className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            <span>{oauthStatus.connected ? 'OAuth' : 'Link OAuth'}</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-c2-textMuted hover:text-white hover:bg-c2-surface transition-all"
            title="Minimize to bottom right corner"
          >
            <Minus className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-c2-textMuted hover:text-white hover:bg-c2-surface transition-all"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Model & Engine Selector Sub-bar */}
      <div className="px-3.5 py-2 bg-c2-surface border-b border-c2-border flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        {/* Model Selector with Local & Gemini Categories */}
        <div className="flex items-center gap-1.5 w-full">
          <span className="text-[10px] text-c2-textMuted font-bold">SELECT LLM:</span>
          <select
            value={selectedModel}
            onChange={(e) => handleModelChange(e.target.value)}
            className="flex-1 bg-c2-bg border border-c2-border rounded px-2.5 py-1 text-[11px] text-c2-cyan font-mono focus:outline-none focus:border-c2-cyan truncate"
          >
            {/* GOOGLE GEMINI CLOUD (OAUTH) */}
            <optgroup label="── GOOGLE GEMINI (NEXT-GEN OAUTH) ──">
              <option value="gemini-3.8-flash">Google Gemini 3.8 Flash (High Speed & Reasoning)</option>
              <option value="gemini-3.5-flash">Google Gemini 3.5 Flash</option>
              <option value="gemini-3-flash">Google Gemini 3.0 Flash</option>
              <option value="gemini-2.5-flash">Google Gemini 2.5 Flash</option>
              <option value="gemini-2.0-flash">Google Gemini 2.0 Flash</option>
              <option value="gemini-3.8-pro">Google Gemini 3.8 Pro</option>
              <option value="gemini-1.5-flash">Google Gemini 1.5 Flash (Legacy)</option>
            </optgroup>

            {/* OLLAMA RUNTIMES */}
            <optgroup label={`── OLLAMA LOCAL RUNTIME (${models.filter(m => m.source === 'ollama').length}) ──`}>
              {models.filter(m => m.source === 'ollama').map((m) => (
                <option key={m.name} value={m.name}>
                  {m.name} ({m.size})
                </option>
              ))}
            </optgroup>

            {/* APPLE MLX */}
            {models.some(m => m.source === 'mlx') && (
              <optgroup label="── APPLE MLX LOCAL MODELS ──">
                {models.filter(m => m.source === 'mlx').map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name} ({m.size})
                  </option>
                ))}
              </optgroup>
            )}

            {/* LM STUDIO */}
            {models.some(m => m.source === 'lmstudio') && (
              <optgroup label="── LM STUDIO LOCAL CACHE ──">
                {models.filter(m => m.source === 'lmstudio').map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name} ({m.size})
                  </option>
                ))}
              </optgroup>
            )}

            {/* HUGGING FACE GGUF CACHE */}
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
                {msg.authType && (
                  <span className="text-c2-purple flex items-center gap-0.5">
                    <Sparkles className="w-3 h-3" /> {msg.authType}
                  </span>
                )}
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
            <span>Generating cognitive response ({selectedModel.split(':')[0]})...</span>
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
          placeholder={`Direct prompt to ${selectedModel.split(':')[0]}...`}
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

      {/* GOOGLE OAUTH MODAL FOR GEMINI */}
      {isOAuthModalOpen && (
        <div className="absolute inset-0 z-50 bg-c2-bg/95 backdrop-blur-md p-5 flex flex-col justify-between animate-fadeIn font-mono text-xs">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-c2-border">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-c2-purple" />
                <h4 className="font-bold text-sm text-white">GOOGLE OAUTH FOR GEMINI</h4>
              </div>
              <button
                onClick={() => setIsOAuthModalOpen(false)}
                className="text-c2-textMuted hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-c2-textMuted mt-3 mb-4 leading-relaxed">
              Authenticate Gemini using Google OAuth 2.0 Bearer tokens. This allows you to select Gemini alongside your 19 local models without creating individual API keys.
            </p>

            {tokenSaveMsg && (
              <div className="p-2.5 rounded bg-c2-green/10 border border-c2-green/30 text-c2-green mb-3 flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>{tokenSaveMsg}</span>
              </div>
            )}

            {/* Path 1: One-Click OAuth Login (if Client ID configured) */}
            {oauthStatus.authUrl && (
              <div className="mb-4 p-3 rounded-xl bg-c2-surface border border-c2-border">
                <span className="text-c2-cyan font-bold block mb-1">OPTION 1: ONE-CLICK GOOGLE SIGN-IN</span>
                <a
                  href={oauthStatus.authUrl}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-c2-purple text-white font-bold text-xs"
                >
                  <span>Authorize with Google Account</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {/* Path 2: Direct Bearer Token Input */}
            <form onSubmit={handleSaveOAuthToken} className="space-y-3">
              <span className="text-c2-purple font-bold block">
                {oauthStatus.authUrl ? 'OPTION 2: DIRECT OAUTH / ACCESS TOKEN' : 'ENTER GOOGLE OAUTH ACCESS TOKEN (ya29...)'}
              </span>
              <textarea
                value={manualOAuthToken}
                onChange={(e) => setManualOAuthToken(e.target.value)}
                placeholder="Paste Google OAuth Bearer Token (ya29...) or Vertex Access Token here..."
                rows={3}
                className="w-full bg-c2-surface border border-c2-border rounded-lg p-2 text-white placeholder-c2-textMuted focus:outline-none focus:border-c2-purple text-[11px]"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOAuthModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-c2-surface border border-c2-border text-c2-textMuted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded bg-c2-purple text-white font-bold shadow-lg"
                >
                  Save & Enable Gemini OAuth
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
