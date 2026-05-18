'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from './_components/AdminLayout';
import type { DashboardStats } from '@/modules/admin/types';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetch('/api/admin/dashboard').then(r => r.json()).then(d => setStats(d.stats));
  }, []);

  return (
    <AdminShell>
      <h1 className="text-2xl font-semibold mb-6">仪表盘</h1>
      {!stats ? (
        <div className="text-gray-500">加载中…</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="用户总数" value={formatNumber(stats.totalUsers)} />
          <StatCard label="管理员" value={formatNumber(stats.totalAdmins)} />
          <StatCard label="总 Clip 数" value={formatNumber(stats.totalClips)} />
          <StatCard label="总主题数" value={formatNumber(stats.totalTopics)} />
          <StatCard label="总存储" value={formatBytes(stats.totalStorageBytes)} />
          <StatCard label="输入 Token" value={formatNumber(stats.totalTokensInput)} />
          <StatCard label="输出 Token" value={formatNumber(stats.totalTokensOutput)} />
          <StatCard
            label="邀请码"
            value={`${formatNumber(stats.unusedInviteCodes)} / ${formatNumber(stats.totalInviteCodes)}`}
            hint="未用 / 总数"
          />
        </div>
      )}
    </AdminShell>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-5">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {hint && <div className="text-xs text-gray-400 mt-1">{hint}</div>}
    </div>
  );
}
