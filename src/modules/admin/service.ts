import type { PrismaClient } from '@prisma/client';
import type { AdminService, DashboardStats, UserWithUsage } from './types';

export class PrismaAdminService implements AdminService {
  constructor(private prisma: PrismaClient) {}

  async listUsers(): Promise<UserWithUsage[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { rawCaptures: true, wikiTopics: true } },
      },
    });

    return users.map(u => ({
      id: u.id,
      username: u.username,
      invitedByCode: u.invitedByCode,
      storageBytes: Number(u.storageBytes),
      tokensInput: Number(u.tokensInput),
      tokensOutput: Number(u.tokensOutput),
      clipCount: u._count.rawCaptures,
      topicCount: u._count.wikiTopics,
      createdAt: u.createdAt,
    }));
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const [
      totalUsers,
      totalAdmins,
      totalClips,
      totalTopics,
      totalInviteCodes,
      unusedInviteCodes,
      usageAgg,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.admin.count(),
      this.prisma.rawCapture.count(),
      this.prisma.wikiTopic.count(),
      this.prisma.inviteCode.count(),
      this.prisma.inviteCode.count({ where: { usedBy: null } }),
      this.prisma.user.aggregate({
        _sum: { storageBytes: true, tokensInput: true, tokensOutput: true },
      }),
    ]);

    return {
      totalUsers,
      totalAdmins,
      totalClips,
      totalTopics,
      totalStorageBytes: Number(usageAgg._sum.storageBytes ?? 0),
      totalTokensInput: Number(usageAgg._sum.tokensInput ?? 0),
      totalTokensOutput: Number(usageAgg._sum.tokensOutput ?? 0),
      totalInviteCodes,
      unusedInviteCodes,
    };
  }
}
