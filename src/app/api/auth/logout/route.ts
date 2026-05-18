import { NextRequest, NextResponse } from 'next/server';
import { userAuthService, USER_SESSION_COOKIE } from '@/modules/auth-user';

export async function POST(request: NextRequest) {
  const sessionId = request.cookies.get(USER_SESSION_COOKIE)?.value;
  if (sessionId) await userAuthService.logout(sessionId);

  const res = NextResponse.json({ success: true });
  res.cookies.delete(USER_SESSION_COOKIE);
  return res;
}
