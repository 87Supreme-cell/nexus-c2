import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { GoogleCalendarEvent } from '@/types';
import { INITIAL_CALENDAR_EVENTS } from './goals-data';

const ACCOUNT_FILE = path.join(process.cwd(), 'data', 'google-account.json');
const CALENDAR_FILE = path.join(process.cwd(), 'data', 'google-calendar.json');

export interface GoogleAccountConfig {
  connected: boolean;
  email?: string;
  accountIndex: number; // 0 for u/0, 1 for u/1
  icalUrl?: string;
  lastSynced?: string;
  syncMethod: 'ical' | 'oauth' | 'manual';
  clientId?: string;
}

export function getAccountConfig(): GoogleAccountConfig {
  try {
    if (fs.existsSync(ACCOUNT_FILE)) {
      return JSON.parse(fs.readFileSync(ACCOUNT_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Error reading google-account.json:', err);
  }
  return {
    connected: false,
    accountIndex: 0,
    syncMethod: 'ical',
  };
}

export function saveAccountConfig(config: GoogleAccountConfig): void {
  try {
    const dir = path.dirname(ACCOUNT_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(ACCOUNT_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving google-account.json:', err);
  }
}

export function getCalendarEvents(): GoogleCalendarEvent[] {
  try {
    if (fs.existsSync(CALENDAR_FILE)) {
      return JSON.parse(fs.readFileSync(CALENDAR_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Error reading google-calendar.json:', err);
  }
  return INITIAL_CALENDAR_EVENTS;
}

export function saveCalendarEvents(events: GoogleCalendarEvent[]): void {
  try {
    const dir = path.dirname(CALENDAR_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CALENDAR_FILE, JSON.stringify(events, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving google-calendar.json:', err);
  }
}

function isSafeExternalUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'https:') return false;
    const hostname = parsed.hostname.toLowerCase();
    
    // Disallow loopback, private ranges, metadata IPs
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '169.254.169.254' ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.local')
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function fetchUrl(urlStr: string, redirects = 0): Promise<string> {
  if (redirects > 3) return Promise.reject(new Error('Too many redirects'));
  if (!isSafeExternalUrl(urlStr)) return Promise.reject(new Error('SSRF Blocked: Destination address is prohibited'));

  return new Promise((resolve, reject) => {
    const req = https.get(urlStr, { timeout: 6000 }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchUrl(res.headers.location, redirects + 1));
      }
      let data = '';
      let bytes = 0;
      const MAX_BYTES = 5 * 1024 * 1024; // 5 MB max

      res.on('data', (chunk) => {
        bytes += chunk.length;
        if (bytes > MAX_BYTES) {
          req.destroy();
          return reject(new Error('Payload exceeds maximum allowable threshold'));
        }
        data += chunk;
      });
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('iCal fetch timed out'));
    });
  });
}

function parseIcalDate(val: string): string {
  // Format: 20260924T140000Z or 20260924
  if (val.includes('T')) {
    const timePart = val.split('T')[1];
    const hour = timePart.substring(0, 2);
    const min = timePart.substring(2, 4);
    return `${hour}:${min}`;
  }
  return 'All Day';
}

export async function syncFromIcal(icalUrl: string): Promise<GoogleCalendarEvent[]> {
  const rawIcal = await fetchUrl(icalUrl);
  const events: GoogleCalendarEvent[] = [];

  const vevents = rawIcal.split('BEGIN:VEVENT');
  for (let i = 1; i < vevents.length; i++) {
    const block = vevents[i].split('END:VEVENT')[0];
    
    const summaryMatch = block.match(/SUMMARY:(.*?)(\r\n|\n)/);
    const dtstartMatch = block.match(/DTSTART.*?:(.*?)(\r\n|\n)/);
    const dtendMatch = block.match(/DTEND.*?:(.*?)(\r\n|\n)/);
    const statusMatch = block.match(/STATUS:(.*?)(\r\n|\n)/);

    const title = summaryMatch ? summaryMatch[1].trim() : 'Scheduled Event';
    const startTime = dtstartMatch ? parseIcalDate(dtstartMatch[1].trim()) : '12:00';
    const endTime = dtendMatch ? parseIcalDate(dtendMatch[1].trim()) : '13:00';
    const status = statusMatch && statusMatch[1].toLowerCase().includes('tent') ? 'tentative' : 'confirmed';

    events.push({
      id: `ical-${i}-${Date.now()}`,
      title,
      startTime,
      endTime,
      status,
      link: 'https://calendar.google.com/',
    });

    if (events.length >= 15) break; // Keep top 15 upcoming
  }

  if (events.length > 0) {
    saveCalendarEvents(events);
  }

  return events.length > 0 ? events : getCalendarEvents();
}
