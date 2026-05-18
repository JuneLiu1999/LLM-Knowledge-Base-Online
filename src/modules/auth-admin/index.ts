import { prisma } from '@/modules/storage/client';
import { PrismaAdminAuthService } from './service';
import type { AdminAuthService } from './types';

export * from './types';
export { PrismaAdminAuthService } from './service';

export const ADMIN_SESSION_COOKIE = 'kclip_admin_session';

export const adminAuthService: AdminAuthService = new PrismaAdminAuthService(prisma);
