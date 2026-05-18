import { NextRequest, NextResponse } from 'next/server';
import { adapterRegistry } from '@/modules/adapters';
import { ingestPipeline } from '@/modules/engine';
import { getCurrentUser } from '@/modules/auth-user/request';

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const formData = await request.formData();
  const url = formData.get('url')?.toString() ||
    formData.get('text')?.toString() || '';

  const urlMatch = url.match(/https?:\/\/[^\s]+/);
  const targetUrl = urlMatch ? urlMatch[0] : url;

  if (!targetUrl || !adapterRegistry.detect(targetUrl)) {
    return NextResponse.redirect(
      new URL(`/?error=unsupported&url=${encodeURIComponent(url)}`, request.url)
    );
  }

  try {
    const content = await adapterRegistry.fetch(targetUrl);
    await ingestPipeline.ingest(user.id, content);

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
