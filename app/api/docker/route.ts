import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { DockerContainer } from '@/types';

const execFileAsync = promisify(execFile);
const DOCKER_BIN = '/usr/local/bin/docker';

function isValidContainerId(id: string): boolean {
  return typeof id === 'string' && /^[a-zA-Z0-9_\.\-]+$/.test(id) && id.length <= 128;
}

export async function GET() {
  try {
    const { stdout } = await execFileAsync(DOCKER_BIN, [
      'ps',
      '-a',
      '--format',
      '{"id":"{{.ID}}","name":"{{.Names}}","image":"{{.Image}}","status":"{{.Status}}","state":"{{.State}}","ports":"{{.Ports}}"}',
    ]);

    const lines = stdout.trim().split('\n').filter(Boolean);
    const containers: DockerContainer[] = lines
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    return NextResponse.json({
      dockerRunning: true,
      containers,
    });
  } catch (error: any) {
    return NextResponse.json({
      dockerRunning: false,
      containers: [],
      error: 'Docker daemon is not running or socket is unreachable.',
      remedy: 'Run: open -a Docker or start Docker Desktop.',
    });
  }
}

export async function POST(req: Request) {
  try {
    const { action, containerId } = await req.json();

    if (action === 'start-daemon') {
      await execFileAsync('/usr/bin/open', ['-a', 'Docker']);
      return NextResponse.json({ success: true, message: 'Initiated Docker Desktop startup.' });
    }

    if (!containerId || !isValidContainerId(containerId)) {
      return NextResponse.json({ success: false, error: 'Invalid container identifier' }, { status: 400 });
    }

    if (action === 'start') {
      await execFileAsync(DOCKER_BIN, ['start', containerId]);
      return NextResponse.json({ success: true, message: `Started container ${containerId}` });
    }

    if (action === 'stop') {
      await execFileAsync(DOCKER_BIN, ['stop', containerId]);
      return NextResponse.json({ success: true, message: `Stopped container ${containerId}` });
    }

    if (action === 'restart') {
      await execFileAsync(DOCKER_BIN, ['restart', containerId]);
      return NextResponse.json({ success: true, message: `Restarted container ${containerId}` });
    }

    return NextResponse.json({ success: false, error: `Invalid action: ${action}` }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Docker action failed' },
      { status: 500 }
    );
  }
}
