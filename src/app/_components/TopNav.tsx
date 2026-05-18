'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface MeResponse {
  user: { id: string; username: string } | null;
}

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then((d: MeResponse) => {
      setUsername(d.user?.username ?? null);
    }).catch(() => {});
  }, [pathname]);

  if (
    pathname === '/login' ||
    pathname === '/register' ||
    pathname.startsWith('/admin')
  ) return null;

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-lg font-bold text-blue-600">
          📚 KClip
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-gray-600 hover:text-blue-600">首页</Link>
          <Link href="/wiki" className="text-gray-600 hover:text-blue-600">知识库</Link>
          <Link href="/reports" className="text-gray-600 hover:text-blue-600">日报</Link>
          <Link href="/settings" className="text-gray-600 hover:text-blue-600">设置</Link>
          {username && (
            <>
              <span className="text-gray-400">|</span>
              <span className="text-gray-500">{username}</span>
              <button onClick={logout} className="text-gray-500 hover:text-red-600">退出</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
