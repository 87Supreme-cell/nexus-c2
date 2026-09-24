import { NextResponse } from 'next/server';
import os from 'os';
import http from 'http';
import fs from 'fs';
import { SystemTelemetry } from '@/types';

function checkPortOpen(port: number, host = '127.0.0.1'): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://${host}:${port}`, { timeout: 800 }, () => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

export async function GET() {
  try {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const loadAvg = os.loadavg();

    // Check Ollama
    const ollamaRunning = await checkPortOpen(11434);

    // Check Docker socket
    const dockerSocketPath = '/var/run/docker.sock';
    const altDockerSocket = `${os.homedir()}/.docker/run/docker.sock`;
    const dockerRunning = fs.existsSync(dockerSocketPath) || fs.existsSync(altDockerSocket);

    // Check Antigravity CLI
    const antigravityPath = '/opt/homebrew/bin/agy';
    const antigravityDetected = fs.existsSync(antigravityPath);

    const telemetry: SystemTelemetry = {
      cpuLoad: Math.min(100, Math.round(loadAvg[0] * 12)),
      memoryUsedGB: parseFloat((usedMem / (1024 ** 3)).toFixed(1)),
      memoryTotalGB: parseFloat((totalMem / (1024 ** 3)).toFixed(1)),
      uptimeSeconds: Math.floor(os.uptime()),
      hostname: os.hostname(),
      airgapStatus: 'AIRGAP_STRICT',
      activeServicesCount: (ollamaRunning ? 1 : 0) + (dockerRunning ? 1 : 0) + 1,
      ollamaRunning,
      dockerRunning,
      antigravityDetected,
    };

    return NextResponse.json(telemetry);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed retrieving telemetry', details: error?.message },
      { status: 500 }
    );
  }
}
