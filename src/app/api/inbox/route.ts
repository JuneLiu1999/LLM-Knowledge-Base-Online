import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/modules/storage';
import { requireUser, UnauthorizedError } from '@/modules/auth-user/request';
import type { RawCaptureStatus } from '@/modules/storage/types';

const VALID_STATUS = new Set<RawCaptureStatus>(['unclassified', 'classifying', 'classified', 'failed']);

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 100, 1), 500);

    const status = statusParam && VALID_STATUS.has(statusParam as RawCaptureStatus)
      ? (statusParam as RawCaptureStatus)
      : undefined;

    const items = await storage.raw.list(user.id, { status, limit });
    return NextResponse.json({ items });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : '获取收件箱失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
