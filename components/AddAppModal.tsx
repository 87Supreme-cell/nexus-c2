'use client';

import React, { useState } from 'react';
import { AppCategory, AppType } from '@/types';
import { X, Plus, Box, Bot, Terminal, Boxes, Sparkles } from 'lucide-react';

interface AddAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAppAdded: () => void;
}

export const AddAppModal: React.FC<AddAppModalProps> = ({
  isOpen,
  onClose,
  onAppAdded,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<AppCategory>('local-dev');
  const [type, setType] = useState<AppType>('local-service');
  const [url, setUrl] = useState('http://localhost:3000');
  const [port, setPort] = useState('3000');
  const [runCommand, setRunCommand] = useState('');
  const [icon, setIcon] = useState('Box');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          category,
          type,
          url: url.trim(),
          port: port ? parseInt(port, 10) : undefined,
          runCommand: runCommand.trim() || undefined,
          icon,
        }),
      });

      if (res.ok) {
        onAppAdded();
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed adding application');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-c2-surface border border-c2-cyan/40 shadow-2xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="p-4 bg-c2-bg border-b border-c2-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-c2-cyan" />
            <h3 className="font-mono font-bold text-sm text-white">REGISTER APPLICATION</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-c2-textMuted hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 font-mono text-xs">
          {error && (
            <div className="p-2.5 rounded bg-c2-red/10 border border-c2-red/30 text-c2-red">
              {error}
            </div>
          )}

          <div>
            <label className="block text-c2-textMuted mb-1">APP / SERVICE NAME</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My Next.js Tool / Custom Agent"
              className="w-full bg-c2-bg border border-c2-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-c2-cyan"
            />
          </div>

          <div>
            <label className="block text-c2-textMuted mb-1">DESCRIPTION</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Real-time telemetry visualizer"
              className="w-full bg-c2-bg border border-c2-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-c2-cyan"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-c2-textMuted mb-1">CATEGORY</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AppCategory)}
                className="w-full bg-c2-bg border border-c2-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-c2-cyan"
              >
                <option value="local-dev">Local Dev</option>
                <option value="ai-models">AI & Cognitive</option>
                <option value="google-workspace">Google Workspace</option>
                <option value="docker">Docker Cluster</option>
              </select>
            </div>

            <div>
              <label className="block text-c2-textMuted mb-1">TYPE</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AppType)}
                className="w-full bg-c2-bg border border-c2-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-c2-cyan"
              >
                <option value="local-service">Local Service</option>
                <option value="docker-container">Docker Container</option>
                <option value="chrome-app">Chrome / PWA</option>
                <option value="url">External URL</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-c2-textMuted mb-1">TARGET URL</label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="http://localhost:3000"
                className="w-full bg-c2-bg border border-c2-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-c2-cyan"
              />
            </div>

            <div>
              <label className="block text-c2-textMuted mb-1">PORT</label>
              <input
                type="text"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="3000"
                className="w-full bg-c2-bg border border-c2-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-c2-cyan"
              />
            </div>
          </div>

          <div>
            <label className="block text-c2-textMuted mb-1">RUN COMMAND (OPTIONAL)</label>
            <input
              type="text"
              value={runCommand}
              onChange={(e) => setRunCommand(e.target.value)}
              placeholder="e.g. bun dev / python3 main.py / docker compose up"
              className="w-full bg-c2-bg border border-c2-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-c2-cyan"
            />
          </div>

          <div className="pt-3 border-t border-c2-border flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-c2-bg hover:bg-c2-surfaceHover border border-c2-border text-c2-textMuted hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-c2-cyan hover:bg-c2-cyan/90 text-c2-bg font-bold transition-all disabled:opacity-50 shadow-cyan-glow"
            >
              {isSubmitting ? 'Registering...' : 'REGISTER APP'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
