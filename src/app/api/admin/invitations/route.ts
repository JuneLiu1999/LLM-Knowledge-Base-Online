import { NextRequest, NextResponse } from 'next/server';
import { invitationService } from '@/modules/invitation';
import { requireAdmin, UnauthorizedAdminError } from '@/modules/auth-admin/request';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const codes = await invitationService.list(true);
    return NextResponse.json({ codes });
  } catch (error) {
    if (error instanceof UnauthorizedAdminError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : '获取邀请码列表失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    const body = await request.json().catch(() => ({}));
    const count = Math.min(Math.max(Number(body.count) || 1, 1), 20);
    const expiresInDays = body.expiresInDays ? Number(body.expiresInDays) : undefined;
    const codes = await invitationService.generate(admin.id, count, expiresInDays);
    return NextResponse.json({ codes });
  } catch (error) {
    if (error instanceof UnauthorizedAdminError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : '生成邀请码失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
