import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/modules/storage';
import { reporter } from '@/modules/engine';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  if (date) {
    const report = await storage.report.findByDate(date);
    if (!report) {
      return NextResponse.json({ error: '该日期无日报' }, { status: 404 });
    }
    return NextResponse.json(report);
  }

  const reports = await storage.report.listRecent(30);
  return NextResponse.json({ reports });
}

export async function POST(request: NextRequest) {
  try {
    const { date } = await request.json().catch(() => ({}));
    const targetDate = date || new Date().toISOString().split('T')[0];

    const report = await reporter.generateDailyReport(targetDate);

    return NextResponse.json({ success: true, date: targetDate, contentMd: report });
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
