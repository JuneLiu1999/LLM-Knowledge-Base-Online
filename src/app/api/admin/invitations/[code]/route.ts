import { NextRequest, NextResponse } from 'next/server';
import { invitationService } from '@/modules/invitation';
import { requireAdmin, UnauthorizedAdminError } from '@/modules/auth-admin/request';

export async function DELETE(request: NextRequest, { params }: { params: { code: string } }) {
  try {
    await requireAdmin(request);
    await invitationService.revoke(params.code);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UnauthorizedAdminError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : '撤销邀请码失败';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
