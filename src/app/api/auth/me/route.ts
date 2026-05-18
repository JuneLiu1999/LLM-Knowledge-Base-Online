import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/modules/auth-user/request';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ user: null }, { status: 200 });
  return NextResponse.json({ user });
}
