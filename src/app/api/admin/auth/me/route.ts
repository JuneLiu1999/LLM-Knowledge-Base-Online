import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/modules/auth-admin/request';

export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin(request);
  if (!admin) return NextResponse.json({ admin: null }, { status: 200 });
  return NextResponse.json({ admin });
}
