import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import { headers } from 'next/headers';
import { getAuthApiBaseUrl } from '@/lib/api-base-url';

const uuidPathSegment = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const allowedApiPath = new RegExp(
  `^/(?:auth/(?:google|me|login|register|forgot-password|reset-password|verify-email|refresh|logout)|admin/(?:dashboard|employer-verifications(?:/${uuidPathSegment}(?:/documents/${uuidPathSegment}(?:/access)?)?)?|jobs(?:/${uuidPathSegment}(?:/moderation)?)?|reports(?:/${uuidPathSegment})?|audit-logs)|employers/me(?:/(?:verification(?:/(?:documents(?:/${uuidPathSegment})?|submit))?|complete|jobs(?:/${uuidPathSegment}(?:/applications)?)?|applications/${uuidPathSegment}/status))?|job-seeker/(?:profile(?:/complete)?|skills|jobs/${uuidPathSegment}/applications|applications(?:/${uuidPathSegment}/withdraw)?)|jobs(?:/${uuidPathSegment}(?:/(?:publish|pause))?)?|public/(?:jobs(?:/${uuidPathSegment})?|job-categories))(?:\\?[^#]*)?$`,
  'i',
);

export async function authApiFetch(path: string, init: RequestInit = {}) {
  if (!allowedApiPath.test(path)) {
    throw new Error('Authentication API path is not an allowed endpoint');
  }

  const [pathname = '', search = ''] = path.split('?', 2);
  const url = new URL(getAuthApiBaseUrl());
  url.pathname = pathname.split('/').map(encodeURIComponent).join('/');
  url.search = new URLSearchParams(search).toString();

  const secret = process.env.AUTH_PROXY_SECRET;
  if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
    throw new Error('AUTH_PROXY_SECRET must contain at least 32 bytes');
  }
  const requestHeaders = await headers();
  const forwardedIp = requestHeaders.get('x-forwarded-for');
  const ip = forwardedIp || (process.env.NODE_ENV === 'production' ? '' : '127.0.0.1');
  if (!isIP(ip)) {
    throw new Error('The trusted proxy must supply exactly one client IP');
  }
  const timestamp = Date.now().toString();
  const signature = createHmac('sha256', secret).update(`${timestamp}:${ip}`).digest('hex');
  const outgoingHeaders = new Headers(init.headers);
  outgoingHeaders.set('x-auth-client-ip', ip);
  outgoingHeaders.set('x-auth-client-time', timestamp);
  outgoingHeaders.set('x-auth-client-signature', signature);
  return fetch(url, {
    ...init,
    headers: outgoingHeaders,
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.timeout(15000),
  });
}
