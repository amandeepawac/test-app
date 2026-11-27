import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/features/auth/current-user';
import { createGoogleFlow, googleAuthorizationUrl, googleConfig, googleFlowCookie } from '@/features/auth/google-flow';

export async function POST(request: NextRequest) {
  let config: ReturnType<typeof googleConfig>;
  try {
    config = googleConfig();
  } catch (error) {
    console.error('Google authentication configuration error', error);
    return NextResponse.redirect(new URL('/login?google=unavailable', request.url), 303);
  }
  if (request.headers.get('origin') !== config.origin) {
    return new NextResponse('Invalid request origin', { status: 403 });
  }
  const form = await request.formData();
  const mode = form.get('mode');
  const role = form.get('role');
  let intent: ReturnType<typeof createGoogleFlow>['intent'];
  if (mode === 'signup' && (role === 'JOB_SEEKER' || role === 'EMPLOYER')) {
    intent = { mode, role };
  } else if (mode === 'login') {
    intent = { mode };
  } else if (mode === 'link') {
    const user = await getCurrentUser();
    if (user.state !== 'signed-in' || user.user.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/login?google=failed', config.origin), 303);
    }
    intent = { mode, userId: user.user.id, workspace: user.user.role === 'EMPLOYER' ? 'employer' : 'job-seeker' };
  } else {
    return new NextResponse('Invalid request', { status: 400 });
  }
  const flow = createGoogleFlow(intent);
  const response = NextResponse.redirect(googleAuthorizationUrl(flow, config), 303);
  response.cookies.set(googleFlowCookie, JSON.stringify(flow), {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
    path: '/', maxAge: 600,
  });
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}
