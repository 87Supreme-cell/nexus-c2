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

function getDirSize(dirPath: string): number {
  let size = 0;
  try {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const full = path.join(dirPath, file);
      try {
        const stat = fs.statSync(full);
        if (stat.isFile()) {
          size += stat.size;
        } else if (stat.isDirectory() && !file.startsWith('.')) {
          size += getDirSize(full);
        }
      } catch {}
    }
  } catch {}
  return size;
}

export async function scanAllLocalModels(): Promise<LocalModelInfo[]> {
  const modelsMap = new Map<string, LocalModelInfo>();
  const homeDir = os.homedir();

  // 1. Ollama API Tags Handshake
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
      modelsMap.set(m.name, {
        name: m.name,
        size: m.size ? formatBytes(m.size) : 'Unknown',
        modified_at: m.modified_at,
        source: 'ollama',
        format: 'GGUF / Ollama',
      });
    }
  } catch {}

  // 2. Ollama Manifests on Disk (In case daemon isn't running or has extra manifests)
  const ollamaManifestDir = path.join(homeDir, '.ollama', 'models', 'manifests');
  if (fs.existsSync(ollamaManifestDir)) {
    try {
      const walkOllama = (dir: string) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            walkOllama(fullPath);
          } else if (entry.isFile()) {
            const rel = path.relative(ollamaManifestDir, fullPath);
            // Example: registry.ollama.ai/library/deepseek-r1/8b
            const parts = rel.split(path.sep);
            if (parts.length >= 3) {
              const modelName = `${parts[parts.length - 2]}:${parts[parts.length - 1]}`;
              if (!modelsMap.has(modelName) && !modelsMap.has(`${parts[parts.length - 2]}`)) {
                try {
                  const stat = fs.statSync(fullPath);
                  modelsMap.set(modelName, {
                    name: modelName,
                    size: 'Manifest verified',
                    modified_at: stat.mtime.toISOString(),
                    source: 'ollama',
                    format: 'Ollama Layer',
                    path: fullPath,
                  });
                } catch {}
              }
            }
          }
        }
      };
      walkOllama(ollamaManifestDir);
    } catch {}
  }

  // 3. Apple MLX Standalone Models in User Workspace
  const mlxStandaloneDirs = ['bonsai2-27b-mlx'];
  for (const dirName of mlxStandaloneDirs) {
    const fullPath = path.join(homeDir, dirName);
    if (fs.existsSync(fullPath)) {
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          const totalSize = getDirSize(fullPath);
          modelsMap.set(dirName, {
            name: `MLX: ${dirName}`,
            size: formatBytes(totalSize),
            modified_at: stat.mtime.toISOString(),
            source: 'mlx',
            format: 'Apple MLX (Safetensors)',
            path: fullPath,
          });
        }
      } catch {}
    }
  }

  // 4. LM Studio Models Cache (~/.lmstudio/models)
  const lmStudioDir = path.join(homeDir, '.lmstudio', 'models');
  if (fs.existsSync(lmStudioDir)) {
    try {
      const publishers = fs.readdirSync(lmStudioDir, { withFileTypes: true });
      for (const pub of publishers) {
        if (pub.isDirectory() && !pub.name.startsWith('.')) {
          const pubPath = path.join(lmStudioDir, pub.name);
          const modelDirs = fs.readdirSync(pubPath, { withFileTypes: true });
          for (const mDir of modelDirs) {
            if (mDir.isDirectory()) {
              const modelPath = path.join(pubPath, mDir.name);
              const stat = fs.statSync(modelPath);
              const totalSize = getDirSize(modelPath);
              const displayName = `${pub.name}/${mDir.name}`;
              modelsMap.set(displayName, {
                name: `LM-Studio: ${displayName}`,
                size: formatBytes(totalSize),
                modified_at: stat.mtime.toISOString(),
                source: 'lmstudio',
                format: mDir.name.includes('MLX') ? 'MLX 4-bit' : 'GGUF',
                path: modelPath,
              });
            }
          }
        }
      }
    } catch {}
  }

  // 5. Hugging Face Hub Cache (~/.cache/huggingface/hub)
  const hfHubDir = path.join(homeDir, '.cache', 'huggingface', 'hub');
  if (fs.existsSync(hfHubDir)) {
    try {
      const entries = fs.readdirSync(hfHubDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name.startsWith('models--')) {
          const rawName = entry.name.replace(/^models--/, '').replace(/--/, '/');
          const fullPath = path.join(hfHubDir, entry.name);
          const stat = fs.statSync(fullPath);
          const totalSize = getDirSize(fullPath);
          modelsMap.set(rawName, {
            name: `HF: ${rawName}`,
            size: formatBytes(totalSize),
            modified_at: stat.mtime.toISOString(),
            source: 'huggingface',
            format: rawName.toLowerCase().includes('mlx') ? 'Apple MLX' : 'GGUF / PyTorch',
            path: fullPath,
          });
        }
      }
    } catch {}
  }

  return Array.from(modelsMap.values());
}
