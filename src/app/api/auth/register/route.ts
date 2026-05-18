import { NextRequest, NextResponse } from 'next/server';
import { userAuthService, USER_SESSION_COOKIE } from '@/modules/auth-user';

export async function POST(request: NextRequest) {
  try {
    const { username, password, inviteCode } = await request.json();
    if (typeof username !== 'string' || typeof password !== 'string' || typeof inviteCode !== 'string') {
      return NextResponse.json({ error: '参数无效' }, { status: 400 });
    }

    const result = await userAuthService.register(username, password, inviteCode);
    const res = NextResponse.json({ user: result.user });
    res.cookies.set(USER_SESSION_COOKIE, result.sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: result.expiresAt,
    });
    return res;
  } catch (error) {
    const message = error instanceof Error ? error.message : '注册失败';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
