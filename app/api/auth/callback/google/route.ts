import { NextResponse } from 'next/server';
import { saveStoredGoogleAuth, getStoredGoogleAuth } from '@/lib/google-auth-service';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(new URL('/?oauth_error=' + encodeURIComponent(error || 'Missing code'), req.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://127.0.0.1:3030/api/auth/callback/google';

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL('/?oauth_error=Missing_Client_Credentials', req.url));
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error('Token exchange failed:', errBody);
      return NextResponse.redirect(new URL('/?oauth_error=Token_Exchange_Failed', req.url));
    }

    const data = await tokenRes.json();
    const existing = getStoredGoogleAuth() || {};

    // Get email from userinfo if possible
    let email = existing.email || 'operator@google.com';
    try {
      const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData.email) email = userData.email;
      }
    } catch {}

    saveStoredGoogleAuth({
      accessToken: data.access_token,
      refreshToken: data.refresh_token || existing.refreshToken,
      expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
      tokenType: data.token_type,
      scope: data.scope,
      email,
    });

    return NextResponse.redirect(new URL('/?oauth_status=connected', req.url));
  } catch (err: any) {
    console.error('OAuth callback error:', err);
    return NextResponse.redirect(new URL('/?oauth_error=' + encodeURIComponent(err.message), req.url));
  }
}
