import { NextResponse } from 'next/server';
import { 
  getAccountConfig, 
  saveAccountConfig, 
  getCalendarEvents, 
  saveCalendarEvents, 
  syncFromIcal 
} from '@/lib/google-calendar-service';
import { INITIAL_GOOGLE_TASKS, INITIAL_GMAIL_ALERTS } from '@/lib/goals-data';
import { GoogleCalendarEvent } from '@/types';

export async function GET() {
  const account = getAccountConfig();
  const events = getCalendarEvents();

  return NextResponse.json({
    account,
    events,
    tasks: INITIAL_GOOGLE_TASKS,
    alerts: INITIAL_GMAIL_ALERTS,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'connect-account') {
      const config = {
        connected: true,
        email: body.email || 'user@gmail.com',
        accountIndex: typeof body.accountIndex === 'number' ? body.accountIndex : 0,
        syncMethod: body.syncMethod || 'ical',
        icalUrl: body.icalUrl || '',
        lastSynced: new Date().toISOString(),
        clientId: body.clientId || '',
      };

      saveAccountConfig(config);

      // If iCal URL provided, immediately attempt sync
      let syncedEvents: GoogleCalendarEvent[] = [];
      if (body.icalUrl) {
        try {
          syncedEvents = await syncFromIcal(body.icalUrl);
        } catch (err: any) {
          console.error('iCal sync failed during connect:', err);
        }
      }

      return NextResponse.json({
        success: true,
        account: config,
        events: syncedEvents.length > 0 ? syncedEvents : getCalendarEvents(),
      });
    }

    if (action === 'sync-ical') {
      const { icalUrl } = body;
      if (!icalUrl) {
        return NextResponse.json({ success: false, error: 'iCal URL is required' }, { status: 400 });
      }

      const events = await syncFromIcal(icalUrl);
      const currentConfig = getAccountConfig();
      currentConfig.lastSynced = new Date().toISOString();
      currentConfig.icalUrl = icalUrl;
      currentConfig.connected = true;
      saveAccountConfig(currentConfig);

      return NextResponse.json({
        success: true,
        events,
        lastSynced: currentConfig.lastSynced,
      });
    }

    if (action === 'disconnect') {
      saveAccountConfig({
        connected: false,
        accountIndex: 0,
        syncMethod: 'ical',
      });
      return NextResponse.json({ success: true, message: 'Disconnected Google account' });
    }

    if (action === 'add-event') {
      const events = getCalendarEvents();
      const newEvent: GoogleCalendarEvent = {
        id: `ev-${Date.now()}`,
        title: body.item.title,
        startTime: body.item.startTime || '12:00',
        endTime: body.item.endTime || '13:00',
        status: 'confirmed',
        link: 'https://calendar.google.com/',
      };
      const updated = [newEvent, ...events];
      saveCalendarEvents(updated);
      return NextResponse.json({ success: true, event: newEvent, events: updated });
    }

    if (action === 'delete-event') {
      const events = getCalendarEvents();
      const updated = events.filter((e) => e.id !== body.eventId);
      saveCalendarEvents(updated);
      return NextResponse.json({ success: true, events: updated });
    }

    if (action === 'add-task') {
      const newTask = {
        id: `t-${Date.now()}`,
        title: body.item.title,
        due: body.item.due || 'Upcoming',
        completed: false,
      };
      return NextResponse.json({ success: true, task: newTask });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
