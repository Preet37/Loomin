import { auth0 } from './lib/auth0';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Let Auth0 handle auth routes first
  const authResponse = await auth0.middleware(request);
  
  // If Auth0 handled the request, return its response
  if (authResponse) {
    return authResponse;
  }

  // Get session for protected routes and redirects
  const session = await auth0.getSession();

  // If user is on landing page and already logged in, redirect to dashboard
  if (request.nextUrl.pathname === '/') {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Protect dashboard route
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/auth/:path*',
    '/dashboard/:path*'
  ]
};
