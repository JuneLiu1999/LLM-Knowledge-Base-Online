import Link from 'next/link';

export function DemoBanner() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-900 flex items-center justify-between gap-3 flex-wrap">
      <span>👀 你正在浏览 <strong>演示账号</strong> 的知识库。注册后开始你自己的知识收集。</span>
      <div className="flex gap-2 text-xs">
        <Link href="/login" className="px-3 py-1 bg-amber-600 text-white rounded hover:bg-amber-700">登录</Link>
        <Link href="/register" className="px-3 py-1 bg-white border border-amber-300 text-amber-800 rounded hover:bg-amber-100">注册</Link>
      </div>
    </div>
  );
}
