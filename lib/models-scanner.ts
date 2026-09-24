import fs from 'fs';
import path from 'path';
import os from 'os';
import http from 'http';
import { LocalModelInfo } from '@/types';

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export async function scanAllLocalModels(): Promise<LocalModelInfo[]> {
  const modelsMap = new Map<string, LocalModelInfo>();
  const homeDir = os.homedir();

  // 1. Ollama Active Models via API Tags
  try {
    const data = await new Promise<string>((resolve, reject) => {
      const req = http.get('http://127.0.0.1:11434/api/tags', { timeout: 1500 }, (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => resolve(body));
      });
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Timeout'));
      });
    });

    const parsed = JSON.parse(data);
    for (const m of parsed.models || []) {
      // Exclude embedding-only models or non-chat models
      const lower = m.name.toLowerCase();
      if (lower.includes('embed') || lower.includes('bge-') || lower.includes('nomic')) {
        continue;
      }

      let friendlyFormat = 'GGUF / Ollama';
      if (lower.includes('coder')) friendlyFormat = 'Code Specialized Weights';
      else if (lower.includes('r1')) friendlyFormat = 'Deep Reasoning Chain-of-Thought';
      else if (lower.includes('gemma')) friendlyFormat = 'Google Gemma Instruction Weights';

      modelsMap.set(m.name, {
        name: m.name,
        size: m.size ? formatBytes(m.size) : 'Unknown',
        modified_at: m.modified_at,
        source: 'ollama',
        format: friendlyFormat,
      });
    }
  } catch {}

  // 2. Verified Apple MLX Local Weights (if installed)
  const mlxDir = path.join(homeDir, 'bonsai2-27b-mlx');
  if (fs.existsSync(mlxDir)) {
    try {
      const stat = fs.statSync(mlxDir);
      if (stat.isDirectory()) {
        modelsMap.set('bonsai2-27b-mlx', {
          name: 'bonsai2-27b-mlx',
          size: '6.8 GB',
          modified_at: stat.mtime.toISOString(),
          source: 'mlx',
          format: 'Apple MLX Metal',
          path: mlxDir,
        });
      }
    } catch {}
  }

  return Array.from(modelsMap.values());
}
