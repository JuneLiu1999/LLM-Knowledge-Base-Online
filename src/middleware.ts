import { NextRequest, NextResponse } from 'next/server';

const ADMIN_COOKIE = 'kclip_admin_session';

const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/admin/login',
  '/manifest.json',
  '/sw.js',
];

const PUBLIC_API_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/me',
  '/api/admin/auth/login',
];

// Read-only routes that anonymous visitors can access (showing demo account data).
// Write-only routes (/api/clip, /api/settings, /api/share-target) stay protected below.
const DEMO_PUBLIC_PATHS = [
  '/',
  '/wiki',
  '/reports',
];

const DEMO_PUBLIC_API_PATHS = [
  '/api/wiki',
  '/api/report',
];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith('/_next') || pathname.startsWith('/icons') || pathname.startsWith('/favicon')) return true;
  if (PUBLIC_API_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) return true;
  return false;
}

function isDemoPublic(pathname: string): boolean {
  if (DEMO_PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith('/wiki/')) return true;
  if (DEMO_PUBLIC_API_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) return true;
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();
  if (isDemoPublic(pathname)) return NextResponse.next();

  const isAdminRoute =
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname.startsWith('/api/admin/');

  if (isAdminRoute) {
    const adminSession = request.cookies.get(ADMIN_COOKIE)?.value;
    if (!adminSession) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: '未登录' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    return NextResponse.next();
  }

  // Write-only routes that require user login: /api/clip, /api/settings,
  // /api/share-target, /settings, /api/auth/logout
  const userSession = request.cookies.get('kclip_user_session')?.value;
  if (!userSession) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
