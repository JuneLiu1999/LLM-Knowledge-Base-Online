import type { PrismaClient } from '@prisma/client';
import { hashPassword, verifyPassword } from '@/modules/auth-user/password';
import type { AdminAuthResult, AdminAuthService, AdminPublic } from './types';

const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours (shorter for admin)

export class PrismaAdminAuthService implements AdminAuthService {
  constructor(private prisma: PrismaClient) {}

  private toPublic(a: { id: string; username: string; createdAt: Date }): AdminPublic {
    return { id: a.id, username: a.username, createdAt: a.createdAt };
  }

  async login(username: string, password: string): Promise<AdminAuthResult> {
    const admin = await this.prisma.admin.findUnique({ where: { username } });
    if (!admin) throw new Error('用户名或密码错误');
    const ok = await verifyPassword(password, admin.passwordHash);
    if (!ok) throw new Error('用户名或密码错误');

    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    const session = await this.prisma.session.create({
      data: { actorType: 'admin', actorId: admin.id, expiresAt },
    });
    return { admin: this.toPublic(admin), sessionId: session.id, expiresAt };
  }

  async verifySession(sessionId: string): Promise<AdminPublic | null> {
    const session = await this.prisma.session.findUnique({ where: { id: sessionId } });
    if (!session || session.actorType !== 'admin') return null;
    if (session.expiresAt < new Date()) {
      await this.prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
      return null;
    }
    const admin = await this.prisma.admin.findUnique({ where: { id: session.actorId } });
    return admin ? this.toPublic(admin) : null;
  }

  async logout(sessionId: string): Promise<void> {
    await this.prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
  }

  async createAdmin(username: string, password: string): Promise<AdminPublic> {
    if (username.length < 3) throw new Error('用户名至少 3 个字符');
    if (password.length < 8) throw new Error('密码至少 8 个字符');

    const existing = await this.prisma.admin.findUnique({ where: { username } });
    if (existing) throw new Error('管理员用户名已被占用');

    const passwordHash = await hashPassword(password);
    const admin = await this.prisma.admin.create({ data: { username, passwordHash } });
    return this.toPublic(admin);
  }

  async count(): Promise<number> {
    return this.prisma.admin.count();
  }
}
