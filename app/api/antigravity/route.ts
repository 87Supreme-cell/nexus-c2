import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execAsync = promisify(exec);

export async function GET() {
  const binaryPath = '/opt/homebrew/bin/agy';
  const installed = fs.existsSync(binaryPath);

  let version = 'unknown';
  if (installed) {
    try {
      const { stdout } = await execAsync(`${binaryPath} --version || echo "agy v2.0"`);
      version = stdout.trim();
    } catch {
      version = 'v2.0';
    }
  }

  return NextResponse.json({
    installed,
    binaryPath,
    version,
    availableAgents: ['self', 'research'],
  });
}

export async function POST(req: Request) {
  try {
    const { action, prompt, workspaceDir } = await req.json();
    const workDir = workspaceDir || process.cwd();

    if (action === 'open-terminal') {
      // macOS AppleScript to spawn a dedicated Terminal window with Antigravity
      const script = `osascript -e 'tell application "Terminal" to do script "cd \\"${workDir}\\" && /opt/homebrew/bin/agy"'`;
      await execAsync(script);

      return NextResponse.json({
        success: true,
        message: 'Opened Antigravity CLI session in dedicated Terminal window.',
      });
    }

    if (action === 'run-prompt') {
      if (!prompt) {
        return NextResponse.json({ success: false, error: 'Prompt is required' }, { status: 400 });
      }

      // Execute headless agy print command
      const sanitizedPrompt = prompt.replace(/"/g, '\\"');
      const { stdout } = await execAsync(
        `/opt/homebrew/bin/agy --print "${sanitizedPrompt}"`,
        { cwd: workDir, timeout: 60000 }
      );

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
