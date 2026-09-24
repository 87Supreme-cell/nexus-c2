import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface DriveDocumentItem {
  id: string;
  name: string;
  fullPath: string;
  relativePath: string;
  isDirectory: boolean;
  sizeBytes: number;
  sizeFormatted: string;
  modified: string;
  ext: string;
  category: 'document' | 'spreadsheet' | 'presentation' | 'pdf' | 'folder' | 'code' | 'other';
  webUrl: string;
  accountEmail: string;
  accountSlot: number;
}

const DEFAULT_DRIVE_PATH = path.join(
  process.env.HOME || '',
  'Library/CloudStorage/GoogleDrive-josh@symbrook.com/My Drive'
);

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function categorizeFile(ext: string, isDir: boolean): DriveDocumentItem['category'] {
  if (isDir) return 'folder';
  const clean = ext.toLowerCase().replace('.', '');
  if (['gdoc', 'docx', 'doc', 'txt', 'md', 'rtf'].includes(clean)) return 'document';
  if (['gsheet', 'xlsx', 'xls', 'csv'].includes(clean)) return 'spreadsheet';
  if (['gslides', 'pptx', 'ppt', 'key'].includes(clean)) return 'presentation';
  if (['pdf'].includes(clean)) return 'pdf';
  if (['ts', 'tsx', 'js', 'py', 'json', 'sh', 'html', 'css'].includes(clean)) return 'code';
  return 'other';
}

export function getGoogleDrivePath(): string | null {
  if (fs.existsSync(DEFAULT_DRIVE_PATH)) {
    return DEFAULT_DRIVE_PATH;
  }
  // Fallback search in CloudStorage
  const cloudStorage = path.join(process.env.HOME || '', 'Library/CloudStorage');
  if (fs.existsSync(cloudStorage)) {
    const dirs = fs.readdirSync(cloudStorage);
    const driveDir = dirs.find((d) => d.startsWith('GoogleDrive-'));
    if (driveDir) {
      const myDrive = path.join(cloudStorage, driveDir, 'My Drive');
      if (fs.existsSync(myDrive)) return myDrive;
      return path.join(cloudStorage, driveDir);
    }
  }
  return null;
}

export async function listGoogleDriveDocuments(subFolder = ''): Promise<DriveDocumentItem[]> {
  const rootDrive = getGoogleDrivePath();
  if (!rootDrive) return [];

  const targetDir = subFolder ? path.join(rootDrive, subFolder) : rootDrive;
  if (!fs.existsSync(targetDir)) return [];

  try {
    const dirEntries = fs.readdirSync(targetDir, { withFileTypes: true });

    const items: DriveDocumentItem[] = [];
    for (const entry of dirEntries) {
      if (entry.name.startsWith('.')) continue; // skip hidden

      const fullPath = path.join(targetDir, entry.name);
      const isDir = entry.isDirectory();
      let sizeBytes = 0;
      let modified = new Date().toISOString();

      try {
        const stats = fs.statSync(fullPath);
        sizeBytes = stats.size;
        modified = stats.mtime.toISOString();
      } catch {}

      const ext = path.extname(entry.name);
      const category = categorizeFile(ext, isDir);

      items.push({
        id: `drive-${Buffer.from(fullPath).toString('base64').replace(/=/g, '')}`,
        name: entry.name,
        fullPath,
        relativePath: path.relative(rootDrive, fullPath),
        isDirectory: isDir,
        sizeBytes,
        sizeFormatted: isDir ? 'Folder' : formatBytes(sizeBytes),
        modified,
        ext,
        category,
        webUrl: `https://drive.google.com/drive/u/1/my-drive`,
        accountEmail: 'josh@symbrook.com',
        accountSlot: 1,
      });
    }

    // Sort: Folders first, then recently modified
    return items.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return new Date(b.modified).getTime() - new Date(a.modified).getTime();
    });
  } catch (err: any) {
    console.error('Failed reading Google Drive documents:', err.message);
    return [];
  }
}

export async function revealFileInFinder(fullPath: string): Promise<boolean> {
  try {
    if (!fs.existsSync(fullPath)) return false;
    await execFileAsync('/usr/bin/open', ['-R', fullPath]);
    return true;
  } catch (err) {
    console.error('Failed revealing file in Finder:', err);
    return false;
  }
}

export async function openFileDirect(fullPath: string): Promise<boolean> {
  try {
    if (!fs.existsSync(fullPath)) return false;
    await execFileAsync('/usr/bin/open', [fullPath]);
    return true;
  } catch (err) {
    console.error('Failed opening file:', err);
    return false;
  }
}
