import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import { headers } from 'next/headers';
import { getAuthApiBaseUrl } from '@/lib/api-base-url';

export async function authApiFetch(path: string, init: RequestInit = {}) {
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
  return fetch(new URL(path, getAuthApiBaseUrl()), {
    ...init,
    headers: outgoingHeaders,
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.timeout(15000),
  });
}
