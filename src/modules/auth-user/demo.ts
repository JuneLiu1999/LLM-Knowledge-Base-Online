import { prisma } from '@/modules/storage/client';

let cachedDemoUserId: string | null | undefined = undefined;

export async function getDemoUserId(): Promise<string | null> {
  if (cachedDemoUserId !== undefined) return cachedDemoUserId;

  const username = process.env.DEMO_USERNAME;
  if (!username) {
    cachedDemoUserId = null;
    return null;
  }

  const user = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  cachedDemoUserId = user?.id ?? null;
  return cachedDemoUserId;
}
