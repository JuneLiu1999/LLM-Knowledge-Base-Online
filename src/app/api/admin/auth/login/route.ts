import { NextRequest, NextResponse } from 'next/server';
import { adminAuthService, ADMIN_SESSION_COOKIE } from '@/modules/auth-admin';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    if (typeof username !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: '参数无效' }, { status: 400 });
    }

    const result = await adminAuthService.login(username, password);
    const res = NextResponse.json({ admin: result.admin });
    res.cookies.set(ADMIN_SESSION_COOKIE, result.sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: result.expiresAt,
    });
    return res;
  } catch (error) {
    const message = error instanceof Error ? error.message : '登录失败';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
