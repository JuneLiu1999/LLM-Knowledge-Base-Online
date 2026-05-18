import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/modules/storage';
import { ingestPipeline } from '@/modules/engine';
import { requireUser, UnauthorizedError } from '@/modules/auth-user/request';

/**
 * POST /api/classify
 * Body: { ids?: string[] }   — 不传 ids 时，分类该用户所有 unclassified + failed
 * Returns 202 + 立即启动后台任务，结果通过 /api/inbox 轮询状态
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = await request.json().catch(() => ({}));
    let ids: string[] = Array.isArray(body.ids) ? body.ids.map(String) : [];

    if (ids.length === 0) {
      const unclassified = await storage.raw.list(user.id, { status: 'unclassified', limit: 500 });
      const failed = await storage.raw.list(user.id, { status: 'failed', limit: 500 });
      ids = [...unclassified, ...failed].map(r => r.id);
    }

    if (ids.length === 0) {
      return NextResponse.json({ accepted: 0, message: '没有待分类的内容' });
    }

    // Fire-and-forget batch
    void ingestPipeline.classifyBatch(user.id, ids).catch(err => {
      console.error('[BG classifyBatch failed]', err);
    });

    return NextResponse.json({ accepted: ids.length }, { status: 202 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : '触发分类失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
