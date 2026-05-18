import type { NextRequest } from 'next/server';
import { userAuthService, USER_SESSION_COOKIE } from './index';
import { getDemoUserId } from './demo';
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

/**
 * 读操作用：如果登录返回自己 id，否则返回 demo user id（若配置），都没有则 throw。
 * 用于公开浏览路由（wiki / reports / 首页只读部分）。
 */
export async function getEffectiveUserId(request: NextRequest): Promise<{ userId: string; isDemo: boolean }> {
  const user = await getCurrentUser(request);
  if (user) return { userId: user.id, isDemo: false };

  const demoId = await getDemoUserId();
  if (!demoId) throw new UnauthorizedError('未登录且未配置演示账号');
  return { userId: demoId, isDemo: true };
}

export class UnauthorizedError extends Error {
  constructor(message = '未登录') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}
