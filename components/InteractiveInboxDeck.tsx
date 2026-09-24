'use client';

import React, { useState, useEffect } from 'react';
import { EmailMessage, EmailDraft } from '@/lib/email-service';
import { 
  Mail, 
  Send, 
  Sparkles, 
  ShieldCheck, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Search, 
  User, 
  Clock, 
  Tag, 
  Copy, 
  Check, 
  Plus, 
  X, 
  CornerUpLeft, 
  Loader2,
  Filter,
  CheckCheck
} from 'lucide-react';

interface InteractiveInboxDeckProps {
  initialEmails?: EmailMessage[];
  defaultAccountFilter?: 'all' | 'eighty7supreme@gmail.com' | 'josh@symbrook.com';
}

export const InteractiveInboxDeck: React.FC<InteractiveInboxDeckProps> = ({
  defaultAccountFilter = 'all',
}) => {
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [accountFilter, setAccountFilter] = useState<'all' | 'eighty7supreme@gmail.com' | 'josh@symbrook.com'>(defaultAccountFilter);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // AI Reply Studio State
  const [replyTone, setReplyTone] = useState<'tactical' | 'executive' | 'concise' | 'urgent'>('tactical');
  const [customDirectives, setCustomDirectives] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);
  const [copiedDraft, setCopiedDraft] = useState(false);

  // New Compose Modal State
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composePurpose, setComposePurpose] = useState('');
  const [composeAccount, setComposeAccount] = useState<'eighty7supreme@gmail.com' | 'josh@symbrook.com'>('eighty7supreme@gmail.com');
  const [isComposingAi, setIsComposingAi] = useState(false);
  const [composedBody, setComposedBody] = useState('');

  const fetchEmails = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/email');
      if (res.ok) {
        const data = await res.json();
        if (data.emails) {
          setEmails(data.emails);
          if (!selectedEmail && data.emails.length > 0) {
            setSelectedEmail(data.emails[0]);
          }
        }
      }
    } catch (err) {
      console.error('Failed fetching emails:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  const handleSelectEmail = (msg: EmailMessage) => {
    setSelectedEmail(msg);
    setDraftBody('');
    setDispatchStatus(null);
    if (msg.unread) {
      handleMarkRead(msg.id, false);
    }
  };

  const handleMarkRead = async (id: string, unread: boolean) => {
    try {
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark-read', id, unread }),
      });
      const data = await res.json();
      if (data.success && data.emails) {
        setEmails(data.emails);
        if (selectedEmail?.id === id) {
          setSelectedEmail((prev) => (prev ? { ...prev, unread } : null));
        }
      }
    } catch (err) {
      console.error('Error toggling read status:', err);
    }
  };

  const handleDeleteEmail = async (id: string) => {
    try {
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      const data = await res.json();
      if (data.success && data.emails) {
        setEmails(data.emails);
        if (selectedEmail?.id === id) {
          setSelectedEmail(data.emails[0] || null);
        }
      }
    } catch (err) {
      console.error('Error deleting email:', err);
    }
  };

  const handleGenerateReply = async () => {
    if (!selectedEmail) return;
    setIsGeneratingDraft(true);
    setDispatchStatus(null);
    try {
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'draft-reply',
          emailId: selectedEmail.id,
          tone: replyTone,
          customNotes: customDirectives,
        }),
      });
      const data = await res.json();
      if (data.success && data.draft) {
        setDraftBody(data.draft.body);
      }
    } catch (err: any) {
      setDraftBody(`Error generating reply: ${err.message}`);
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  const handleDispatchReply = async () => {
    if (!selectedEmail || !draftBody.trim()) return;
    setDispatchStatus('Dispatching via Google OAuth...');
    try {
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          to: selectedEmail.senderEmail,
          from: selectedEmail.accountEmail,
          subject: selectedEmail.subject.startsWith('Re:') ? selectedEmail.subject : `Re: ${selectedEmail.subject}`,
          body: draftBody,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDispatchStatus('Message Dispatched Successfully via Google Session!');
        setTimeout(() => {
          setDraftBody('');
          setDispatchStatus(null);
        }, 3000);
      }
    } catch (err: any) {
      setDispatchStatus(`Dispatch failed: ${err.message}`);
    }
  };

  const handleAiCompose = async () => {
    if (!composeTo || !composeSubject) return;
    setIsComposingAi(true);
    try {
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'compose-ai',
          to: composeTo,
          subject: composeSubject,
          purpose: composePurpose,
          accountEmail: composeAccount,
        }),
      });
      const data = await res.json();
      if (data.success && data.draft) {
        setComposedBody(data.draft.body);
      }
    } catch (err: any) {
      setComposedBody(`Composition failed: ${err.message}`);
    } finally {
      setIsComposingAi(false);
    }
  };

  const handleCopyDraft = () => {
    if (!draftBody) return;
    navigator.clipboard.writeText(draftBody);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  const filteredEmails = emails.filter((e) => {
    const matchesAccount = accountFilter === 'all' || e.accountEmail === accountFilter;
    const matchesUnread = !unreadOnly || e.unread;
    const matchesQuery = 
      e.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.snippet.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAccount && matchesUnread && matchesQuery;
  });

  const unreadTotal = emails.filter((e) => e.unread).length;

  return (
    <div className="space-y-4 font-mono animate-fadeIn">
      {/* Top Controls & Account Triage Bar */}
      <div className="p-4 rounded-2xl bg-c2-card border border-c2-border flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="p-2 rounded-xl bg-c2-cyan/15 border border-c2-cyan/30 text-c2-cyan">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-white">TACTICAL INBOX &amp; AI RESPONSE STUDIO</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-c2-cyan/15 text-c2-cyan border border-c2-cyan/30">
                {unreadTotal} UNREAD
              </span>
            </div>
            <p className="text-xs text-c2-textMuted font-sans">
              Live dual-account email triage with Gemini 3.8 Flash automated reply drafting
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setIsComposeOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-c2-cyan text-c2-bg font-bold text-xs shadow-cyan-glow hover:bg-c2-cyan/90 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>COMPOSE WITH AI</span>
          </button>
          <button
            onClick={fetchEmails}
            disabled={isLoading}
            className="p-2 rounded-xl bg-c2-surface hover:bg-c2-surfaceHover border border-c2-border text-c2-textMuted hover:text-white transition-all disabled:opacity-50"
            title="Refresh Inboxes"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-c2-cyan' : ''}`} />
          </button>
        </div>
      </div>

      {/* Account Filters & Search Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-c2-surface border border-c2-border text-xs">
        {/* Account Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setAccountFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              accountFilter === 'all'
                ? 'bg-c2-cyan/20 border border-c2-cyan text-c2-cyan font-bold'
                : 'text-c2-textMuted hover:text-white hover:bg-c2-surfaceHover'
            }`}
          >
            ALL INBOXES ({emails.length})
          </button>
          <button
            onClick={() => setAccountFilter('eighty7supreme@gmail.com')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              accountFilter === 'eighty7supreme@gmail.com'
                ? 'bg-c2-cyan/20 border border-c2-cyan text-c2-cyan font-bold'
                : 'text-c2-textMuted hover:text-white hover:bg-c2-surfaceHover'
            }`}
          >
            DEFENSE (eighty7supreme)
          </button>
          <button
            onClick={() => setAccountFilter('josh@symbrook.com')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              accountFilter === 'josh@symbrook.com'
                ? 'bg-c2-green/20 border border-c2-green text-c2-green font-bold'
                : 'text-c2-textMuted hover:text-white hover:bg-c2-surfaceHover'
            }`}
          >
            ENTERPRISE (josh@symbrook)
          </button>

          <button
            onClick={() => setUnreadOnly((prev) => !prev)}
            className={`px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1 ${
              unreadOnly
                ? 'bg-c2-amber/20 border-c2-amber text-c2-amber font-bold'
                : 'border-c2-border text-c2-textMuted hover:text-white'
            }`}
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Unread Only</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-c2-textMuted absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subject, sender..."
            className="w-full bg-c2-bg border border-c2-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-c2-textMuted focus:outline-none focus:border-c2-cyan"
          />
        </div>
      </div>

      {/* MASTER/DETAIL SPLIT-SCREEN WORKBENCH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[720px]">
        {/* LEFT PANE: EMAIL LIST (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl bg-c2-card border border-c2-border overflow-hidden flex flex-col">
          <div className="p-3 bg-c2-bg border-b border-c2-border flex items-center justify-between text-xs text-c2-textMuted">
            <span>INBOX QUEUE ({filteredEmails.length})</span>
            <span>SORT: RECENT</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-c2-border/60">
            {filteredEmails.length === 0 ? (
              <div className="p-8 text-center text-c2-textMuted text-xs">
                No messages match current filter parameters.
              </div>
            ) : (
              filteredEmails.map((msg) => {
                const isSelected = selectedEmail?.id === msg.id;
                const isDefense = msg.accountEmail === 'eighty7supreme@gmail.com';
                return (
                  <div
                    key={msg.id}
                    onClick={() => handleSelectEmail(msg)}
                    className={`p-3.5 cursor-pointer transition-all flex flex-col justify-between gap-1.5 ${
                      isSelected
                        ? 'bg-c2-surfaceHover border-l-4 border-l-c2-cyan'
                        : 'hover:bg-c2-surface/70'
                    } ${msg.unread ? 'bg-c2-surface/30' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        {msg.unread && (
                          <span className="w-2 h-2 rounded-full bg-c2-cyan shrink-0 animate-pulse" />
                        )}
                        <span className={`font-bold text-xs truncate ${msg.unread ? 'text-white' : 'text-slate-300'}`}>
                          {msg.senderName}
                        </span>
                      </div>
                      <span className="text-[10px] text-c2-textMuted shrink-0">
                        {msg.date}
                      </span>
                    </div>

                    <h4 className={`text-xs truncate ${msg.unread ? 'font-bold text-white' : 'text-slate-300'}`}>
                      {msg.subject}
                    </h4>

                    <p className="text-[11px] text-c2-textMuted font-sans line-clamp-1">
                      {msg.snippet}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[10px]">
                      <span className={`px-1.5 py-0.5 rounded font-mono ${
                        isDefense ? 'bg-c2-cyan/10 text-c2-cyan border border-c2-cyan/30' : 'bg-c2-green/10 text-c2-green border border-c2-green/30'
                      }`}>
                        {isDefense ? 'DEFENSE' : 'ENTERPRISE'}
                      </span>
                      {msg.priority === 'critical' && (
                        <span className="text-c2-red font-bold flex items-center gap-0.5">
                          <AlertTriangle className="w-3 h-3" /> URGENT
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANE: EMAIL VIEWER & AI RESPONSE STUDIO (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl bg-c2-card border border-c2-border overflow-hidden flex flex-col">
          {selectedEmail ? (
            <div className="flex-1 flex flex-col overflow-y-auto">
              {/* Email Detail Top Header */}
              <div className="p-4 bg-c2-bg border-b border-c2-border space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-base text-white leading-tight">
                      {selectedEmail.subject}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-c2-textMuted">
                      <span className="text-white font-bold">{selectedEmail.senderName}</span>
                      <span>&lt;{selectedEmail.senderEmail}&gt;</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleMarkRead(selectedEmail.id, !selectedEmail.unread)}
                      className="p-1.5 rounded-lg bg-c2-surface hover:bg-c2-surfaceHover border border-c2-border text-xs text-c2-textMuted hover:text-white transition-all"
                      title={selectedEmail.unread ? 'Mark as Read' : 'Mark as Unread'}
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteEmail(selectedEmail.id)}
                      className="p-1.5 rounded-lg bg-c2-surface hover:bg-c2-surfaceHover border border-c2-border text-xs text-c2-red hover:bg-c2-red/10 transition-all"
                      title="Delete Email"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Metadata tags */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-c2-textMuted pt-1 border-t border-c2-border/60">
                  <div className="flex items-center gap-2">
                    <span>TO: <strong className="text-c2-cyan">{selectedEmail.accountEmail}</strong></span>
                    <span>&bull;</span>
                    <span>{new Date(selectedEmail.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {selectedEmail.labels.map((lbl) => (
                      <span key={lbl} className="px-1.5 py-0.5 rounded bg-c2-surface border border-c2-border text-[9px] text-slate-300">
                        {lbl}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Full Email Body */}
              <div className="p-5 text-xs text-slate-200 font-sans leading-relaxed whitespace-pre-wrap border-b border-c2-border bg-c2-bg/40">
                {selectedEmail.body}
              </div>

              {/* INTERACTIVE GEMINI AI RESPONSE STUDIO */}
              <div className="p-4 bg-c2-surface/90 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-c2-cyan uppercase">
                      <Sparkles className="w-4 h-4 text-c2-cyan" />
                      <span>GEMINI AI RESPONSE STUDIO</span>
                    </div>

                    {/* Tone Selectors */}
                    <div className="flex items-center gap-1 text-[10px]">
                      <span className="text-c2-textMuted mr-1">TONE:</span>
                      {(['tactical', 'executive', 'concise', 'urgent'] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setReplyTone(t)}
                          className={`px-2 py-0.5 rounded uppercase font-bold transition-all ${
                            replyTone === t
                              ? 'bg-c2-cyan/20 border border-c2-cyan text-c2-cyan'
                              : 'bg-c2-bg border border-c2-border text-c2-textMuted hover:text-white'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Optional Directives */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customDirectives}
                      onChange={(e) => setCustomDirectives(e.target.value)}
                      placeholder="Operator directives (e.g. Confirm attendence, attach airgap attestation)..."
                      className="flex-1 bg-c2-bg border border-c2-border rounded-lg px-3 py-1.5 text-xs text-white placeholder-c2-textMuted focus:outline-none focus:border-c2-cyan"
                    />
                    <button
                      onClick={handleGenerateReply}
                      disabled={isGeneratingDraft}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-c2-cyan hover:bg-c2-cyan/90 text-c2-bg font-bold text-xs shadow-cyan-glow transition-all disabled:opacity-50 whitespace-nowrap"
                    >
                      {isGeneratingDraft ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      <span>{draftBody ? 'RE-DRAFT' : 'GENERATE REPLY'}</span>
                    </button>
                  </div>

                  {/* Draft Text Area */}
                  {draftBody && (
                    <div className="space-y-2 animate-fadeIn">
                      <div className="flex items-center justify-between text-[11px] text-c2-textMuted">
                        <span className="text-c2-green font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-c2-green" />
                          DRAFT READY FOR DISPATCH ({replyTone.toUpperCase()})
                        </span>
                        <button
                          onClick={handleCopyDraft}
                          className="flex items-center gap-1 text-c2-cyan hover:underline"
                        >
                          {copiedDraft ? <Check className="w-3 h-3 text-c2-green" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedDraft ? 'Copied' : 'Copy Draft'}</span>
                        </button>
                      </div>
                      <textarea
                        value={draftBody}
                        onChange={(e) => setDraftBody(e.target.value)}
                        rows={6}
                        className="w-full bg-c2-bg border border-c2-cyan/40 rounded-xl p-3 text-xs text-slate-100 font-mono focus:outline-none focus:border-c2-cyan resize-none leading-relaxed"
                      />
                    </div>
                  )}

                  {dispatchStatus && (
                    <div className="p-2.5 rounded-lg bg-c2-green/10 border border-c2-green/30 text-c2-green text-xs font-bold animate-fadeIn">
                      {dispatchStatus}
                    </div>
                  )}
                </div>

                {/* Dispatch Trigger */}
                {draftBody && (
                  <div className="pt-3 border-t border-c2-border flex items-center justify-between gap-3">
                    <span className="text-[10px] text-c2-textMuted">
                      Sends via authenticated Google OAuth session ({selectedEmail.accountEmail})
                    </span>
                    <button
                      onClick={handleDispatchReply}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-c2-green hover:bg-c2-green/90 text-c2-bg font-bold text-xs shadow-green-glow transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>DISPATCH REPLY</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-c2-textMuted text-xs">
              Select an email from the inbox queue to review details and generate AI responses.
            </div>
          )}
        </div>
      </div>

      {/* NEW COMPOSE WITH AI MODAL */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-c2-bg/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-c2-surface border border-c2-cyan/50 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-c2-border pb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-c2-cyan" />
                <h3 className="font-bold text-white text-sm">COMPOSE EMAIL WITH GEMINI</h3>
              </div>
              <button
                onClick={() => setIsComposeOpen(false)}
                className="p-1.5 rounded-lg text-c2-textMuted hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-c2-textMuted block mb-1">FROM ACCOUNT:</label>
                  <select
                    value={composeAccount}
                    onChange={(e: any) => setComposeAccount(e.target.value)}
                    className="w-full bg-c2-bg border border-c2-border rounded-lg p-2 text-xs text-c2-cyan"
                  >
                    <option value="eighty7supreme@gmail.com">eighty7supreme@gmail.com (Defense)</option>
                    <option value="josh@symbrook.com">josh@symbrook.com (Enterprise)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-c2-textMuted block mb-1">RECIPIENT (TO):</label>
                  <input
                    type="email"
                    value={composeTo}
                    onChange={(e) => setComposeTo(e.target.value)}
                    placeholder="commander@ca.ang.af.mil or client@acme.com"
                    className="w-full bg-c2-bg border border-c2-border rounded-lg p-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-c2-textMuted block mb-1">SUBJECT:</label>
                <input
                  type="text"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="Subject line..."
                  className="w-full bg-c2-bg border border-c2-border rounded-lg p-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-c2-textMuted block mb-1">PURPOSE &amp; BULLET POINTS FOR GEMINI:</label>
                <textarea
                  value={composePurpose}
                  onChange={(e) => setComposePurpose(e.target.value)}
                  rows={3}
                  placeholder="Explain what this email is about. Gemini will turn this into a formatted, professional draft..."
                  className="w-full bg-c2-bg border border-c2-border rounded-lg p-2 text-xs text-white"
                />
              </div>

              <button
                onClick={handleAiCompose}
                disabled={isComposingAi || !composeTo || !composeSubject}
                className="w-full py-2 rounded-xl bg-c2-cyan text-c2-bg font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50 shadow-cyan-glow"
              >
                {isComposingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>GENERATE COMPLETE EMAIL DRAFT</span>
              </button>

              {composedBody && (
                <div className="space-y-2 pt-2 border-t border-c2-border">
                  <div className="flex items-center justify-between text-[11px] text-c2-green font-bold">
                    <span>AI DRAFT GENERATED:</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(composedBody);
                        alert('Copied to clipboard');
                      }}
                      className="text-c2-cyan underline"
                    >
                      Copy to Clipboard
                    </button>
                  </div>
                  <textarea
                    value={composedBody}
                    onChange={(e) => setComposedBody(e.target.value)}
                    rows={6}
                    className="w-full bg-c2-bg border border-c2-green/40 rounded-xl p-3 text-xs text-white font-mono leading-relaxed"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
