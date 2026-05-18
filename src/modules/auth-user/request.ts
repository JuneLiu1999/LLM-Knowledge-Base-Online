import type { NextRequest } from 'next/server';
import { userAuthService, USER_SESSION_COOKIE } from './index';
import type { UserPublic } from './types';

export async function getCurrentUser(request: NextRequest): Promise<UserPublic | null> {
  const sessionId = request.cookies.get(USER_SESSION_COOKIE)?.value;
  if (!sessionId) return null;
  return userAuthService.verifySession(sessionId);
}

export async function requireUser(request: NextRequest): Promise<UserPublic> {
  const user = await getCurrentUser(request);
  if (!user) throw new UnauthorizedError('未登录');
  return user;
}

export class UnauthorizedError extends Error {
  constructor(message = '未登录') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}
