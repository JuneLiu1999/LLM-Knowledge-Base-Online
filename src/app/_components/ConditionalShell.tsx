'use client';

import { usePathname } from 'next/navigation';
import { TopNav } from './TopNav';

export function ConditionalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isAuthPage =
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/admin/login';
  const isAdminPage = pathname.startsWith('/admin');

  if (isAuthPage) return <>{children}</>;
  if (isAdminPage) return <>{children}</>; // admin pages handle their own chrome

  return (
    <>
      <TopNav />
      <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
    </>
  );
}
