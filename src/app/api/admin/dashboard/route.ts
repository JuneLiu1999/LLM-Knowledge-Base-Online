import { NextRequest, NextResponse } from 'next/server';
import { adminService } from '@/modules/admin';
import { requireAdmin, UnauthorizedAdminError } from '@/modules/auth-admin/request';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const stats = await adminService.getDashboardStats();
    return NextResponse.json({ stats });
  } catch (error) {
    if (error instanceof UnauthorizedAdminError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : '获取仪表盘失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
