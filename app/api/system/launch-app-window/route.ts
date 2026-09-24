import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execFileAsync = promisify(execFile);

export async function POST() {
  try {
    const chromePath = '/Applications/Google Chrome.app';
    const appBundlePath = '/Users/symbrook/Applications/Chrome Apps.localized/Nexus Command Center.app';

    // Priority 1: Launch existing native Chrome App bundle if present
    if (fs.existsSync(appBundlePath)) {
      await execFileAsync('/usr/bin/open', [appBundlePath]);
      return NextResponse.json({
        success: true,
        message: 'Launched Nexus Command Center.app native bundle',
        mode: 'native-bundle',
      });
    }

    // Priority 2: Launch Google Chrome in standalone app mode
    if (fs.existsSync(chromePath)) {
      await execFileAsync('/usr/bin/open', [
        '-na',
        chromePath,
        '--args',
        '--app=http://localhost:3030',
      ]);
      return NextResponse.json({
        success: true,
        message: 'Launched Chrome dedicated standalone app window',
        mode: 'chrome-app-flag',
      });
    }

    // Fallback: Default browser
    await execFileAsync('/usr/bin/open', ['http://localhost:3030']);
    return NextResponse.json({
      success: true,
      message: 'Opened in default browser',
      mode: 'browser-tab',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
