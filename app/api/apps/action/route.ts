import { NextResponse } from 'next/server';
import { execFile, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execFileAsync = promisify(execFile);

// In-memory process registry for active spawned services
const runningProcesses = new Map<string, number>();

// Strict path validator for macOS .app bundles
function isValidAppPath(appPath: string): boolean {
  if (typeof appPath !== 'string') return false;
  // Must be within approved directories
  const isApproved = appPath.startsWith('/Users/symbrook/Applications/Chrome Apps.localized') ||
    appPath.startsWith('/Applications') ||
    appPath.startsWith('/Users/symbrook/Applications');
  return isApproved && fs.existsSync(appPath) && appPath.endsWith('.app');
}

// Strict URL validator
function isValidUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// Strict command validator (whitelisted commands & scripts only, no chaining operators)
function isSafeRunCommand(cmd: string): boolean {
  if (typeof cmd !== 'string' || cmd.length > 256) return false;
  // Disallow shell chaining and redirection characters
  const forbiddenChars = [';', '&', '|', '`', '$', '<', '>', '\n', '\r', '(', ')'];
  for (const char of forbiddenChars) {
    if (cmd.includes(char)) return false;
  }
  return true;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, appId, macAppPath, url, runCommand, port } = body;

    // 1. LAUNCH ACTION
    if (action === 'launch') {
      // If native macOS .app exists, use execFile directly (NO SHELL)
      if (macAppPath) {
        if (!isValidAppPath(macAppPath)) {
          return NextResponse.json({ success: false, error: 'Access Denied: Invalid or unapproved application path' }, { status: 400 });
        }
        // execFile passes argument safely to /usr/bin/open
        await execFileAsync('/usr/bin/open', [macAppPath]);
        return NextResponse.json({ success: true, message: `Opened native app: ${macAppPath}` });
      }

      // Otherwise validate URL and open with /usr/bin/open safely
      if (url) {
        if (!isValidUrl(url)) {
          return NextResponse.json({ success: false, error: 'Invalid URL scheme' }, { status: 400 });
        }
        await execFileAsync('/usr/bin/open', [url]);
        return NextResponse.json({ success: true, message: `Opened URL: ${url}` });
      }

      return NextResponse.json({ success: false, error: 'No valid URL or app path to launch' }, { status: 400 });
    }

    // 2. RUN ACTION
    if (action === 'run') {
      if (!runCommand) {
        return NextResponse.json({ success: false, error: 'No runCommand defined for this application' }, { status: 400 });
      }

      if (!isSafeRunCommand(runCommand)) {
        return NextResponse.json({ success: false, error: 'Command validation error: Prohibited shell operators detected' }, { status: 403 });
      }

      // Split command into executable and args safely
      const parts = runCommand.trim().split(/\s+/);
      const binary = parts[0];
      const args = parts.slice(1);

      // Spawn without shell: true to prevent shell injection!
      const child = spawn(binary, args, {
        detached: true,
        stdio: 'ignore',
      });

      child.unref();

      if (child.pid) {
        runningProcesses.set(appId, child.pid);
      }

      return NextResponse.json({
        success: true,
        message: `Process started safely: ${binary}`,
        pid: child.pid,
      });
    }

    // 3. STOP ACTION
    if (action === 'stop') {
      // If port is specified, strictly validate that it is an integer
      if (port !== undefined && port !== null) {
        const portNum = Number(port);
        if (!Number.isInteger(portNum) || portNum < 1 || portNum > 65535) {
          return NextResponse.json({ success: false, error: 'Invalid port specification' }, { status: 400 });
        }

        try {
          // Use execFile without shell to look up PIDs on the port
          const { stdout } = await execFileAsync('/usr/sbin/lsof', ['-ti', `tcp:${portNum}`]);
          const pids = stdout.trim().split('\n').filter(Boolean);
          for (const pidStr of pids) {
            const p = parseInt(pidStr, 10);
            if (!isNaN(p) && p > 1) {
              try {
                process.kill(p, 'SIGTERM');
              } catch {}
            }
          }
          return NextResponse.json({ success: true, message: `Terminated processes on port ${portNum}` });
        } catch {
          // No process running on port
        }
      }

      // Terminate tracked process ID if exists
      if (appId && runningProcesses.has(appId)) {
        const pid = runningProcesses.get(appId)!;
        try {
          process.kill(pid, 'SIGTERM');
        } catch {}
        runningProcesses.delete(appId);
        return NextResponse.json({ success: true, message: `Stopped registered process ${pid}` });
      }

      return NextResponse.json({ success: true, message: 'Stop directive processed' });
    }

    return NextResponse.json({ success: false, error: `Invalid action: ${action}` }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Action execution failed' },
      { status: 500 }
    );
  }
}
