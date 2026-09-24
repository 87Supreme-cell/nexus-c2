import { NextResponse } from 'next/server';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execAsync = promisify(exec);

// In-memory process registry for active spawned services
const runningProcesses = new Map<string, number>();

export async function POST(req: Request) {
  try {
    const { action, appId, macAppPath, url, runCommand, port } = await req.json();

    if (action === 'launch') {
      // 1. If native macOS .app exists, open it directly!
      if (macAppPath && fs.existsSync(macAppPath)) {
        await execAsync(`open "${macAppPath}"`);
        return NextResponse.json({ success: true, message: `Opened native app: ${macAppPath}` });
      }

      // 2. Otherwise open the URL in default browser
      if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        await execAsync(`open "${url}"`);
        return NextResponse.json({ success: true, message: `Opened URL: ${url}` });
      }

      return NextResponse.json({ success: false, error: 'No valid URL or app path to launch' }, { status: 400 });
    }

    if (action === 'run') {
      if (!runCommand) {
        return NextResponse.json({ success: false, error: 'No runCommand defined for this application' }, { status: 400 });
      }

      // Spawn process detached
      const child = spawn(runCommand, {
        shell: true,
        detached: true,
        stdio: 'ignore',
      });

      child.unref();

      if (child.pid) {
        runningProcesses.set(appId, child.pid);
      }

      return NextResponse.json({
        success: true,
        message: `Command executed: ${runCommand}`,
        pid: child.pid,
      });
    }

    if (action === 'stop') {
      // If port is specified, find and terminate process on that port
      if (port) {
        try {
          await execAsync(`lsof -ti tcp:${port} | xargs kill -9`);
          return NextResponse.json({ success: true, message: `Terminated process listening on port ${port}` });
        } catch {
          // No process on port
        }
      }

      // If pid tracked
      const pid = runningProcesses.get(appId);
      if (pid) {
        try {
          process.kill(pid, 'SIGTERM');
          runningProcesses.delete(appId);
          return NextResponse.json({ success: true, message: `Stopped process ${pid}` });
        } catch {
          runningProcesses.delete(appId);
        }
      }

      return NextResponse.json({ success: true, message: `Stopped requested service` });
    }

    return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Action execution failed' },
      { status: 500 }
    );
  }
}
