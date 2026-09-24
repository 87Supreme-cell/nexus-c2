import { NextResponse } from 'next/server';
import { getStoredGoogleAuth, saveStoredGoogleAuth, getValidAccessToken } from '@/lib/google-auth-service';

export async function GET() {
  const auth = getStoredGoogleAuth();
  const token = await getValidAccessToken();

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://127.0.0.1:3030/api/auth/callback/google';

  let authUrl = null;
  if (clientId) {
    const scope = encodeURIComponent(
      'https://www.googleapis.com/auth/generative-language https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email'
    );
    authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
  }

  return NextResponse.json({
    connected: Boolean(token),
    email: auth?.email,
    authUrl,
    hasRefreshToken: Boolean(auth?.refreshToken),
    configuredClientId: Boolean(clientId),
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, accessToken, refreshToken, email } = body;

    if (action === 'save-token') {
      if (!accessToken && !refreshToken) {
        return NextResponse.json({ error: 'accessToken or refreshToken is required' }, { status: 400 });
      }

      const existing = getStoredGoogleAuth() || {};
      const updated = {
        ...existing,
        accessToken: accessToken || existing.accessToken,
        refreshToken: refreshToken || existing.refreshToken,
        email: email || existing.email || 'operator@google.com',
        expiresAt: Date.now() + 3600 * 1000,
      };

      saveStoredGoogleAuth(updated);
      return NextResponse.json({ success: true, message: 'Google OAuth token saved successfully', auth: updated });
    }

    if (action === 'disconnect') {
      saveStoredGoogleAuth({});
      return NextResponse.json({ success: true, message: 'Google OAuth disconnected' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
