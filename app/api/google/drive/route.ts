import { NextResponse } from 'next/server';
import { 
  listGoogleDriveDocuments, 
  revealFileInFinder, 
  openFileDirect, 
  getGoogleDrivePath 
} from '@/lib/google-drive-bridge';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const subFolder = searchParams.get('folder') || '';

    const rootPath = getGoogleDrivePath();
    const files = await listGoogleDriveDocuments(subFolder);

    return NextResponse.json({
      connected: Boolean(rootPath),
      drivePath: rootPath,
      accountEmail: 'josh@symbrook.com',
      accountSlot: 1,
      totalCount: files.length,
      files,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, path: targetPath } = body;

    if (!targetPath) {
      return NextResponse.json({ error: 'path is required' }, { status: 400 });
    }

    if (action === 'reveal') {
      const ok = await revealFileInFinder(targetPath);
      return NextResponse.json({ success: ok, message: ok ? 'Revealed in Finder' : 'File not found' });
    }

    if (action === 'open') {
      const ok = await openFileDirect(targetPath);
      return NextResponse.json({ success: ok, message: ok ? 'Opened file' : 'File not found' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
