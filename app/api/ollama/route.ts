import { NextResponse } from 'next/server';
import http from 'http';
import { scanAllLocalModels } from '@/lib/models-scanner';

function checkOllamaPort(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get('http://127.0.0.1:11434/api/tags', { timeout: 1000 }, () => resolve(true));
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

export async function GET() {
  try {
    const isOnline = await checkOllamaPort();
    const allModels = await scanAllLocalModels();

    return NextResponse.json({
      online: isOnline,
      totalCount: allModels.length,
      models: allModels,
    });
  } catch (error: any) {
    return NextResponse.json({
      online: false,
      totalCount: 0,
      models: [],
      error: error?.message || 'Failed scanning local models',
    });
  }
}
