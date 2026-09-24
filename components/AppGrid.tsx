'use client';

import React, { useState } from 'react';
import { AppItem, AppCategory } from '@/types';
import { AppCard } from './AppCard';
import { 
  Search, 
  Plus, 
  RotateCw, 
  Bot, 
  Sparkles, 
  Boxes, 
  Terminal, 
  Grid 
} from 'lucide-react';

interface AppGridProps {
  apps: AppItem[];
  onRefresh: () => void;
  onOpenAddModal: () => void;
  isLoading: boolean;
}

const CATEGORIES: { label: string; value: AppCategory; icon: React.ElementType }[] = [
  { label: 'ALL RUNTIMES', value: 'all', icon: Grid },
  { label: 'AI & COGNITIVE', value: 'ai-models', icon: Bot },
  { label: 'GOOGLE WORKSPACE', value: 'google-workspace', icon: Sparkles },
  { label: 'LOCAL DEV', value: 'local-dev', icon: Terminal },
  { label: 'DOCKER CLUSTER', value: 'docker', icon: Boxes },
];

export const AppGrid: React.FC<AppGridProps> = ({
  apps,
  onRefresh,
  onOpenAddModal,
  isLoading,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<AppCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredApps = apps.filter((app) => {
    const matchesCategory = selectedCategory === 'all' || app.category === selectedCategory;
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.port && app.port.toString().includes(searchQuery));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-4 mb-8">
      {/* Top Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-xl bg-c2-surface border border-c2-border">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-c2-cyan/20 border border-c2-cyan text-c2-cyan font-bold shadow-cyan-glow'
                    : 'text-c2-textMuted hover:text-white hover:bg-c2-surfaceHover border border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Search & Controls */}
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 md:w-56">
            <Search className="w-3.5 h-3.5 text-c2-textMuted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search apps or ports..."
              className="w-full bg-c2-bg border border-c2-border rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono text-white placeholder-c2-textMuted focus:outline-none focus:border-c2-cyan"
            />
          </div>

          {/* Refresh Ping */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-c2-bg hover:bg-c2-surfaceHover border border-c2-border text-c2-textMuted hover:text-c2-cyan transition-all disabled:opacity-50"
            title="Refresh app statuses and port pings"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-c2-cyan' : ''}`} />
          </button>

          {/* Add App Button */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-c2-cyan/10 hover:bg-c2-cyan/20 border border-c2-cyan/40 text-c2-cyan text-xs font-mono font-bold transition-all shadow-cyan-glow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ADD APP</span>
          </button>
        </div>
      </div>

      {/* Grid of Cards */}
      {filteredApps.length === 0 ? (
        <div className="text-center py-12 rounded-xl bg-c2-card border border-c2-border">
          <p className="text-sm font-mono text-c2-textMuted">No applications match query &quot;{searchQuery}&quot;</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredApps.map((app) => (
            <AppCard key={app.id} app={app} onRefresh={onRefresh} />
          ))}
        </div>
      )}
    </div>
  );
};
