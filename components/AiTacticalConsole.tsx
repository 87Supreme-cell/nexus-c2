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
  Minus,
  ChevronUp,
  Maximize2,
  Minimize2
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

  // Layout View States (Minimize & Expand Height)
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Google OAuth State
  const [oauthStatus, setOauthStatus] = useState<{
    connected: boolean;
    email?: string;
    authUrl?: string | null;
    systemDetected?: boolean;
    systemEmail?: string;
    authMethod?: string;
  }>({ connected: false });
  const [isOAuthModalOpen, setIsOAuthModalOpen] = useState(false);
  const [manualOAuthToken, setManualOAuthToken] = useState('');
  const [tokenSaveMsg, setTokenSaveMsg] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Check Google OAuth on mount
  const refreshOAuthStatus = async () => {
    try {
      const res = await fetch('/api/auth/google');
      if (res.ok) {
        const data = await res.json();
        setOauthStatus({
          connected: Boolean(data.connected),
          email: data.email,
          authUrl: data.authUrl,
          systemDetected: Boolean(data.systemDetected),
          systemEmail: data.systemEmail,
          authMethod: data.authMethod,
        });
      }
    } catch {}
  };

  useEffect(() => {
    refreshOAuthStatus();
  }, []);

  const handleConnectSystemOAuth = async () => {
    setIsConnecting(true);
    setTokenSaveMsg('Synchronizing Google Account from system session...');
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect-system' }),
      });
      const data = await res.json();
      if (res.ok && data.connected) {
        setTokenSaveMsg(`Signed in successfully as ${data.email || 'operator@google.com'}!`);
        await refreshOAuthStatus();
        setTimeout(() => {
          setIsOAuthModalOpen(false);
          setTokenSaveMsg(null);
        }, 1200);
      } else {
        setTokenSaveMsg(data.error || 'Failed connecting system account');
      }
    } catch (err: any) {
      setTokenSaveMsg(err.message || 'Connection error');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleLaunchGoogleSignIn = async () => {
    setIsConnecting(true);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'launch-browser-login' }),
      });
      const data = await res.json();
      if (data.url && !data.launched) {
        window.open(data.url, '_blank');
      }
      setTokenSaveMsg('Google Sign-In window opened. Complete sign-in in your browser.');
    } catch {
      if (oauthStatus.authUrl) {
        window.open(oauthStatus.authUrl, '_blank');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectOAuth = async () => {
    setIsConnecting(true);
    try {
      await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect' }),
      });
      setTokenSaveMsg('Google Account disconnected.');
      await refreshOAuthStatus();
      setTimeout(() => setTokenSaveMsg(null), 1500);
    } finally {
      setIsConnecting(false);
    }
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'TACTICAL AI COGNITION ENGINE ONLINE. Air-gapped local models and Google OAuth-enabled Gemini are active. Ready to orchestrate runtimes or analyze mission parameters.',
      provider: 'ollama',
      model: selectedModel,
      airgap: true,
    },
  ]);

  // CLOSED STATE: Compact, unobtrusive floating button in bottom right corner
  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-40 animate-fadeIn">
        <button
          onClick={onOpen || onClose}
          className="group flex items-center gap-2.5 px-3 py-2 rounded-xl bg-c2-surface/90 border border-c2-cyan/50 hover:border-c2-cyan shadow-cyan-glow hover:scale-[1.02] transition-all backdrop-blur-xl font-mono text-xs"
          title="Open AI Tactical Console (Bottom Right Corner)"
        >
          <div className="relative flex items-center justify-center w-6 h-6 rounded-lg bg-c2-bg border border-c2-cyan/50 text-c2-cyan">
            <Bot className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-c2-green animate-pulse" />
          </div>
          <div className="flex items-center gap-1.5 text-left">
            <span className="font-bold text-white">AI CHAT</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-c2-cyan/15 text-c2-cyan border border-c2-cyan/30 hidden sm:inline">
              {selectedModel.split(':')[0]}
            </span>
          </div>
        </button>
      </div>
    );
  }

  // MINIMIZED STATE: 40px ultra-slim bar in bottom right corner
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50 animate-fadeIn">
        <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-c2-surface/95 border border-c2-cyan/60 backdrop-blur-xl shadow-cyan-glow font-mono text-xs">
          <div className="relative flex items-center justify-center w-6 h-6 rounded-lg bg-c2-bg border border-c2-cyan/50 text-c2-cyan">
            <Bot className="w-3.5 h-3.5" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-c2-green animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">NEXUS AI</span>
            <span className="text-[10px] text-c2-cyan px-1.5 py-0.5 rounded bg-c2-cyan/15 border border-c2-cyan/30">
              {selectedModel.split(':')[0]}
            </span>
          </div>
          <div className="flex items-center gap-1 border-l border-c2-border/80 pl-2">
            <button
              onClick={() => setIsMinimized(false)}
              className="p-1 rounded text-c2-textMuted hover:text-white hover:bg-c2-surfaceHover transition-all"
              title="Expand Chat Window"
            >
              <ChevronUp className="w-4 h-4 text-c2-cyan" />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-c2-textMuted hover:text-white hover:bg-c2-surfaceHover transition-all"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
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
    <div className={`fixed bottom-4 right-4 z-50 w-[420px] max-w-[calc(100vw-2rem)] ${
      isExpanded ? 'h-[660px]' : 'h-[520px]'
    } max-h-[calc(100vh-5rem)] bg-c2-surface/95 border border-c2-cyan/50 backdrop-blur-xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fadeIn`}>
      {/* Console Top Header */}
      <div className="p-3 bg-c2-bg border-b border-c2-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-c2-cyan/10 border border-c2-cyan/30 text-c2-cyan">
            <Bot className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-mono font-bold text-xs text-white">NEXUS COGNITION</h3>
              {provider === 'gemini' ? (
                <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-c2-purple/15 text-c2-purple border border-c2-purple/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  {oauthStatus.connected ? 'OAUTH 2.0' : 'AUTH REQ'}
                </span>
              ) : (
                <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-c2-green/15 text-c2-green border border-c2-green/30 flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5" /> AIRGAP
                </span>
              )}
            </div>
            <p className="text-[9px] text-c2-textMuted font-mono">
              Dual-Engine: 19 Local Models + Gemini
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* OAuth Status Button */}
          <button
            onClick={() => setIsOAuthModalOpen(true)}
            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold flex items-center gap-1 border transition-all ${
              oauthStatus.connected
                ? 'bg-c2-green/10 border-c2-green/30 text-c2-green'
                : 'bg-c2-amber/10 border-c2-amber/30 text-c2-amber hover:bg-c2-amber/20'
            }`}
            title="Configure Google OAuth Token for Gemini"
          >
            {oauthStatus.connected ? <UserCheck className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            <span>{oauthStatus.connected ? 'OAuth' : 'Link OAuth'}</span>
          </button>

          {/* Minimize to bottom right dock bar */}
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 rounded-lg text-c2-textMuted hover:text-white hover:bg-c2-surface transition-all"
            title="Minimize to compact bar"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          {/* Height Expand/Compact toggle */}
          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-1.5 rounded-lg text-c2-textMuted hover:text-white hover:bg-c2-surface transition-all"
            title={isExpanded ? 'Compact height' : 'Expand height'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-c2-textMuted hover:text-white hover:bg-c2-surface transition-all"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
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
              <option value="gemini-3.7-flash">Google Gemini 3.7 Flash</option>
              <option value="gemini-3.6-flash">Google Gemini 3.6 Flash</option>
              <option value="gemini-3.1-pro">Google Gemini 3.1 Pro (Deep Thinking)</option>
              <option value="claude-sonnet-4-6">Claude Sonnet 4.6 (Thinking via OAuth)</option>
              <option value="claude-opus-4-6-thinking">Claude Opus 4.6 (Thinking via OAuth)</option>
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

      {/* GOOGLE OAUTH SIGN-IN MODAL FOR GEMINI */}
      {isOAuthModalOpen && (
        <div className="absolute inset-0 z-50 bg-c2-bg/95 backdrop-blur-md p-5 flex flex-col justify-between animate-fadeIn font-mono text-xs overflow-y-auto">
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
              Authenticate Gemini using your Google Account. Enables Google Gemini 3.8 Flash, 3.5 Flash, and 3.8 Pro with zero API key configuration.
            </p>

            {tokenSaveMsg && (
              <div
                className={`p-2.5 rounded mb-4 flex items-center gap-2 border ${
                  tokenSaveMsg.toLowerCase().includes('failed') || tokenSaveMsg.toLowerCase().includes('error')
                    ? 'bg-c2-red/10 border-c2-red/30 text-c2-red'
                    : 'bg-c2-green/10 border-c2-green/30 text-c2-green'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>{tokenSaveMsg}</span>
              </div>
            )}

            {/* IF CONNECTED */}
            {oauthStatus.connected ? (
              <div className="p-4 rounded-xl bg-c2-surface border border-c2-green/40 mb-4 space-y-3">
                <div className="flex items-center gap-2 text-c2-green font-bold">
                  <UserCheck className="w-4 h-4" />
                  <span>GOOGLE ACCOUNT LINKED & ACTIVE</span>
                </div>
                <div className="p-2.5 rounded-lg bg-c2-bg border border-c2-border flex items-center justify-between">
                  <span className="text-white font-bold">{oauthStatus.email || 'eighty7supreme@gmail.com'}</span>
                  <span className="text-[10px] text-c2-green bg-c2-green/15 px-2 py-0.5 rounded border border-c2-green/30 font-bold">
                    OAuth 2.0
                  </span>
                </div>
                <p className="text-[11px] text-c2-textMuted">
                  Gemini 3.8 Flash and next-gen Google models are active and authenticated.
                </p>
                <button
                  type="button"
                  onClick={handleDisconnectOAuth}
                  disabled={isConnecting}
                  className="w-full py-2 rounded-lg bg-c2-red/10 border border-c2-red/30 text-c2-red hover:bg-c2-red/20 font-bold transition-all text-center"
                >
                  Disconnect Google Account
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Option 1: 1-Click System Google Sign-in */}
                {oauthStatus.systemEmail && (
                  <div className="p-4 rounded-xl bg-c2-surface border border-c2-purple/50 space-y-2.5 shadow-lg">
                    <div className="flex items-center gap-1.5 text-c2-purple font-bold text-xs">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>RECOMMENDED: 1-CLICK SYSTEM SIGN-IN</span>
                    </div>
                    <p className="text-[11px] text-c2-textMuted leading-relaxed">
                      Detected active Google account from your system:
                    </p>
                    <button
                      type="button"
                      onClick={handleConnectSystemOAuth}
                      disabled={isConnecting}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition-all"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>{isConnecting ? 'Connecting...' : `Sign in as ${oauthStatus.systemEmail}`}</span>
                    </button>
                  </div>
                )}

                {/* Option 2: Google Sign-in in Browser */}
                <div className="p-4 rounded-xl bg-c2-surface border border-c2-border space-y-2.5">
                  <span className="text-white font-bold block text-xs">SIGN IN WITH GOOGLE (BROWSER)</span>
                  <p className="text-[11px] text-c2-textMuted leading-relaxed">
                    Authenticate via Google OAuth consent screen in your web browser.
                  </p>
                  <button
                    type="button"
                    onClick={handleLaunchGoogleSignIn}
                    disabled={isConnecting}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white text-gray-900 hover:bg-gray-100 font-bold text-xs transition-all shadow-md"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Sign in with Google</span>
                  </button>
                </div>

                {/* Collapsible Advanced Section */}
                <details className="pt-2 text-c2-textMuted">
                  <summary className="cursor-pointer text-[11px] hover:text-white font-mono">
                    ▸ Advanced: Manual Bearer Token or API Key
                  </summary>
                  <form onSubmit={handleSaveOAuthToken} className="mt-3 space-y-2">
                    <textarea
                      value={manualOAuthToken}
                      onChange={(e) => setManualOAuthToken(e.target.value)}
                      placeholder="Paste Google OAuth Bearer Token (ya29...) or Vertex Access Token here..."
                      rows={2}
                      className="w-full bg-c2-surface border border-c2-border rounded-lg p-2 text-white placeholder-c2-textMuted focus:outline-none focus:border-c2-purple text-[11px]"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded bg-c2-purple text-white font-bold text-xs"
                      >
                        Save Token
                      </button>
                    </div>
                  </form>
                </details>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
