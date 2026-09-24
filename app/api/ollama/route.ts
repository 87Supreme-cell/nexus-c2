import { NextResponse } from 'next/server';
import http from 'http';
import { OllamaModel } from '@/types';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export async function GET() {
  try {
    const data = await new Promise<string>((resolve, reject) => {
      const req = http.get('http://127.0.0.1:11434/api/tags', { timeout: 3000 }, (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => resolve(body));
      });
      req.on('error', (err) => reject(err));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Timeout connecting to Ollama'));
      });
    });

    const parsed = JSON.parse(data);
    const models: OllamaModel[] = (parsed.models || []).map((m: any) => ({
      name: m.name,
      size: m.size ? formatBytes(m.size) : 'Unknown',
      modified_at: m.modified_at,
    }));

    return NextResponse.json({
      online: true,
      models,
    });
  } catch (error: any) {
    return NextResponse.json({
      online: false,
      models: [],
      error: 'Ollama service is unreachable at 127.0.0.1:11434',
    });
  }
}
