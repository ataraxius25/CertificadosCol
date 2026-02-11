import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const adminSession = request.cookies.get('admin_session');
  const isAuthPage = request.nextUrl.pathname === '/admin';
  const isAdminDashboard = request.nextUrl.pathname.startsWith('/admin/dashboard');

  let response = NextResponse.next();

  // Si intenta entrar al dashboard sin sesión -> Login
  if (isAdminDashboard && !adminSession) {
    response = NextResponse.redirect(new URL('/admin', request.url));
  }

  // Si ya tiene sesión e intenta ir al login -> Dashboard
  if (isAuthPage && adminSession) {
    response = NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  // Security Headers
  const securityHeaders = {
    'X-DNS-Prefetch-Control': 'on',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Permitted-Cross-Domain-Policies': 'none',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  };

  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export const config = {
  matcher: ['/admin', '/admin/dashboard/:path*', '/api/:path*'],
};
