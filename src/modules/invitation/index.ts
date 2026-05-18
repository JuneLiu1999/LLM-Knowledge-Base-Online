import { prisma } from '@/modules/storage/client';
import { PrismaInvitationService } from './service';
import type { InvitationService } from './types';

export * from './types';
export { PrismaInvitationService } from './service';

export const invitationService: InvitationService = new PrismaInvitationService(prisma);
