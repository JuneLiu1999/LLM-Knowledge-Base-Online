import type { NextRequest } from 'next/server';
import { adminAuthService, ADMIN_SESSION_COOKIE } from './index';
import type { AdminPublic } from './types';

export async function getCurrentAdmin(request: NextRequest): Promise<AdminPublic | null> {
  const sessionId = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!sessionId) return null;
  return adminAuthService.verifySession(sessionId);
}

export async function requireAdmin(request: NextRequest): Promise<AdminPublic> {
  const admin = await getCurrentAdmin(request);
  if (!admin) throw new UnauthorizedAdminError('未登录管理员');
  return admin;
}

export class UnauthorizedAdminError extends Error {
  constructor(message = '未登录管理员') {
    super(message);
    this.name = 'UnauthorizedAdminError';
  }
}
