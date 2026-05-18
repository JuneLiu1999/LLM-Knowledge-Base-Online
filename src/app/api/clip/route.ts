import { NextRequest, NextResponse } from 'next/server';
import { adapterRegistry } from '@/modules/adapters';
import { ingestPipeline } from '@/modules/engine';
import { requireUser, UnauthorizedError } from '@/modules/auth-user/request';

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: '请提供有效的 URL' }, { status: 400 });
    }

    if (!adapterRegistry.detect(url)) {
      return NextResponse.json(
        { error: '不支持的平台。支持：B站、微信公众号、小红书' },
        { status: 400 }
      );
    }

    const content = await adapterRegistry.fetch(url);
    const result = await ingestPipeline.saveRaw(user.id, content);

    // Fire-and-forget background classification.
    // Errors are recorded in the raw_capture.status='failed' + classificationError.
    void ingestPipeline.classifyOne(user.id, result.rawCaptureId).catch(err => {
      console.error('[BG classify failed]', result.rawCaptureId, err);
    });

    return NextResponse.json({
      success: true,
      data: {
        rawCaptureId: result.rawCaptureId,
        title: content.title,
        platform: content.sourcePlatform,
        status: 'classifying',
      },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
