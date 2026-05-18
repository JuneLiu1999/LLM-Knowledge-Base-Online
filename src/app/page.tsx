'use client';

import { useState, useEffect, useRef } from 'react';
import { DemoBanner } from '@/app/_components/DemoBanner';
import type { RawCaptureStatus } from '@/modules/storage/types';

interface TopicNode {
  name: string;
  path: string;
  children: TopicNode[];
  isLeaf: boolean;
}

interface InboxItem {
  id: string;
  title: string;
  sourcePlatform: string;
  sourceUrl: string;
  capturedAt: string;
  status: RawCaptureStatus;
  classifiedAt: string | null;
  classificationError: string | null;
  topicPath: string | null;
}

export default function HomePage() {
  const [url, setUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [items, setItems] = useState<InboxItem[]>([]);
  const [tree, setTree] = useState<TopicNode[]>([]);
  const [isDemo, setIsDemo] = useState(false);
  const [meLoaded, setMeLoaded] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      setLoggedIn(!!d.user);
      setMeLoaded(true);
    });

    const params = new URLSearchParams(window.location.search);
    if (params.get('success')) {
      setMessage({ type: 'success', text: `已添加到收件箱: ${params.get('title') || ''}` });
    } else if (params.get('error')) {
      setMessage({ type: 'error', text: params.get('error') || '未知错误' });
    }
    loadTree();
  }, []);

  useEffect(() => {
    if (!loggedIn) return;
    loadInbox();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [loggedIn]);

  // Poll inbox while any item is in transient state
  useEffect(() => {
    if (!loggedIn) return;
    const hasPending = items.some(i => i.status === 'unclassified' || i.status === 'classifying');
    if (hasPending) {
      if (!pollRef.current) {
        pollRef.current = setInterval(() => {
          loadInbox();
          loadTree();
        }, 3000);
      }
    } else {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }
  }, [items, loggedIn]);

  async function loadInbox() {
    try {
      const resp = await fetch('/api/inbox?limit=50');
      const data = await resp.json();
      setItems(data.items || []);
    } catch {}
  }

  async function loadTree() {
    try {
      const resp = await fetch('/api/wiki');
      const data = await resp.json();
      setTree(data.tree || []);
      setIsDemo(!!data.isDemo);
    } catch {}
  }

  async function handleClip() {
    if (!url.trim()) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const resp = await fetch('/api/clip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await resp.json();
      if (data.success) {
        setUrl('');
        setMessage({ type: 'success', text: `已添加: ${data.data.title}` });
        loadInbox();
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误' });
    } finally {
      setSubmitting(false);
    }
  }

  async function retryItem(id: string) {
    await fetch('/api/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    });
    loadInbox();
  }

  async function classifyAllPending() {
    await fetch('/api/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    loadInbox();
  }

  async function deleteItem(id: string) {
    if (!confirm('确认删除？')) return;
    await fetch(`/api/inbox/${id}`, { method: 'DELETE' });
    loadInbox();
  }

  const pendingCount = items.filter(i => i.status === 'unclassified' || i.status === 'failed').length;

  return (
    <div className="space-y-6">
      {isDemo && !loggedIn && <DemoBanner />}

      {/* Clip Input - 仅登录用户 */}
      {meLoaded && loggedIn && (
        <section className="bg-gray-50 rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-3">添加链接</h2>
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="粘贴 B站/公众号/小红书 链接..."
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              onKeyDown={e => e.key === 'Enter' && handleClip()}
              disabled={submitting}
            />
            <button
              onClick={handleClip}
              disabled={submitting || !url.trim()}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
            >
              {submitting ? '抓取中...' : '添加'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            添加后内容进入收件箱，AI 自动后台分类。{' '}
            <a href="/settings" className="text-blue-600 hover:underline">配置 bookmarklet</a> 可一键收藏。
          </p>
          {message && (
            <div className={`mt-3 p-3 rounded-lg text-sm ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message.text}
            </div>
          )}
        </section>
      )}

      {/* Inbox - 仅登录用户 */}
      {meLoaded && loggedIn && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-600">
              收件箱 {items.length > 0 && <span className="text-gray-400">({items.length})</span>}
            </h3>
            {pendingCount > 0 && (
              <button
                onClick={classifyAllPending}
                className="text-xs px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded"
              >
                分类全部待处理（{pendingCount}）
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="text-gray-400 text-sm">收件箱为空，添加第一个链接吧</p>
          ) : (
            <ul className="space-y-2">
              {items.map(item => (
                <InboxRow key={item.id} item={item} onRetry={retryItem} onDelete={deleteItem} />
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Topic Tree */}
      <section>
        <h3 className="text-sm font-medium text-gray-500 mb-3">
          {isDemo && !loggedIn ? '演示账号知识库' : '知识库'}
        </h3>
        {tree.length === 0 ? (
          <p className="text-gray-400 text-sm">
            {isDemo && !loggedIn ? '演示账号暂无内容' : '知识库为空'}
          </p>
        ) : (
          <TreeView nodes={tree} />
        )}
      </section>
    </div>
  );
}

function InboxRow({ item, onRetry, onDelete }: { item: InboxItem; onRetry: (id: string) => void; onDelete: (id: string) => void }) {
  return (
    <li className="flex items-start gap-3 py-2 px-3 border border-gray-200 rounded-lg">
      <PlatformBadge platform={item.sourcePlatform} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{item.title}</div>
        {item.status === 'classified' && item.topicPath && (
          <a href={`/wiki/${encodeURIComponent(item.topicPath)}`} className="text-xs text-gray-500 hover:text-blue-600 hover:underline">
            → {item.topicPath}
          </a>
        )}
        {item.status === 'failed' && item.classificationError && (
          <div className="text-xs text-red-600 truncate" title={item.classificationError}>
            ✗ {item.classificationError}
          </div>
        )}
      </div>
      <StatusPill status={item.status} />
      <div className="flex items-center gap-1 text-xs">
        {item.status === 'failed' && (
          <button onClick={() => onRetry(item.id)} className="text-blue-600 hover:underline">重试</button>
        )}
        {(item.status === 'unclassified' || item.status === 'failed') && (
          <button onClick={() => onDelete(item.id)} className="text-gray-400 hover:text-red-600">删除</button>
        )}
      </div>
    </li>
  );
}

function StatusPill({ status }: { status: RawCaptureStatus }) {
  const config: Record<RawCaptureStatus, { label: string; color: string }> = {
    unclassified: { label: '待分类', color: 'bg-gray-100 text-gray-600' },
    classifying: { label: '分类中', color: 'bg-blue-100 text-blue-700 animate-pulse' },
    classified: { label: '已分类', color: 'bg-green-100 text-green-700' },
    failed: { label: '失败', color: 'bg-red-100 text-red-700' },
  };
  const { label, color } = config[status];
  return <span className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${color}`}>{label}</span>;
}

function TreeView({ nodes, depth = 0 }: { nodes: TopicNode[]; depth?: number }) {
  return (
    <ul className={`space-y-1 ${depth > 0 ? 'ml-4 border-l border-gray-200 pl-3' : ''}`}>
      {nodes.map(node => (
        <li key={node.path}>
          {node.isLeaf ? (
            <a
              href={`/wiki/${encodeURIComponent(node.path)}`}
              className="flex items-center gap-2 py-1 px-2 rounded hover:bg-gray-100 text-sm"
            >
              <span className="text-gray-400">📄</span>
              <span>{node.name}</span>
            </a>
          ) : (
            <details open={depth < 1}>
              <summary className="flex items-center gap-2 py-1 px-2 rounded hover:bg-gray-100 text-sm cursor-pointer">
                <span className="text-gray-400">📁</span>
                <span className="font-medium">{node.name}</span>
              </summary>
              {node.children.length > 0 && <TreeView nodes={node.children} depth={depth + 1} />}
            </details>
          )}
        </li>
      ))}
    </ul>
  );
}

function PlatformBadge({ platform }: { platform: string }) {
  const config: Record<string, { label: string; color: string }> = {
    bilibili: { label: 'B站', color: 'bg-pink-100 text-pink-700' },
    wechat_mp: { label: '公众号', color: 'bg-green-100 text-green-700' },
    xiaohongshu: { label: '小红书', color: 'bg-red-100 text-red-700' },
  };
  const { label, color } = config[platform] || { label: platform, color: 'bg-gray-100 text-gray-700' };
  return <span className={`px-1.5 py-0.5 rounded text-xs font-medium whitespace-nowrap ${color}`}>{label}</span>;
}
