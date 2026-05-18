import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/modules/storage';
import { requireUser, UnauthorizedError } from '@/modules/auth-user/request';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(request);
    await storage.raw.delete(user.id, params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : '删除失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
