import { NextRequest, NextResponse } from 'next/server';
import { settingsService } from '@/modules/settings';
import { getLLMProvider } from '@/modules/llm';
import { requireUser, UnauthorizedError } from '@/modules/auth-user/request';

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const settings = await settingsService.getAll(user.id);
    return NextResponse.json({ settings });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : '获取设置失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const { key, value } = await request.json();

    if (!key || typeof key !== 'string') {
      return NextResponse.json({ error: '无效的设置项' }, { status: 400 });
    }
    if (!value || typeof value !== 'string') {
      return NextResponse.json({ error: '无效的值' }, { status: 400 });
    }

    await settingsService.set(user.id, key, value);
    getLLMProvider(user.id).invalidate();

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : '保存设置失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
