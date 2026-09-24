import { NextResponse } from 'next/server';
import { 
  getStoredGoogleAuth, 
  saveStoredGoogleAuth, 
  getValidAccessToken, 
  getSystemKeychainGoogleAuthSync,
  GoogleAuthTokens 
} from '@/lib/google-auth-service';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export async function GET() {
  const auth = getStoredGoogleAuth();
  const token = await getValidAccessToken();
  const systemAuth = getSystemKeychainGoogleAuthSync();

  const clientId = process.env.GOOGLE_CLIENT_ID || '1071006060591-tmhssin2h21lcre235vtolojh4g403ep.apps.googleusercontent.com';
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://127.0.0.1:3030/api/auth/callback/google';

  const scope = encodeURIComponent(
    'https://www.googleapis.com/auth/generative-language https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email'
  );
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;

  const isConnected = Boolean(token) && !auth?.disconnected;

  return NextResponse.json({
    connected: isConnected,
    email: auth?.email || systemAuth?.email || null,
    authUrl,
    hasRefreshToken: Boolean(auth?.refreshToken || systemAuth?.refreshToken),
    systemDetected: Boolean(systemAuth?.accessToken),
    systemEmail: systemAuth?.email || null,
    authMethod: auth?.authMethod || (systemAuth ? 'system-keychain' : 'oauth2'),
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, accessToken, refreshToken, email } = body;

    // Action 1: 1-Click Connect with Detected System Google Session
    if (action === 'connect-system' || action === 'sign-in-system') {
      const systemAuth = getSystemKeychainGoogleAuthSync();
      if (!systemAuth || !systemAuth.accessToken) {
        return NextResponse.json({ error: 'No active Google session detected in system keychain' }, { status: 404 });
      }

      saveStoredGoogleAuth({
        ...systemAuth,
        disconnected: false,
      });

      return NextResponse.json({
        success: true,
        message: `Successfully connected Google Account: ${systemAuth.email}`,
        email: systemAuth.email,
        connected: true,
      });
    }

    // Action 2: Launch Google Sign-In in Default Browser
    if (action === 'launch-browser-login') {
      const clientId = process.env.GOOGLE_CLIENT_ID || '1071006060591-tmhssin2h21lcre235vtolojh4g403ep.apps.googleusercontent.com';
      const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://127.0.0.1:3030/api/auth/callback/google';
      const scope = encodeURIComponent(
        'https://www.googleapis.com/auth/generative-language https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email'
      );
      const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;

      try {
        await execFileAsync('/usr/bin/open', [url]);
        return NextResponse.json({ success: true, launched: true, url });
      } catch {
        return NextResponse.json({ success: true, launched: false, url });
      }
    }

    // Action 3: Save Manual Token
    if (action === 'save-token') {
      if (!accessToken && !refreshToken) {
        return NextResponse.json({ error: 'accessToken or refreshToken is required' }, { status: 400 });
      }

      const existing = getStoredGoogleAuth() || {};
      const updated: GoogleAuthTokens = {
        ...existing,
        accessToken: accessToken || existing.accessToken,
        refreshToken: refreshToken || existing.refreshToken,
        email: email || existing.email || 'operator@google.com',
        expiresAt: Date.now() + 3600 * 1000,
        disconnected: false,
        authMethod: 'manual-token',
      };

      saveStoredGoogleAuth(updated);
      return NextResponse.json({ success: true, message: 'Google OAuth token saved successfully', auth: updated });
    }

    // Action 4: Disconnect
    if (action === 'disconnect') {
      saveStoredGoogleAuth({ disconnected: true });
      return NextResponse.json({ success: true, message: 'Google OAuth disconnected' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
