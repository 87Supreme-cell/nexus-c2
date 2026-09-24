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
  }>({
    connected: true,
    email: 'eighty7supreme@gmail.com',
    systemDetected: true,
    systemEmail: 'eighty7supreme@gmail.com',
    authMethod: 'system-keychain',
  });
  const [isOAuthModalOpen, setIsOAuthModalOpen] = useState(false);
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
    if (modelName.toLowerCase().startsWith('gemini') || modelName.toLowerCase().startsWith('claude')) {
      setProvider('gemini');
    } else {
      setProvider('ollama');
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
                <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-c2-green/15 text-c2-green border border-c2-green/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-c2-green" />
                  GOOGLE OAUTH: {oauthStatus.email?.split('@')[0] || 'supreme'}
                </span>
              ) : (
                <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-c2-cyan/15 text-c2-cyan border border-c2-cyan/30 flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5 text-c2-cyan" /> AIRGAP (ZERO-EGRESS)
                </span>
              )}
            </div>
            <p className="text-[9px] text-c2-textMuted font-mono">
              Dual-Engine: Curated Local Airgap + Google Gemini Cloud
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* OAuth Status Button */}
          <button
            onClick={() => setIsOAuthModalOpen(true)}
            className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold flex items-center gap-1 border transition-all bg-c2-green/10 border-c2-green/30 text-c2-green"
            title="Active Google OAuth Session (eighty7supreme@gmail.com)"
          >
            <UserCheck className="w-3 h-3 text-c2-green" />
            <span>OAuth Active</span>
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
        <div className="flex items-center gap-1.5 w-full">
          <span className="text-[10px] text-c2-textMuted font-bold">SELECT LLM:</span>
          <select
            value={selectedModel}
            onChange={(e) => handleModelChange(e.target.value)}
            className="flex-1 bg-c2-bg border border-c2-border rounded px-2.5 py-1 text-[11px] text-c2-cyan font-mono focus:outline-none focus:border-c2-cyan truncate"
          >
            {/* GOOGLE GEMINI CLOUD (OAUTH) */}
            <optgroup label="── GOOGLE GEMINI CLOUD (ACTIVE GOOGLE OAUTH) ──">
              <option value="gemini-3.8-flash">Google Gemini 3.8 Flash (High Speed & Reasoning)</option>
              <option value="gemini-3.1-pro">Google Gemini 3.1 Pro (Deep Thinking & Architecture)</option>
              <option value="claude-sonnet-4-6">Claude Sonnet 4.6 (Extended Thinking)</option>
            </optgroup>

            {/* CURATED LOCAL AIRGAP MODELS */}
            <optgroup label="── LOCAL AIRGAP INFERENCE (ZERO-EGRESS) ──">
              {models.map((m) => (
                <option key={m.name} value={m.name}>
                  {m.name} ({m.size})
                </option>
              ))}
            </optgroup>
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
                  <span>GOOGLE ACCOUNT AUTHENTICATED & READY</span>
                </div>
                <div className="p-3 rounded-lg bg-c2-bg border border-c2-border flex items-center justify-between">
                  <div>
                    <span className="text-white font-bold block text-xs">{oauthStatus.email || 'eighty7supreme@gmail.com'}</span>
                    <span className="text-[10px] text-c2-textMuted font-mono">System Keychain &bull; Zero-Egress Airgap Bridge</span>
                  </div>
                  <span className="text-[10px] text-c2-green bg-c2-green/15 px-2.5 py-1 rounded-full border border-c2-green/30 font-bold">
                    ACTIVE OAUTH
                  </span>
                </div>
                <p className="text-[11px] text-c2-textMuted leading-relaxed">
                  Google Gemini 3.8 Flash, 3.1 Pro, and Claude Sonnet 4.6 are active using your existing Google login session. No manual token or API key required.
                </p>
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleLaunchGoogleSignIn}
                    disabled={isConnecting}
                    className="flex-1 py-2 px-3 rounded-lg bg-c2-bg hover:bg-c2-surfaceHover border border-c2-border text-xs font-mono text-white transition-all text-center"
                  >
                    Switch Account (Browser)
                  </button>
                  <button
                    type="button"
                    onClick={handleDisconnectOAuth}
                    disabled={isConnecting}
                    className="py-2 px-3 rounded-lg bg-c2-red/10 border border-c2-red/30 text-c2-red hover:bg-c2-red/20 text-xs font-mono font-bold transition-all text-center"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 1-Click System Google Sign-in */}
                <div className="p-4 rounded-xl bg-c2-surface border border-c2-purple/50 space-y-2.5 shadow-lg">
                  <div className="flex items-center gap-1.5 text-c2-purple font-bold text-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AUTHENTICATE WITH GOOGLE</span>
                  </div>
                  <p className="text-[11px] text-c2-textMuted leading-relaxed">
                    Connect your active Google account ({oauthStatus.systemEmail || 'eighty7supreme@gmail.com'}) to enable Google Gemini models.
                  </p>
                  <button
                    type="button"
                    onClick={handleConnectSystemOAuth}
                    disabled={isConnecting}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition-all"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>{isConnecting ? 'Authenticating...' : `Sign in as ${oauthStatus.systemEmail || 'eighty7supreme@gmail.com'}`}</span>
                  </button>
                </div>

                {/* Google Sign-in in Browser */}
                <button
                  type="button"
                  onClick={handleLaunchGoogleSignIn}
                  disabled={isConnecting}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-c2-bg border border-c2-border text-white hover:bg-c2-surface font-bold text-xs transition-all shadow-md"
                >
                  <ExternalLink className="w-4 h-4 text-c2-cyan" />
                  <span>Open Google Sign-In Window</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
