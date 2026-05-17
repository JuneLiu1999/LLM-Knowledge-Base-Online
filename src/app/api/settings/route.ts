import { NextRequest, NextResponse } from 'next/server';
import { settingsService } from '@/modules/settings';
import { llm } from '@/modules/llm';

export async function GET() {
  try {
    const settings = await settingsService.getAll();
    return NextResponse.json({ settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取设置失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { key, value } = await request.json();

    if (!key || typeof key !== 'string') {
      return NextResponse.json({ error: '无效的设置项' }, { status: 400 });
    }
    if (!value || typeof value !== 'string') {
      return NextResponse.json({ error: '无效的值' }, { status: 400 });
    }

    await settingsService.set(key, value);
    llm.invalidate();

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : '保存设置失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
