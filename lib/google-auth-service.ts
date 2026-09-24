import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const AUTH_FILE = path.join(process.cwd(), 'data', 'google-auth.json');

export interface GoogleAuthTokens {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number; // timestamp in ms
  tokenType?: string;
  scope?: string;
  email?: string;
  authMethod?: string;
  disconnected?: boolean;
}

/**
 * Extracts the active Google OAuth token directly from macOS Keychain (Antigravity session).
 */
export function getSystemKeychainGoogleAuthSync(): GoogleAuthTokens | null {
  try {
    const raw = execFileSync(
      '/usr/bin/security',
      ['find-generic-password', '-s', 'gemini', '-a', 'antigravity', '-w'],
      { encoding: 'utf-8', timeout: 3000 }
    ).trim();

    if (!raw) return null;
    const b64 = raw.startsWith('go-keyring-base64:') ? raw.slice('go-keyring-base64:'.length) : raw;
    const parsed = JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'));

    let email = 'operator@google.com';
    if (parsed.id_token) {
      try {
        const payload = JSON.parse(Buffer.from(parsed.id_token.split('.')[1], 'base64').toString('utf-8'));
        if (payload.email) email = payload.email;
      } catch {}
    }

    const expiryMs = parsed.token?.expiry ? new Date(parsed.token.expiry).getTime() : Date.now() + 3600000;

    return {
      accessToken: parsed.token?.access_token,
      refreshToken: parsed.token?.refresh_token,
      expiresAt: expiryMs,
      email,
      authMethod: 'system-keychain',
      disconnected: false,
    };
  } catch {
    return null;
  }
}

export function getStoredGoogleAuth(): GoogleAuthTokens | null {
  try {
    if (fs.existsSync(AUTH_FILE)) {
      const data = fs.readFileSync(AUTH_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed.disconnected) {
        return parsed;
      }
      if (parsed.accessToken) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed reading google-auth.json:', err);
  }

  // Auto-detect from system keychain if not explicitly disconnected
  const systemAuth = getSystemKeychainGoogleAuthSync();
  if (systemAuth && systemAuth.accessToken) {
    saveStoredGoogleAuth(systemAuth);
    return systemAuth;
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
  let auth = getStoredGoogleAuth();
  if (!auth || auth.disconnected || !auth.accessToken) {
    // Attempt fallback from system keychain
    const systemAuth = getSystemKeychainGoogleAuthSync();
    if (systemAuth && systemAuth.accessToken) {
      saveStoredGoogleAuth(systemAuth);
      auth = systemAuth;
    } else {
      return null;
    }
  }

  // Check if token is still valid (with 60-second buffer)
  const now = Date.now();
  if (auth.expiresAt && auth.expiresAt > now + 60000) {
    return auth.accessToken || null;
  }

  // Check if system keychain has a freshly refreshed token
  const systemAuth = getSystemKeychainGoogleAuthSync();
  if (systemAuth && systemAuth.expiresAt && systemAuth.expiresAt > now + 60000) {
    saveStoredGoogleAuth(systemAuth);
    return systemAuth.accessToken || null;
  }

  // Token is expired, check if we have a refresh token
  if (auth.refreshToken) {
    const clientId = process.env.GOOGLE_CLIENT_ID || '1071006060591-tmhssin2h21lcre235vtolojh4g403ep.apps.googleusercontent.com';
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
