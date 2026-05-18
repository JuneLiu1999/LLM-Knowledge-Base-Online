import { NextRequest, NextResponse } from 'next/server';
import { adminAuthService, ADMIN_SESSION_COOKIE } from '@/modules/auth-admin';

export async function POST(request: NextRequest) {
  const sessionId = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (sessionId) await adminAuthService.logout(sessionId);

  const res = NextResponse.json({ success: true });
  res.cookies.delete(ADMIN_SESSION_COOKIE);
  return res;
}
