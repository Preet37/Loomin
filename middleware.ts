import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check for auth session cookie
  const sessionCookie = request.cookies.get('appSession');
  const isAuthenticated = !!sessionCookie;

  // If user is on landing page and has session, redirect to dashboard
  if (request.nextUrl.pathname === '/') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Protect dashboard route - redirect to login if no session
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/api/auth/login', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*'
  ]
};
