import type { Metadata, Viewport } from 'next';
import './globals.css';

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
        <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <a href="/" className="text-lg font-bold text-blue-600">
              📚 KClip
            </a>
            <div className="flex gap-4 text-sm">
              <a href="/" className="text-gray-600 hover:text-blue-600">首页</a>
              <a href="/wiki" className="text-gray-600 hover:text-blue-600">知识库</a>
              <a href="/reports" className="text-gray-600 hover:text-blue-600">日报</a>
              <a href="/settings" className="text-gray-600 hover:text-blue-600">设置</a>
            </div>
          </div>
        </nav>
        <main className="max-w-4xl mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
