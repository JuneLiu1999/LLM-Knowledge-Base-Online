import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/modules/storage';
import { reporter } from '@/modules/engine';
import { requireUser, UnauthorizedError } from '@/modules/auth-user/request';

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (date) {
      const report = await storage.report.findByDate(user.id, date);
      if (!report) {
        return NextResponse.json({ error: '该日期无日报' }, { status: 404 });
      }
      return NextResponse.json(report);
    }

    const reports = await storage.report.listRecent(user.id, 30);
    return NextResponse.json({ reports });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const { date } = await request.json().catch(() => ({}));
    const targetDate = date || new Date().toISOString().split('T')[0];

    const report = await reporter.generateDailyReport(user.id, targetDate);

    return NextResponse.json({ success: true, date: targetDate, contentMd: report });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
