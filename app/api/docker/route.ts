import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { DockerContainer } from '@/types';

const execAsync = promisify(exec);

export async function GET() {
  try {
    // Attempt docker ps with JSON format
    const { stdout } = await execAsync('docker ps -a --format \'{"id":"{{.ID}}","name":"{{.Names}}","image":"{{.Image}}","status":"{{.Status}}","state":"{{.State}}","ports":"{{.Ports}}"}\'');
    
    const lines = stdout.trim().split('\n').filter(Boolean);
    const containers: DockerContainer[] = lines.map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter(Boolean);

    return NextResponse.json({
      dockerRunning: true,
      containers,
    });
  } catch (error: any) {
    // Docker is offline or socket not connected
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
      await execAsync('open -a Docker');
      return NextResponse.json({ success: true, message: 'Initiated Docker Desktop startup.' });
    }

    if (!containerId) {
      return NextResponse.json({ success: false, error: 'containerId is required' }, { status: 400 });
    }

    if (action === 'start') {
      await execAsync(`docker start ${containerId}`);
      return NextResponse.json({ success: true, message: `Started container ${containerId}` });
    }

    if (action === 'stop') {
      await execAsync(`docker stop ${containerId}`);
      return NextResponse.json({ success: true, message: `Stopped container ${containerId}` });
    }

    if (action === 'restart') {
      await execAsync(`docker restart ${containerId}`);
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
