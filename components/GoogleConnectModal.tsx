'use client';

import React, { useState } from 'react';
import { X, Calendar, Check, Link, Sparkles, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { GoogleAccountConfig } from '@/lib/google-calendar-service';

interface GoogleConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: GoogleAccountConfig | null;
  onAccountUpdated: () => void;
}

export const GoogleConnectModal: React.FC<GoogleConnectModalProps> = ({
  isOpen,
  onClose,
  account,
  onAccountUpdated,
}) => {
  const [email, setEmail] = useState(account?.email || '');
  const [accountIndex, setAccountIndex] = useState(account?.accountIndex ?? 0);
  const [icalUrl, setIcalUrl] = useState(account?.icalUrl || '');
  const [syncMethod, setSyncMethod] = useState<'ical' | 'oauth'>('ical');
  const [clientId, setClientId] = useState(account?.clientId || '');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  if (!isOpen) return null;

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage('Connecting Google Calendar feed...');
    setIsError(false);

    try {
      const res = await fetch('/api/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'connect-account',
          email: email.trim(),
          accountIndex,
          syncMethod,
          icalUrl: icalUrl.trim(),
          clientId: clientId.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatusMessage('Google Calendar connected and synchronized successfully!');
        setTimeout(() => {
          onAccountUpdated();
          onClose();
        }, 1200);
      } else {
        setIsError(true);
        setStatusMessage(data.error || 'Failed connecting account');
      }
    } catch (err: any) {
      setIsError(true);
      setStatusMessage(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await fetch('/api/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect' }),
      });
      onAccountUpdated();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="w-full max-w-lg rounded-2xl bg-c2-surface border border-c2-green/40 shadow-2xl overflow-hidden font-mono text-xs">
        {/* Header */}
        <div className="p-4 bg-c2-bg border-b border-c2-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-c2-green/10 border border-c2-green/30 text-c2-green">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">CONNECT GOOGLE ACCOUNT & CALENDAR</h3>
              <p className="text-[11px] text-c2-textMuted">Synchronize your live Google agenda & Workspace suite</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-c2-textMuted hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleConnect} className="p-5 space-y-4">
          {statusMessage && (
            <div
              className={`p-3 rounded-lg border flex items-center gap-2 text-xs ${
                isError
                  ? 'bg-c2-red/10 border-c2-red/30 text-c2-red'
                  : 'bg-c2-green/10 border-c2-green/30 text-c2-green'
              }`}
            >
              {isError ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Account Profile Details */}
          <div>
            <label className="block text-c2-textMuted mb-1">GOOGLE ACCOUNT EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. symbrook@gmail.com"
              className="w-full bg-c2-bg border border-c2-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-c2-green"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-c2-textMuted mb-1">CHROME ACCOUNT SLOT</label>
              <select
                value={accountIndex}
                onChange={(e) => setAccountIndex(parseInt(e.target.value, 10))}
                className="w-full bg-c2-bg border border-c2-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-c2-green"
              >
                <option value={0}>Account 1 (u/0 - Default)</option>
                <option value={1}>Account 2 (u/1)</option>
                <option value={2}>Account 3 (u/2)</option>
              </select>
            </div>

            <div>
              <label className="block text-c2-textMuted mb-1">SYNC METHOD</label>
              <select
                value={syncMethod}
                onChange={(e) => setSyncMethod(e.target.value as any)}
                className="w-full bg-c2-bg border border-c2-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-c2-green"
              >
                <option value="ical">Instant iCal / ICS Feed</option>
                <option value="oauth">Google Cloud OAuth</option>
              </select>
            </div>
          </div>

          {/* Sync Method 1: iCal URL */}
          {syncMethod === 'ical' ? (
            <div className="space-y-1.5 p-3 rounded-xl bg-c2-bg border border-c2-border">
              <label className="block text-c2-green font-bold flex items-center justify-between">
                <span>GOOGLE CALENDAR ICAL / ICS URL</span>
                <a
                  href={`https://calendar.google.com/calendar/u/${accountIndex}/r/settings`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-c2-cyan hover:underline flex items-center gap-1 font-normal"
                >
                  Find in Calendar Settings <ExternalLink className="w-3 h-3" />
                </a>
              </label>
              <input
                type="text"
                value={icalUrl}
                onChange={(e) => setIcalUrl(e.target.value)}
                placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
                className="w-full bg-c2-surface border border-c2-border rounded-lg px-3 py-2 text-white placeholder-c2-textMuted focus:outline-none focus:border-c2-green text-[11px]"
              />
              <p className="text-[10px] text-c2-textMuted leading-relaxed pt-1">
                Tip: In Google Calendar on the web, click ⚙ Settings → select your calendar → scroll to &quot;Secret address in iCal format&quot; and paste it here for instant live sync without needing GCP setup.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 p-3 rounded-xl bg-c2-bg border border-c2-border">
              <label className="block text-c2-green font-bold">GOOGLE OAUTH CLIENT ID</label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="e.g. 123456789-abc.apps.googleusercontent.com"
                className="w-full bg-c2-surface border border-c2-border rounded-lg px-3 py-2 text-white placeholder-c2-textMuted focus:outline-none focus:border-c2-green text-[11px]"
              />
            </div>
          )}

          {/* Direct Launch Preview */}
          <div className="pt-2 flex items-center justify-between text-c2-textMuted text-[11px]">
            <span>Target Web URL:</span>
            <a
              href={`https://calendar.google.com/calendar/u/${accountIndex}/r`}
              target="_blank"
              rel="noreferrer"
              className="text-c2-cyan hover:underline flex items-center gap-1"
            >
              calendar.google.com/calendar/u/{accountIndex}/r
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-c2-border flex items-center justify-between">
            {account?.connected ? (
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg bg-c2-red/10 border border-c2-red/30 text-c2-red hover:bg-c2-red/20 transition-all"
              >
                Disconnect
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-c2-bg hover:bg-c2-surfaceHover border border-c2-border text-c2-textMuted hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-c2-green hover:bg-c2-green/90 text-c2-bg font-bold transition-all disabled:opacity-50 shadow-green-glow"
              >
                {loading ? 'SYNCING...' : 'SAVE & CONNECT'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
