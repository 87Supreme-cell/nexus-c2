import fs from 'fs';
import path from 'path';

const AUTH_FILE = path.join(process.cwd(), 'data', 'google-auth.json');

export interface GoogleAuthTokens {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number; // timestamp in ms
  tokenType?: string;
  scope?: string;
  email?: string;
}

export function getStoredGoogleAuth(): GoogleAuthTokens | null {
  try {
    if (fs.existsSync(AUTH_FILE)) {
      const data = fs.readFileSync(AUTH_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed reading google-auth.json:', err);
  }
  return null;
}

export function saveStoredGoogleAuth(tokens: GoogleAuthTokens): void {
  try {
    const dir = path.dirname(AUTH_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(AUTH_FILE, JSON.stringify(tokens, null, 2), 'utf-8');
    try {
      fs.chmodSync(AUTH_FILE, 0o600); // Strict file permissions
    } catch {}
  } catch (err) {
    console.error('Failed saving google-auth.json:', err);
  }
}

export async function getValidAccessToken(): Promise<string | null> {
  const auth = getStoredGoogleAuth();
  if (!auth || !auth.accessToken) {
    return null;
  }

  // Check if token is still valid (with 60-second buffer)
  const now = Date.now();
  if (auth.expiresAt && auth.expiresAt > now + 60000) {
    return auth.accessToken;
  }

  // Token is expired, check if we have a refresh token
  if (auth.refreshToken) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (clientId && clientSecret) {
      try {
        const res = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: auth.refreshToken,
            grant_type: 'refresh_token',
          }),
        });

        if (res.ok) {
          const data = await res.json();
          auth.accessToken = data.access_token;
          auth.expiresAt = Date.now() + (data.expires_in || 3600) * 1000;
          saveStoredGoogleAuth(auth);
          return auth.accessToken || null;
        }
      } catch (err) {
        console.error('OAuth token refresh failed:', err);
      }
    }
  }

  // Return existing token as best effort
  return auth.accessToken || null;
}
