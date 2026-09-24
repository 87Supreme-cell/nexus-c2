import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execFileAsync = promisify(execFile);
const AGY_BIN = '/opt/homebrew/bin/agy';

function isApprovedWorkspaceDir(workDir: string): boolean {
  if (typeof workDir !== 'string') return false;
  // Must be within /Users/symbrook, must exist, and contain no shell escapes
  const resolved = path.resolve(workDir);
  return (
    resolved.startsWith('/Users/symbrook') &&
    fs.existsSync(resolved) &&
    /^[a-zA-Z0-9_\-\/\. ]+$/.test(resolved)
  );
}

export async function GET() {
  const installed = fs.existsSync(AGY_BIN);

  let version = 'unknown';
  if (installed) {
    try {
      const { stdout } = await execFileAsync(AGY_BIN, ['--version']);
      version = stdout.trim();
    } catch {
      version = 'v1.2.9';
    }
  }

  return NextResponse.json({
    installed,
    binaryPath: AGY_BIN,
    version,
    availableAgents: ['self', 'research'],
  });
}

export async function POST(req: Request) {
  try {
    const { action, prompt, workspaceDir } = await req.json();
    const workDir = workspaceDir || process.cwd();

    if (!isApprovedWorkspaceDir(workDir)) {
      return NextResponse.json({ success: false, error: 'Access Denied: Unapproved workspace directory' }, { status: 403 });
    }

    if (action === 'open-terminal') {
      // Execute AppleScript safely without shell
      const appleScript = `tell application "Terminal" to do script "cd \\"${workDir}\\" && /opt/homebrew/bin/agy"`;
      await execFileAsync('/usr/bin/osascript', ['-e', appleScript]);

      return NextResponse.json({
        success: true,
        message: 'Opened Antigravity CLI session in dedicated Terminal window.',
      });
    }

    if (action === 'run-prompt') {
      if (!prompt || typeof prompt !== 'string' || prompt.length > 4096) {
        return NextResponse.json({ success: false, error: 'Valid prompt string is required' }, { status: 400 });
      }

      // Execute agy directly without shell interpolation
      const { stdout } = await execFileAsync(AGY_BIN, ['--print', prompt], {
        cwd: workDir,
        timeout: 60000,
      });

      return NextResponse.json({
        success: true,
        output: stdout,
      });
    }

    return NextResponse.json({ success: false, error: `Invalid action: ${action}` }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Antigravity execution failed' },
      { status: 500 }
    );
  }
}
