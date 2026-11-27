import { NextResponse, type NextRequest } from 'next/server';
import { currentUserResponseSchema, sessionResponseSchema } from '@repo/contracts';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { authApiFetch } from '@/lib/auth-api';
import { getCurrentUser } from '@/features/auth/current-user';
import { accessCookie, setSessionCookies } from '@/features/auth/session-cookies';
import { googleConfig, googleFlowCookie, googleFlowSchema, validGoogleState } from '@/features/auth/google-flow';

function redirect(url: URL) {
  const response = NextResponse.redirect(url, 303);
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}

export async function GET(request: NextRequest) {
  const store = await cookies();
  const raw = store.get(googleFlowCookie)?.value;
  store.set(googleFlowCookie, '', {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
    path: '/', maxAge: 0,
  });
  let flow: z.infer<typeof googleFlowSchema> | undefined;
  try {
    flow = googleFlowSchema.parse(JSON.parse(raw ?? 'null'));
  } catch {
    return redirect(new URL('/login?google=failed', request.url));
  }
  const destination = flow.intent.mode === 'link' ? `/${flow.intent.workspace}/settings`
    : flow.intent.mode === 'signup' ? '/register' : '/login';
  const fail = (reason: 'failed' | 'unavailable') =>
    redirect(new URL(`${destination}?google=${reason}`, request.url));
  if (!validGoogleState(flow.state, request.nextUrl.searchParams.get('state'))) return fail('failed');
  const code = request.nextUrl.searchParams.get('code');
  if (!code || code.length > 4096 || request.nextUrl.searchParams.has('error')) return fail('failed');

  try {
    const config = googleConfig();
    if (request.nextUrl.origin !== config.origin) return fail('failed');
    let authorization: string | undefined;
    if (flow.intent.mode === 'link') {
      const current = await getCurrentUser();
      const token = store.get(accessCookie)?.value;
      if (current.state !== 'signed-in' || current.user.id !== flow.intent.userId || !token) {
        return fail('failed');
      }
      authorization = `Bearer ${token}`;
    }
    const body = {
      code, codeVerifier: flow.verifier, nonce: flow.nonce, mode: flow.intent.mode,
      ...(flow.intent.mode === 'signup' ? { role: flow.intent.role } : {}),
    };
    const response = await authApiFetch('/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(authorization ? { Authorization: authorization } : {}) },
      body: JSON.stringify(body),
    });
    if (response.status === 401 || response.status === 400) return fail('failed');
    if (!response.ok) {
      console.error(`Google authentication failed with HTTP ${response.status}`);
      return fail('unavailable');
    }
    if (flow.intent.mode === 'link') {
      z.object({ linked: z.literal(true) }).parse(await response.json());
      return redirect(new URL(`${destination}?google=linked`, config.origin));
    }
    const session = sessionResponseSchema.parse(await response.json());
    const userResponse = await authApiFetch('/auth/me', { headers: { Authorization: `Bearer ${session.accessToken}` } });
    if (!userResponse.ok) throw new Error(`Google session lookup failed with HTTP ${userResponse.status}`);
    const user = currentUserResponseSchema.parse(await userResponse.json());
    if (user.role === 'ADMIN') return fail('failed');
    await setSessionCookies(session);
    return redirect(new URL(user.role === 'EMPLOYER' ? '/employer' : '/job-seeker', config.origin));
  } catch (error) {
    console.error('Google authentication could not be completed', error);
    return fail('unavailable');
  }
}
