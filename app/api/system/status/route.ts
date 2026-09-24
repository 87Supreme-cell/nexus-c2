import { NextResponse } from 'next/server';
import { getSystemTelemetry } from '@/lib/system-telemetry';

export async function GET() {
  try {
    const telemetry = await getSystemTelemetry();
    return NextResponse.json(telemetry);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed retrieving telemetry', details: error?.message },
      { status: 500 }
    );
  }
}
