import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ConditionalShell } from '@/app/_components/ConditionalShell';

export const metadata: Metadata = {
  title: 'Knowledge Clipper',
  description: '个人知识库 Web Clipper - 自动分类、双向链接、日报生成',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'KClip',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#2563eb',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js');
            });
          }
        `}} />
      </head>
      <body className="min-h-screen bg-white">
        <ConditionalShell>{children}</ConditionalShell>
      </body>
    </html>
  );
}
