import type { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import type { InvitationService, InviteCodeRecord, InviteCodeWithUser } from './types';

function generateCode(): string {
  // 12-char alphanumeric, easy to read
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I
  const bytes = randomBytes(12);
  let code = '';
  for (let i = 0; i < 12; i++) {
    code += alphabet[bytes[i] % alphabet.length];
    if (i === 3 || i === 7) code += '-';
  }
  return code;
}

export class PrismaInvitationService implements InvitationService {
  constructor(private prisma: PrismaClient) {}

  async generate(adminId: string, count = 1, expiresInDays?: number): Promise<InviteCodeRecord[]> {
    const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : null;
    const codes: InviteCodeRecord[] = [];
    for (let i = 0; i < count; i++) {
      const code = await this.prisma.inviteCode.create({
        data: { code: generateCode(), createdBy: adminId, expiresAt },
      });
      codes.push(code);
    }
    return codes;
  }

  async list(includeUsed = true): Promise<InviteCodeWithUser[]> {
    const codes = await this.prisma.inviteCode.findMany({
      where: includeUsed ? undefined : { usedBy: null },
      orderBy: { createdAt: 'desc' },
      include: {
        admin: { select: { username: true } },
        user: { select: { username: true } },
      },
    });
    return codes.map(c => ({
      code: c.code,
      createdBy: c.createdBy,
      usedBy: c.usedBy,
      createdAt: c.createdAt,
      usedAt: c.usedAt,
      expiresAt: c.expiresAt,
      createdByUsername: c.admin.username,
      usedByUsername: c.user?.username ?? null,
    }));
  }

  async revoke(code: string): Promise<void> {
    const existing = await this.prisma.inviteCode.findUnique({ where: { code } });
    if (!existing) throw new Error('邀请码不存在');
    if (existing.usedBy) throw new Error('已被使用的邀请码不可撤销');
    await this.prisma.inviteCode.delete({ where: { code } });
  }
}
