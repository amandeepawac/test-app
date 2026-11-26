import { NextResponse, type NextRequest } from 'next/server';
import { accessCookie, refreshCookie } from '@/features/auth/session-cookie-names';

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === '/admin/login') {
    return NextResponse.next();
  }

  const hasSession =
    request.cookies.get(accessCookie)?.value || request.cookies.get(refreshCookie)?.value;
  if (hasSession) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL('/admin/login', request.url));
}

export const config = {
  matcher: ['/admin/:path*'],
};
