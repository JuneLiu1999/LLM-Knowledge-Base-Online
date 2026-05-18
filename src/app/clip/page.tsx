'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ClipperInner() {
  const params = useSearchParams();
  const url = params.get('url') || '';
  const [status, setStatus] = useState<'idle' | 'authChecking' | 'unauthorized' | 'clipping' | 'success' | 'error'>('idle');
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!url) {
      setStatus('error');
      setError('缺少 URL 参数');
      return;
    }
    setStatus('authChecking');
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.user) {
        setStatus('unauthorized');
        return;
      }
      doClip();
    });
  }, [url]); // eslint-disable-line react-hooks/exhaustive-deps

  async function doClip() {
    setStatus('clipping');
    try {
      const resp = await fetch('/api/clip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        setTitle(data.data.title || '');
        setStatus('success');
      } else {
        setError(data.error || '添加失败');
        setStatus('error');
      }
    } catch {
      setError('网络错误');
      setStatus('error');
    }
  }

  // Auto-close countdown after success
  useEffect(() => {
    if (status !== 'success') return;
    if (countdown <= 0) {
      window.close();
      return;
    }
    const t = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(t);
  }, [status, countdown]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 space-y-4">
        <div className="flex items-center gap-2 text-blue-600">
          <span className="text-xl">📚</span>
          <span className="font-semibold">KClip 收藏</span>
        </div>

        {url && (
          <div className="text-xs text-gray-500 truncate border-l-2 border-gray-200 pl-2">
            {url}
          </div>
        )}

        {status === 'idle' || status === 'authChecking' ? (
          <div className="text-sm text-gray-500">⏳ 准备中…</div>
        ) : null}

        {status === 'unauthorized' && (
          <div className="space-y-3">
            <div className="text-sm text-red-600">需要先登录才能添加。</div>
            <Link
              href={`/login?next=${encodeURIComponent(`/clip?url=${encodeURIComponent(url)}`)}`}
              className="block text-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              去登录
            </Link>
          </div>
        )}

        {status === 'clipping' && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span className="inline-block w-3 h-3 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></span>
            正在抓取内容…
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-2">
            <div className="text-sm text-green-700">✓ 已添加到收件箱</div>
            {title && <div className="text-sm font-medium truncate">{title}</div>}
            <div className="text-xs text-gray-500">
              AI 分类正在后台进行。{countdown} 秒后自动关闭…
            </div>
            <button
              onClick={() => window.close()}
              className="w-full px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 border rounded"
            >
              立即关闭
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-2">
            <div className="text-sm text-red-700">✗ {error}</div>
            <button
              onClick={() => window.close()}
              className="w-full px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 border rounded"
            >
              关闭
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClipperPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">加载中…</div>}>
      <ClipperInner />
    </Suspense>
  );
}
