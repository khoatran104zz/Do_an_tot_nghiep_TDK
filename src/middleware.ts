import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || 'smart-apartment-secret-jwt-key-2026-very-secure' });
  const { pathname } = req.nextUrl;

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
  const isManagerRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/apartments') ||
    pathname.startsWith('/residents') ||
    pathname.startsWith('/contracts') ||
    pathname.startsWith('/fees') ||
    (pathname.startsWith('/invoices') && !pathname.startsWith('/resident')) ||
    (pathname.startsWith('/feedbacks') && !pathname.startsWith('/resident')) ||
    (pathname.startsWith('/notifications') && !pathname.startsWith('/resident'));

  const isResidentRoute = pathname.startsWith('/home') || pathname.startsWith('/resident');

  // If user is not logged in and tries to access protected page
  if (!token && (isManagerRoute || isResidentRoute)) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user is logged in and accesses auth pages (/login, /register)
  if (token && isAuthPage) {
    if (token.role === 'RESIDENT') {
      return NextResponse.redirect(new URL('/home', req.url));
    }
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Role based protection: Resident accessing manager pages
  if (token && token.role === 'RESIDENT' && isManagerRoute) {
    return NextResponse.redirect(new URL('/home', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/login',
    '/register',
    '/dashboard/:path*',
    '/apartments/:path*',
    '/residents/:path*',
    '/contracts/:path*',
    '/fees/:path*',
    '/invoices/:path*',
    '/feedbacks/:path*',
    '/notifications/:path*',
    '/home/:path*',
    '/resident/:path*',
  ],
};
