import { NextResponse } from 'next/server';
import { INITIAL_CALENDAR_EVENTS, INITIAL_GOOGLE_TASKS, INITIAL_GMAIL_ALERTS } from '@/lib/goals-data';

export async function GET() {
  const isOAuthConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  return NextResponse.json({
    oauthConfigured: isOAuthConfigured,
    authScope: ['calendar.readonly', 'tasks', 'gmail.readonly'],
    events: INITIAL_CALENDAR_EVENTS,
    tasks: INITIAL_GOOGLE_TASKS,
    alerts: INITIAL_GMAIL_ALERTS,
  });
}

export async function POST(req: Request) {
  try {
    const { action, item } = await req.json();

    if (action === 'add-task') {
      const newTask = {
        id: `t-${Date.now()}`,
        title: item.title,
        due: item.due || 'Upcoming',
        completed: false,
      };
      return NextResponse.json({ success: true, task: newTask });
    }

    if (action === 'add-event') {
      const newEvent = {
        id: `ev-${Date.now()}`,
        title: item.title,
        startTime: item.startTime || '12:00',
        endTime: item.endTime || '13:00',
        status: 'confirmed',
        link: 'https://calendar.google.com/',
      };
      return NextResponse.json({ success: true, event: newEvent });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
