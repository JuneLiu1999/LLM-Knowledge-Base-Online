'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AdminMe {
  admin: { id: string; username: string } | null;
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/auth/me').then(r => r.json()).then((d: AdminMe) => {
      setUsername(d.admin?.username ?? null);
    });
  }, []);

  async function logout() {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  const navItems = [
    { href: '/admin', label: '仪表盘' },
    { href: '/admin/users', label: '用户列表' },
    { href: '/admin/invitations', label: '邀请码' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-semibold">🛡️ KClip 后台</span>
            <div className="flex gap-4 text-sm">
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={pathname === item.href ? 'text-white font-medium' : 'text-gray-400 hover:text-white'}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          {username && (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-gray-300">{username}</span>
              <button onClick={logout} className="text-gray-400 hover:text-red-400">退出</button>
            </div>
          )}
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
