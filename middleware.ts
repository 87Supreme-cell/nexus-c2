import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Strict Allowed Hosts for Local DoD Operation
const ALLOWED_HOSTS = ['localhost:3030', '127.0.0.1:3030'];

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const origin = request.headers.get('origin') || '';
  const referer = request.headers.get('referer') || '';
  const secFetchSite = request.headers.get('sec-fetch-site');

  // 1. Host Header Validation (Prevent DNS Rebinding attacks)
  if (!ALLOWED_HOSTS.includes(host)) {
    return new NextResponse('Access Denied: Invalid Host Header', { status: 403 });
  }

  // 2. CSRF & Cross-Origin Egress Defense on State-Changing API routes
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    // If Sec-Fetch-Site indicates a cross-site request from another domain
    if (secFetchSite === 'cross-site') {
      return new NextResponse('Access Denied: Cross-Origin Request Blocked by Zero-Trust Policy', { status: 403 });
    }

    // Verify Origin or Referer matches localhost if present
    if (origin) {
      const isOriginAllowed = origin.startsWith('http://localhost:3030') || origin.startsWith('http://127.0.0.1:3030');
      if (!isOriginAllowed) {
        return new NextResponse('Access Denied: Untrusted Origin', { status: 403 });
      }
    } else if (referer) {
      const isRefererAllowed = referer.startsWith('http://localhost:3030') || referer.startsWith('http://127.0.0.1:3030');
      if (!isRefererAllowed) {
        return new NextResponse('Access Denied: Untrusted Referer', { status: 403 });
      }
    }
  }

  // 3. Inject Strict Defense-Grade Security Headers
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
