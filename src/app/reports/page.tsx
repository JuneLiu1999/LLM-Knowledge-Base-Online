'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ReportListItem {
  id: string;
  date: string;
  createdAt: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [selectedReport, setSelectedReport] = useState<{ date: string; contentMd: string } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    try {
      const resp = await fetch('/api/report');
      const data = await resp.json();
      setReports(data.reports || []);
    } catch {} finally {
      setLoading(false);
    }
  }

  async function viewReport(date: string) {
    const resp = await fetch(`/api/report?date=${date}`);
    const data = await resp.json();
    if (data.contentMd) {
      setSelectedReport({ date, contentMd: data.contentMd });
    }
  }

  async function generateToday() {
    setGenerating(true);
    try {
      const resp = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await resp.json();
      if (data.success) {
        setSelectedReport({ date: data.date, contentMd: data.contentMd });
        loadReports();
      }
    } catch {} finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">日报</h1>
        <button
          onClick={generateToday}
          disabled={generating}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {generating ? '生成中...' : '生成今日日报'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
        {/* Report List */}
        <aside>
          <h3 className="text-sm font-medium text-gray-500 mb-2">历史日报</h3>
          {loading ? (
            <p className="text-gray-400 text-sm">加载中...</p>
          ) : reports.length === 0 ? (
            <p className="text-gray-400 text-sm">暂无日报</p>
          ) : (
            <ul className="space-y-1">
              {reports.map(r => (
                <li key={r.id}>
                  <button
                    onClick={() => viewReport(r.date)}
                    className={`w-full text-left px-3 py-1.5 rounded text-sm hover:bg-gray-100 ${
                      selectedReport?.date === r.date ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    {r.date}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Report Content */}
        <div>
          {selectedReport ? (
            <article className="wiki-content bg-gray-50 rounded-xl p-6">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {selectedReport.contentMd}
              </ReactMarkdown>
            </article>
          ) : (
            <div className="text-gray-400 text-center py-12">
              选择一份日报查看，或生成今日日报
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
