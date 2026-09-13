import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || 'smart-apartment-secret-jwt-key-2026-very-secure',
  });
  const { pathname } = req.nextUrl;

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
  const isResidentRoute = pathname.startsWith('/home') || pathname.startsWith('/resident');

  // Management sub-routes classification
  const isFinancialRoute =
    (pathname.startsWith('/invoices') && !pathname.startsWith('/resident')) ||
    pathname.startsWith('/fees') ||
    pathname.startsWith('/payments');

  const isResidentMgmtRoute =
    pathname.startsWith('/residents') || pathname.startsWith('/contracts');

  const isVehicleRoute =
    (pathname.startsWith('/vehicles') && !pathname.startsWith('/resident')) ||
    pathname.startsWith('/parking-cards') ||
    pathname.startsWith('/parking-logs');

  const isTechnicalRoute =
    (pathname.startsWith('/feedbacks') && !pathname.startsWith('/resident')) ||
    pathname.startsWith('/tasks') ||
    pathname.startsWith('/maintenance-schedule') ||
    pathname.startsWith('/assets');

  const isVisitorRoute = pathname.startsWith('/visitors');
  const isParcelRoute = pathname.startsWith('/parcels');

  const isGeneralManagerRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/apartments') ||
    pathname.startsWith('/facilities') ||
    pathname.startsWith('/polls') ||
    pathname.startsWith('/staff') ||
    pathname.startsWith('/reports') ||
    pathname.startsWith('/smart-operations') ||
    pathname.startsWith('/settings') ||
    (pathname.startsWith('/notifications') && !pathname.startsWith('/resident'));

  const isAnyManagerRoute =
    isFinancialRoute ||
    isResidentMgmtRoute ||
    isVehicleRoute ||
    isTechnicalRoute ||
    isVisitorRoute ||
    isParcelRoute ||
    isGeneralManagerRoute;

  // 1. Unauthenticated users accessing protected routes
  if (!token && (isAnyManagerRoute || isResidentRoute)) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Authenticated users accessing auth pages (/login, /register)
  if (token && isAuthPage) {
    if (token.role === 'RESIDENT') {
      return NextResponse.redirect(new URL('/home', req.url));
    }
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // If not logged in, proceed
  if (!token) {
    return NextResponse.next();
  }

  const role = token.role as string;

  // 3. Resident role boundary: Resident cannot access any manager route
  if (role === 'RESIDENT' && isAnyManagerRoute) {
    return NextResponse.redirect(new URL('/home', req.url));
  }

  // 4. Staff/Manager accessing resident-only portal (/home, /resident/**)
  if (role !== 'RESIDENT' && isResidentRoute) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // 5. ADMIN & MANAGER have full access to all manager routes
  if (role === 'ADMIN' || role === 'MANAGER') {
    return NextResponse.next();
  }

  // 6. Granular Operational Staff Access Control
  // Financial Routes (/invoices, /fees, /payments): Strictly ADMIN and MANAGER only
  if (isFinancialRoute) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Technical Staff Rules (STAFF_TECHNICIAN)
  if (role === 'STAFF_TECHNICIAN') {
    const isTechAllowed =
      pathname.startsWith('/dashboard') ||
      isTechnicalRoute ||
      pathname.startsWith('/apartments') ||
      pathname.startsWith('/notifications');

    if (!isTechAllowed) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return NextResponse.next();
  }

  // Security Staff Rules (STAFF_SECURITY)
  if (role === 'STAFF_SECURITY') {
    const isSecAllowed =
      pathname.startsWith('/dashboard') ||
      isVehicleRoute ||
      isVisitorRoute ||
      pathname.startsWith('/apartments') ||
      pathname.startsWith('/notifications');

    if (!isSecAllowed) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return NextResponse.next();
  }

  // Receptionist Staff Rules (STAFF_RECEPTIONIST)
  if (role === 'STAFF_RECEPTIONIST') {
    const isRecAllowed =
      pathname.startsWith('/dashboard') ||
      isParcelRoute ||
      isVisitorRoute ||
      pathname.startsWith('/residents') ||
      pathname.startsWith('/apartments') ||
      pathname.startsWith('/notifications');

    if (!isRecAllowed) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return NextResponse.next();
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
    '/payments/:path*',
    '/feedbacks/:path*',
    '/tasks/:path*',
    '/maintenance-schedule/:path*',
    '/assets/:path*',
    '/facilities/:path*',
    '/visitors/:path*',
    '/parcels/:path*',
    '/notifications/:path*',
    '/polls/:path*',
    '/staff/:path*',
    '/reports/:path*',
    '/smart-operations/:path*',
    '/settings/:path*',
    '/vehicles/:path*',
    '/parking-cards/:path*',
    '/parking-logs/:path*',
    '/home/:path*',
    '/resident/:path*',
  ],
};
