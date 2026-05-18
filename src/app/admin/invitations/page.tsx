'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '../_components/AdminLayout';
import type { InviteCodeWithUser } from '@/modules/invitation/types';

export default function AdminInvitationsPage() {
  const [codes, setCodes] = useState<InviteCodeWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(1);
  const [expiresInDays, setExpiresInDays] = useState<string>('');

  async function load() {
    setLoading(true);
    const data = await fetch('/api/admin/invitations').then(r => r.json());
    setCodes(data.codes || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function generate() {
    const body: { count: number; expiresInDays?: number } = { count };
    if (expiresInDays) body.expiresInDays = Number(expiresInDays);
    await fetch('/api/admin/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    await load();
  }

  async function revoke(code: string) {
    if (!confirm(`确认撤销邀请码 ${code}？`)) return;
    const res = await fetch(`/api/admin/invitations/${encodeURIComponent(code)}`, { method: 'DELETE' });
    if (!res.ok) {
      const d = await res.json();
      alert(d.error || '撤销失败');
      return;
    }
    await load();
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  return (
    <AdminShell>
      <h1 className="text-2xl font-semibold mb-6">邀请码管理</h1>

      <div className="bg-white rounded-lg shadow p-5 mb-6">
        <h2 className="text-sm font-medium mb-3">生成邀请码</h2>
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="block text-xs text-gray-500 mb-1">数量</label>
            <input
              type="number"
              min={1}
              max={20}
              value={count}
              onChange={e => setCount(Math.min(20, Math.max(1, Number(e.target.value))))}
              className="px-3 py-2 border rounded w-24"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">过期天数（空 = 永久）</label>
            <input
              type="number"
              min={1}
              value={expiresInDays}
              onChange={e => setExpiresInDays(e.target.value)}
              placeholder="永久"
              className="px-3 py-2 border rounded w-32"
            />
          </div>
          <button
            onClick={generate}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            生成
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-500">加载中…</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-600">
                <th className="px-4 py-3">邀请码</th>
                <th className="px-4 py-3">状态</th>
                <th className="px-4 py-3">使用者</th>
                <th className="px-4 py-3">生成时间</th>
                <th className="px-4 py-3">过期</th>
                <th className="px-4 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {codes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                    暂无邀请码
                  </td>
                </tr>
              ) : (
                codes.map(c => {
                  const expired = c.expiresAt && new Date(c.expiresAt) < new Date();
                  const used = !!c.usedBy;
                  return (
                    <tr key={c.code} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono">{c.code}</td>
                      <td className="px-4 py-3">
                        {used ? (
                          <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded">已使用</span>
                        ) : expired ? (
                          <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded">已过期</span>
                        ) : (
                          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">可用</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{c.usedByUsername || '-'}</td>
                      <td className="px-4 py-3 text-gray-500">{new Date(c.createdAt).toLocaleString('zh-CN')}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {c.expiresAt ? new Date(c.expiresAt).toLocaleString('zh-CN') : '永久'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!used && (
                          <>
                            <button
                              onClick={() => copyToClipboard(c.code)}
                              className="text-blue-600 hover:underline mr-3"
                            >
                              复制
                            </button>
                            <button
                              onClick={() => revoke(c.code)}
                              className="text-red-600 hover:underline"
                            >
                              撤销
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
