import { prisma } from '@/modules/storage/client';
import { PrismaAdminService } from './service';
import type { AdminService } from './types';

export * from './types';
export { PrismaAdminService } from './service';

export const adminService: AdminService = new PrismaAdminService(prisma);
