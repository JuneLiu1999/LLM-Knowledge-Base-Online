import { prisma } from '@/modules/storage/client';
import { PrismaUserAuthService } from './service';
import type { UserAuthService } from './types';

export * from './types';
export { PrismaUserAuthService } from './service';
export { hashPassword, verifyPassword } from './password';

export const USER_SESSION_COOKIE = 'kclip_user_session';

export const userAuthService: UserAuthService = new PrismaUserAuthService(prisma);
