import { NextRequest, NextResponse } from 'next/server';
import { adminService } from '@/modules/admin';
import { requireAdmin, UnauthorizedAdminError } from '@/modules/auth-admin/request';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const users = await adminService.listUsers();
    return NextResponse.json({ users });
  } catch (error) {
    if (error instanceof UnauthorizedAdminError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : '获取用户列表失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
