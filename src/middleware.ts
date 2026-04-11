import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const adminSession = request.cookies.get('admin_session')?.value;
  const isAuthPage = request.nextUrl.pathname === '/admin';
  const isAdminDashboard = request.nextUrl.pathname.startsWith('/admin/dashboard');
  const isApiAdmin = request.nextUrl.pathname.startsWith('/api/admin') && request.nextUrl.pathname !== '/api/admin/auth';
  
  const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'fallback-secret-key-change-it');

  let isValidSession = false;

  if (adminSession) {
    try {
      await jwtVerify(adminSession, secret);
      isValidSession = true;
    } catch (error) {
      console.error('JWT Verification failed:', error);
    }
  }

  // Si intenta entrar al dashboard sin sesión válida -> Login
  if ((isAdminDashboard || isApiAdmin) && !isValidSession) {
    if (isApiAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // Si ya tiene sesión e intenta ir al login -> Dashboard
  if (isAuthPage && isValidSession) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  const response = NextResponse.next();
  
  // CSP Mejorado
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https://ssl.gstatic.com;
    font-src 'self' https://fonts.gstatic.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-src 'self' https://docs.google.com https://drive.google.com;
    frame-ancestors 'none';
    block-all-mixed-content;
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  // Security Headers
  const securityHeaders = {
    'Content-Security-Policy': cspHeader,
    'X-DNS-Prefetch-Control': 'on',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'X-Frame-Options': 'DENY', // Más estricto que SAMEORIGIN para el admin
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
  matcher: ['/admin', '/admin/dashboard/:path*', '/api/admin/:path*'],
};
