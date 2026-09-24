import { execFile } from 'child_process';
import { promisify } from 'util';
import { GoogleCalendarEvent } from '@/types';

const execFileAsync = promisify(execFile);

export interface ExtendedCalendarEvent extends GoogleCalendarEvent {
  calendarName?: string;
  accountEmail?: string;
  accountSlot?: number;
  rawStart?: string;
  rawEnd?: string;
  timestamp?: number;
}

/**
 * Fetches real live calendar events from macOS Calendar app (which syncs eighty7supreme@gmail.com).
 */
export async function fetchLiveCalendarEvents(): Promise<ExtendedCalendarEvent[]> {
  const script = `
tell application "Calendar"
    set calList to (calendars whose name is "eighty7supreme@gmail.com")
    if (count of calList) is 0 then
        return ""
    end if
    set targetCal to item 1 of calList
    tell targetCal
        set sList to summary of every event
        set dList to start date of every event
        set eList to end date of every event
    end tell
end tell

set AppleScript's text item delimiters to "|||"
set sText to sList as text
set dText to ""
repeat with d in dList
    set dText to dText & (d as string) & "|||"
end repeat
set eText to ""
repeat with e in eList
    set eText to eText & (e as string) & "|||"
end repeat
return sText & "###" & dText & "###" & eText
`;

  try {
    const { stdout } = await execFileAsync('/usr/bin/osascript', ['-e', script], { timeout: 15000 });
    const raw = stdout.trim();
    if (!raw || !raw.includes('###')) return [];

    const [summariesPart, startsPart, endsPart] = raw.split('###');
    const summaries = summariesPart ? summariesPart.split('|||') : [];
    const starts = startsPart ? startsPart.split('|||') : [];
    const ends = endsPart ? endsPart.split('|||') : [];

    const events: ExtendedCalendarEvent[] = [];
    const accountEmail = 'eighty7supreme@gmail.com';
    const accountSlot = 0;

    for (let i = 0; i < summaries.length; i++) {
      const summary = summaries[i]?.trim();
      if (!summary) continue;

      const startStr = starts[i] || '';
      const endStr = ends[i] || '';

      let dateObj: Date | null = null;
      let startTime = startStr;
      let endTime = endStr;

      try {
        const cleanStart = startStr.replace(' at ', ' ').replace(/[\s\u202f]+/g, ' ');
        dateObj = new Date(cleanStart);
        if (!isNaN(dateObj.getTime())) {
          startTime = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
                      dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        }
        const cleanEnd = endStr.replace(' at ', ' ').replace(/[\s\u202f]+/g, ' ');
        const endObj = new Date(cleanEnd);
        if (!isNaN(endObj.getTime())) {
          endTime = endObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        }
      } catch {}

      events.push({
        id: `cal-live-${i}-${dateObj ? dateObj.getTime() : i}`,
        title: summary,
        startTime,
        endTime,
        status: 'confirmed',
        link: `https://calendar.google.com/calendar/u/${accountSlot}/r`,
        calendarName: 'eighty7supreme@gmail.com',
        accountEmail,
        accountSlot,
        rawStart: startStr,
        rawEnd: endStr,
        timestamp: dateObj ? dateObj.getTime() : 0,
      });
    }

    const nowMs = Date.now();
    return events.sort((a, b) => {
      const aTime = a.timestamp || 0;
      const bTime = b.timestamp || 0;
      const aFuture = aTime >= nowMs;
      const bFuture = bTime >= nowMs;
      if (aFuture && !bFuture) return -1;
      if (!aFuture && bFuture) return 1;
      if (aFuture && bFuture) return aTime - bTime;
      return bTime - aTime;
    });
  } catch (err: any) {
    console.error('Failed fetching live macOS calendar events:', err.message);
    return [];
  }
}

/**
 * Creates a real event in Calendar.app under eighty7supreme@gmail.com.
 */
export async function createLiveCalendarEvent(
  title: string,
  startTimeStr: string,
  daysOffset = 0
): Promise<boolean> {
  const [hourStr, minStr] = startTimeStr.split(':');
  const targetHour = parseInt(hourStr || '10', 10);
  const targetMin = parseInt(minStr || '0', 10);

  const escapedTitle = title.replace(/"/g, '\\"');

  const script = `
tell application "Calendar"
    set calList to (calendars whose name is "eighty7supreme@gmail.com")
    if (count of calList) > 0 then
        set targetCal to item 1 of calList
        tell targetCal
            set sDate to (current date) + (${daysOffset} * days)
            set hours of sDate to ${targetHour}
            set minutes of sDate to ${targetMin}
            set seconds of sDate to 0
            set eDate to sDate + 3600
            make new event with properties {summary:"${escapedTitle}", start date:sDate, end date:eDate}
            return "ok"
        end tell
    else
        return "calendar_not_found"
    end if
end tell
`;

  try {
    const { stdout } = await execFileAsync('/usr/bin/osascript', ['-e', script], { timeout: 10000 });
    return stdout.trim().includes('ok');
  } catch (err: any) {
    console.error('Failed creating live calendar event:', err.message);
    return false;
  }
}

/**
 * Deletes an event by summary pattern from eighty7supreme@gmail.com.
 */
export async function deleteLiveCalendarEvent(titlePattern: string): Promise<boolean> {
  const escapedPattern = titlePattern.replace(/"/g, '\\"');
  const script = `
tell application "Calendar"
    set calList to (calendars whose name is "eighty7supreme@gmail.com")
    if (count of calList) > 0 then
        set targetCal to item 1 of calList
        tell targetCal
            delete (every event whose summary contains "${escapedPattern}")
            return "ok"
        end tell
    else
        return "calendar_not_found"
    end if
end tell
`;

  try {
    const { stdout } = await execFileAsync('/usr/bin/osascript', ['-e', script], { timeout: 10000 });
    return stdout.trim().includes('ok');
  } catch (err: any) {
    console.error('Failed deleting live calendar event:', err.message);
    return false;
  }
}
