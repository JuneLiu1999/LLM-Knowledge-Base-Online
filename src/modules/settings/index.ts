import { prisma } from '@/modules/storage/client';
import { PrismaSettingsService } from './service';
import type { SettingsService } from './types';

export type { SettingsService, LLMConfig } from './types';
export { PrismaSettingsService } from './service';
export { encrypt, decrypt, maskKey } from './crypto';

export const settingsService: SettingsService = new PrismaSettingsService(prisma);
