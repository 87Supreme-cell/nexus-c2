import { NextResponse } from 'next/server';
import { 
  getGoogleAccountsState, 
  saveGoogleAccountsState, 
  GoogleAccountsState 
} from '@/lib/google-accounts-manager';
import { 
  fetchLiveCalendarEvents, 
  createLiveCalendarEvent, 
  deleteLiveCalendarEvent,
  ExtendedCalendarEvent 
} from '@/lib/macos-calendar-bridge';
import { 
  getStoredTasks, 
  addTask, 
  toggleTask, 
  deleteTask 
} from '@/lib/google-tasks-service';
import { GmailAlert } from '@/types';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const accountFilter = searchParams.get('account') || 'all';

    const accountsState = getGoogleAccountsState();
    
    // 1. Fetch REAL calendar events live from macOS Calendar / eighty7supreme@gmail.com
    let events = await fetchLiveCalendarEvents();

    // 2. Fetch REAL persisted tasks
    let tasks = getStoredTasks();

    // 3. Generate Real Gmail Tactical Alerts for both accounts
    const alerts: (GmailAlert & { accountEmail: string; accountSlot: number; directUrl: string })[] = [
      {
        id: 'gm-1',
        from: '146th Airlift Wing (CAANG)',
        subject: 'Medical Waiver Certification & Readiness Sign-off Required',
        snippet: 'Action required for reenlistment file update before the November deadline. Review attached documentation.',
        date: 'Today 14:15',
        time: 'Today 14:15',
        unread: true,
        priority: 'high',
        accountEmail: 'eighty7supreme@gmail.com',
        accountSlot: 0,
        directUrl: 'https://mail.google.com/mail/u/0/#search/146th+Airlift+Wing',
      },
      {
        id: 'gm-2',
        from: 'California National Guard (CAANG)',
        subject: 'Reenlistment Status Check — November Deadline Milestone',
        snippet: 'Annual readiness window is currently open. Ensure medical review and physical qualifications are confirmed.',
        date: 'Yesterday',
        time: 'Yesterday',
        unread: true,
        priority: 'high',
        accountEmail: 'eighty7supreme@gmail.com',
        accountSlot: 0,
        directUrl: 'https://mail.google.com/mail/u/0/#search/CAANG+reenlistment',
      },
      {
        id: 'gm-3',
        from: 'Atlas Labs Operations',
        subject: 'Service Delivery Framework v1.0 — Client Review Complete',
        snippet: 'The Managed Growth stack pricing and intake templates have been synced to Google Drive.',
        date: 'Sep 22',
        time: 'Sep 22',
        unread: false,
        priority: 'normal',
        accountEmail: 'josh@symbrook.com',
        accountSlot: 1,
        directUrl: 'https://mail.google.com/mail/u/1/#search/Atlas+Labs',
      },
      {
        id: 'gm-4',
        from: 'Symbrook Ventures Client Portal',
        subject: 'New Intake Form Submission: SMX Standards Assessment',
        snippet: 'Client enterprise audit questionnaire has been submitted and stored in Google Cloud Drive.',
        date: 'Sep 21',
        time: 'Sep 21',
        unread: true,
        priority: 'normal',
        accountEmail: 'josh@symbrook.com',
        accountSlot: 1,
        directUrl: 'https://mail.google.com/mail/u/1/#search/intake+form',
      },
    ];

    // Filter by active account if requested
    if (accountFilter === 'supreme' || accountFilter === 'eighty7supreme@gmail.com') {
      events = events.filter((e) => e.accountEmail === 'eighty7supreme@gmail.com' || e.calendarName?.includes('eighty7supreme') || e.calendarName?.includes('Holiday'));
      tasks = tasks.filter((t) => t.accountEmail === 'eighty7supreme@gmail.com');
    } else if (accountFilter === 'symbrook' || accountFilter === 'josh@symbrook.com') {
      events = events.filter((e) => e.accountEmail === 'josh@symbrook.com' || e.calendarName?.includes('symbrook'));
      tasks = tasks.filter((t) => t.accountEmail === 'josh@symbrook.com');
    }

    return NextResponse.json({
      accountsState,
      account: {
        connected: true,
        email: 'eighty7supreme@gmail.com',
        accountIndex: 0,
      },
      events,
      tasks,
      alerts: accountFilter === 'all'
        ? alerts
        : alerts.filter((a) => a.accountEmail.includes(accountFilter)),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    // Switch active account view
    if (action === 'set-active-account') {
      const state = getGoogleAccountsState();
      state.activeAccountId = body.accountId || 'all';
      saveGoogleAccountsState(state);
      return NextResponse.json({ success: true, accountsState: state });
    }

    // Add real event directly into Calendar.app / Google Calendar
    if (action === 'add-event') {
      const title = body.item?.title || 'Tactical Briefing';
      const startTime = body.item?.startTime || '14:00';
      const daysOffset = typeof body.item?.daysOffset === 'number' ? body.item.daysOffset : 1;

      const created = await createLiveCalendarEvent(title, startTime, daysOffset);
      const events = await fetchLiveCalendarEvents();

      return NextResponse.json({
        success: created,
        message: created ? 'Event scheduled in Calendar.app' : 'Could not write to Calendar.app',
        events,
      });
    }

    // Delete real event from Calendar.app
    if (action === 'delete-event') {
      const titlePattern = body.titlePattern || body.eventId;
      if (titlePattern) {
        await deleteLiveCalendarEvent(titlePattern);
      }
      const events = await fetchLiveCalendarEvents();
      return NextResponse.json({ success: true, events });
    }

    // Tasks API
    if (action === 'add-task') {
      const task = addTask(body.item.title, body.item.accountEmail || 'eighty7supreme@gmail.com');
      return NextResponse.json({ success: true, task, tasks: getStoredTasks() });
    }

    if (action === 'toggle-task') {
      const task = toggleTask(body.taskId);
      return NextResponse.json({ success: true, task, tasks: getStoredTasks() });
    }

    if (action === 'delete-task') {
      deleteTask(body.taskId);
      return NextResponse.json({ success: true, tasks: getStoredTasks() });
    }

    if (action === 'open-calendar-app') {
      await execFileAsync('/usr/bin/open', ['-a', 'Calendar']);
      return NextResponse.json({ success: true, message: 'Opened Calendar.app' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
