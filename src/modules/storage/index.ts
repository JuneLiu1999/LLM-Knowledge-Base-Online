import { prisma } from './client';
import {
  PrismaRawCaptureRepository,
  PrismaTopicRepository,
  PrismaLinkRepository,
  PrismaContradictionRepository,
  PrismaContributionRepository,
  PrismaDailyReportRepository,
} from './repositories';
import type { Storage } from './types';

export * from './types';
export { prisma } from './client';

export const storage: Storage = {
  raw: new PrismaRawCaptureRepository(prisma),
  topic: new PrismaTopicRepository(prisma),
  link: new PrismaLinkRepository(prisma),
  contradiction: new PrismaContradictionRepository(prisma),
  contribution: new PrismaContributionRepository(prisma),
  report: new PrismaDailyReportRepository(prisma),
};
