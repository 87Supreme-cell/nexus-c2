import { NextResponse } from 'next/server';
import http from 'http';
import https from 'https';
import { getStoredApps, saveStoredApps } from '@/lib/apps-registry';
import { AppItem } from '@/types';

async function pingEndpoint(url: string, port?: number): Promise<{ status: 'online' | 'offline'; pingMs: number }> {
  const start = Date.now();
  if (port) {
    return new Promise((resolve) => {
      const req = http.get(`http://127.0.0.1:${port}`, { timeout: 1200 }, () => {
        resolve({ status: 'online', pingMs: Date.now() - start });
      });
      req.on('error', () => resolve({ status: 'offline', pingMs: 0 }));
      req.on('timeout', () => {
        req.destroy();
        resolve({ status: 'offline', pingMs: 0 });
      });
    });
  }

  // If public URL, do a quick HEAD request
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return new Promise((resolve) => {
      const client = url.startsWith('https://') ? https : http;
      try {
        const req = client.request(url, { method: 'HEAD', timeout: 1500 }, () => {
          resolve({ status: 'online', pingMs: Date.now() - start });
        });
        req.on('error', () => resolve({ status: 'offline', pingMs: 0 }));
        req.on('timeout', () => {
          req.destroy();
          resolve({ status: 'offline', pingMs: 0 });
        });
        req.end();
      } catch {
        resolve({ status: 'offline', pingMs: 0 });
      }
    });
  }

  return { status: 'online', pingMs: 1 };
}

export async function GET() {
  try {
    const apps = getStoredApps();

    // Check statuses in parallel with high resilience
    const pingedApps = await Promise.all(
      apps.map(async (app) => {
        if (app.port) {
          const res = await pingEndpoint(app.url, app.port);
          return {
            ...app,
            status: res.status,
            pingMs: res.pingMs,
          };
        }
        return app;
      })
    );

    return NextResponse.json(pingedApps);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed fetching apps', details: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const currentApps = getStoredApps();

    const newApp: AppItem = {
      id: body.id || `app-${Date.now()}`,
      name: body.name,
      description: body.description || '',
      category: body.category || 'local-dev',
      type: body.type || 'local-service',
      url: body.url || 'http://localhost',
      port: body.port ? parseInt(body.port, 10) : undefined,
      status: 'standby',
      icon: body.icon || 'Box',
      runCommand: body.runCommand,
      stopCommand: body.stopCommand,
      dockerContainerId: body.dockerContainerId,
    };

    const updated = [...currentApps, newApp];
    saveStoredApps(updated);

    return NextResponse.json(newApp, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed registering app', details: error?.message },
      { status: 400 }
    );
  }
}
