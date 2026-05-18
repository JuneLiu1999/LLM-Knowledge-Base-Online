import type { PrismaClient } from '@prisma/client';
import { hashPassword, verifyPassword } from './password';
import type { UserAuthResult, UserAuthService, UserPublic } from './types';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export class PrismaUserAuthService implements UserAuthService {
  constructor(private prisma: PrismaClient) {}

  private toPublic(u: {
    id: string;
    username: string;
    storageBytes: bigint;
    tokensInput: bigint;
    tokensOutput: bigint;
    createdAt: Date;
  }): UserPublic {
    return {
      id: u.id,
      username: u.username,
      storageBytes: Number(u.storageBytes),
      tokensInput: Number(u.tokensInput),
      tokensOutput: Number(u.tokensOutput),
      createdAt: u.createdAt,
    };
  }

  async register(username: string, password: string, inviteCode: string): Promise<UserAuthResult> {
    if (username.length < 3) throw new Error('用户名至少 3 个字符');
    if (password.length < 8) throw new Error('密码至少 8 个字符');

    const existing = await this.prisma.user.findUnique({ where: { username } });
    if (existing) throw new Error('用户名已被占用');

    const invite = await this.prisma.inviteCode.findUnique({ where: { code: inviteCode } });
    if (!invite) throw new Error('邀请码不存在');
    if (invite.usedBy) throw new Error('邀请码已被使用');
    if (invite.expiresAt && invite.expiresAt < new Date()) throw new Error('邀请码已过期');

    const passwordHash = await hashPassword(password);

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { username, passwordHash, invitedByCode: inviteCode },
      });
      await tx.inviteCode.update({
        where: { code: inviteCode },
        data: { usedBy: newUser.id, usedAt: new Date() },
      });
      return newUser;
    });

    return this.createSession(user.id, this.toPublic(user));
  }

  async login(username: string, password: string): Promise<UserAuthResult> {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) throw new Error('用户名或密码错误');

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) throw new Error('用户名或密码错误');

    return this.createSession(user.id, this.toPublic(user));
  }

  async verifySession(sessionId: string): Promise<UserPublic | null> {
    const session = await this.prisma.session.findUnique({ where: { id: sessionId } });
    if (!session || session.actorType !== 'user') return null;
    if (session.expiresAt < new Date()) {
      await this.prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
      return null;
    }
    const user = await this.prisma.user.findUnique({ where: { id: session.actorId } });
    return user ? this.toPublic(user) : null;
  }

  async logout(sessionId: string): Promise<void> {
    await this.prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
  }

  async getById(userId: string): Promise<UserPublic | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return user ? this.toPublic(user) : null;
  }

  private async createSession(userId: string, publicUser: UserPublic): Promise<UserAuthResult> {
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    const session = await this.prisma.session.create({
      data: { actorType: 'user', actorId: userId, expiresAt },
    });
    return { user: publicUser, sessionId: session.id, expiresAt };
  }
}
