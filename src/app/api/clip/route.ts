import { NextRequest, NextResponse } from 'next/server';
import { fetchContent, detectPlatform } from '@/lib/adapters';
import { ingestArticle } from '@/lib/engine/ingest';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: '请提供有效的 URL' }, { status: 400 });
    }

    const platform = detectPlatform(url);
    if (!platform) {
      return NextResponse.json(
        { error: `不支持的平台。支持：B站、微信公众号、小红书` },
        { status: 400 }
      );
    }

    const content = await fetchContent(url);

    const result = await ingestArticle({
      sourcePlatform: content.sourcePlatform,
      sourceUrl: content.sourceUrl,
      title: content.title,
      bodyMarkdown: content.bodyMarkdown,
      author: content.author,
      mediaUrls: content.mediaUrls,
      confidence: content.confidence,
    });

    return NextResponse.json({
      success: true,
      data: {
        title: content.title,
        platform: content.sourcePlatform,
        topicPath: result.topicPath,
        action: result.action,
        linksCreated: result.linksCreated,
        contradictions: result.contradictions,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
