import { NextRequest, NextResponse } from 'next/server';

const USER_COOKIE = 'kclip_user_session';
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
  '/api/share-target', // PWA Share Target falls through to /login if not authed
];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith('/_next') || pathname.startsWith('/icons') || pathname.startsWith('/favicon')) return true;
  if (PUBLIC_API_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) return true;
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

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
    const res = NextResponse.next();
    res.headers.set('x-admin-session', adminSession);
    return res;
  }

  // Regular user route
  const userSession = request.cookies.get(USER_COOKIE)?.value;
  if (!userSession) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }
  const res = NextResponse.next();
  res.headers.set('x-user-session', userSession);
  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
