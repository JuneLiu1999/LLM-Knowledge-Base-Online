'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '../_components/AdminLayout';
import type { UserWithUsage } from '@/modules/admin/types';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserWithUsage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(d => setUsers(d.users || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminShell>
      <h1 className="text-2xl font-semibold mb-6">用户列表</h1>
      {loading ? (
        <div className="text-gray-500">加载中…</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-600">
                <th className="px-4 py-3">用户名</th>
                <th className="px-4 py-3">Clip 数</th>
                <th className="px-4 py-3">主题数</th>
                <th className="px-4 py-3">存储</th>
                <th className="px-4 py-3">输入 Token</th>
                <th className="px-4 py-3">输出 Token</th>
                <th className="px-4 py-3">邀请码</th>
                <th className="px-4 py-3">注册时间</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-gray-400">
                    暂无用户
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{u.username}</td>
                    <td className="px-4 py-3">{u.clipCount}</td>
                    <td className="px-4 py-3">{u.topicCount}</td>
                    <td className="px-4 py-3">{formatBytes(u.storageBytes)}</td>
                    <td className="px-4 py-3 text-gray-600">{u.tokensInput.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-600">{u.tokensOutput.toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{u.invitedByCode || '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(u.createdAt).toLocaleString('zh-CN')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
