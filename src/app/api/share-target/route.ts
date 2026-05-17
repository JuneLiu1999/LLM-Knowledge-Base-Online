import { NextRequest, NextResponse } from 'next/server';
import { fetchContent, detectPlatform } from '@/lib/adapters';
import { ingestArticle } from '@/lib/engine/ingest';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const url = formData.get('url')?.toString() ||
    formData.get('text')?.toString() || '';

  const urlMatch = url.match(/https?:\/\/[^\s]+/);
  const targetUrl = urlMatch ? urlMatch[0] : url;

  if (!targetUrl || !detectPlatform(targetUrl)) {
    return NextResponse.redirect(
      new URL(`/?error=unsupported&url=${encodeURIComponent(url)}`, request.url)
    );
  }

  try {
    const content = await fetchContent(targetUrl);
    await ingestArticle({
      sourcePlatform: content.sourcePlatform,
      sourceUrl: content.sourceUrl,
      title: content.title,
      bodyMarkdown: content.bodyMarkdown,
      author: content.author,
      mediaUrls: content.mediaUrls,
      confidence: content.confidence,
    });

    return NextResponse.redirect(
      new URL(`/?success=true&title=${encodeURIComponent(content.title)}`, request.url)
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(message)}`, request.url)
    );
  }
}
