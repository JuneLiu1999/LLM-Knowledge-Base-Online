'use client';

import { useState, useEffect } from 'react';
import { DemoBanner } from '@/app/_components/DemoBanner';

interface TopicNode {
  name: string;
  path: string;
  children: TopicNode[];
  isLeaf: boolean;
}

export default function HomePage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [tree, setTree] = useState<TopicNode[]>([]);
  const [recentClips, setRecentClips] = useState<Array<{ title: string; platform: string; topicPath: string }>>([]);
  const [isDemo, setIsDemo] = useState(false);
  const [meLoaded, setMeLoaded] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      setLoggedIn(!!d.user);
      setMeLoaded(true);
    });

    const params = new URLSearchParams(window.location.search);
    if (params.get('success')) {
      setMessage({ type: 'success', text: `已保存: ${params.get('title') || ''}` });
    } else if (params.get('error')) {
      setMessage({ type: 'error', text: params.get('error') || '未知错误' });
    }
    loadTree();
  }, []);

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
    setLoading(true);
    setMessage(null);

    try {
      const resp = await fetch('/api/clip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await resp.json();

      if (data.success) {
        setMessage({ type: 'success', text: `已保存「${data.data.title}」→ ${data.data.topicPath}` });
        setRecentClips(prev => [{ title: data.data.title, platform: data.data.platform, topicPath: data.data.topicPath }, ...prev].slice(0, 5));
        setUrl('');
        loadTree();
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误，请重试' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {isDemo && !loggedIn && <DemoBanner />}

      {/* Clip Input - 仅登录用户可见 */}
      {meLoaded && loggedIn && (
        <section className="bg-gray-50 rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-3">添加内容</h2>
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="粘贴 B站/公众号/小红书 链接..."
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              onKeyDown={e => e.key === 'Enter' && handleClip()}
              disabled={loading}
            />
            <button
              onClick={handleClip}
              disabled={loading || !url.trim()}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {loading ? '处理中...' : '收藏'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            支持：bilibili.com • mp.weixin.qq.com • xiaohongshu.com
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

      {/* Recent Clips */}
      {recentClips.length > 0 && (
        <section>
          <h3 className="text-sm font-medium text-gray-500 mb-2">最近收藏</h3>
          <div className="space-y-2">
            {recentClips.map((clip, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <PlatformBadge platform={clip.platform} />
                <span className="truncate">{clip.title}</span>
                <span className="text-gray-400 text-xs ml-auto whitespace-nowrap">→ {clip.topicPath}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Topic Tree */}
      <section>
        <h3 className="text-sm font-medium text-gray-500 mb-3">
          {isDemo && !loggedIn ? '演示账号知识库' : '知识库'}
        </h3>
        {tree.length === 0 ? (
          <p className="text-gray-400 text-sm">
            {isDemo && !loggedIn ? '演示账号暂无内容' : '知识库为空，开始收藏第一篇内容吧'}
          </p>
        ) : (
          <TreeView nodes={tree} />
        )}
      </section>
    </div>
  );
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
  return <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${color}`}>{label}</span>;
}
