'use client';

import { useState, useEffect } from 'react';
import { DemoBanner } from '@/app/_components/DemoBanner';

interface TopicInfo {
  topicPath: string;
  updatedAt: string;
}

interface TopicNode {
  name: string;
  path: string;
  children: TopicNode[];
  isLeaf: boolean;
}

export default function WikiIndexPage() {
  const [tree, setTree] = useState<TopicNode[]>([]);
  const [topics, setTopics] = useState<TopicInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setLoggedIn(!!d.user));
    fetch('/api/wiki')
      .then(r => r.json())
      .then(data => {
        setTree(data.tree || []);
        setTopics(data.topics || []);
        setIsDemo(!!data.isDemo);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-400 py-8 text-center">加载中...</div>;

  return (
    <div className="space-y-6">
      {isDemo && !loggedIn && <DemoBanner />}
      <h1 className="text-xl font-bold">{isDemo && !loggedIn ? '演示账号知识库' : '知识库'}</h1>

      {tree.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">📚</p>
          <p>知识库为空</p>
          <p className="text-sm mt-1">
            <a href="/" className="text-blue-600 hover:underline">去首页收藏第一篇内容</a>
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <FullTreeView nodes={tree} />

          <section className="border-t pt-4 mt-6">
            <h3 className="text-sm font-medium text-gray-500 mb-3">最近更新</h3>
            <ul className="space-y-2">
              {topics.slice(0, 10).map(t => (
                <li key={t.topicPath} className="flex items-center justify-between text-sm">
                  <a href={`/wiki/${encodeURIComponent(t.topicPath)}`} className="text-blue-600 hover:underline truncate">
                    {t.topicPath}
                  </a>
                  <span className="text-gray-400 text-xs whitespace-nowrap ml-2">
                    {new Date(t.updatedAt).toLocaleDateString('zh-CN')}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}

function FullTreeView({ nodes, depth = 0 }: { nodes: TopicNode[]; depth?: number }) {
  return (
    <ul className={`space-y-1 ${depth > 0 ? 'ml-4 border-l border-gray-200 pl-3' : ''}`}>
      {nodes.map(node => (
        <li key={node.path}>
          {node.isLeaf ? (
            <a
              href={`/wiki/${encodeURIComponent(node.path)}`}
              className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-gray-100 text-sm"
            >
              <span>📄</span>
              <span>{node.name}</span>
            </a>
          ) : (
            <details open>
              <summary className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-gray-100 text-sm cursor-pointer">
                <span>📁</span>
                <span className="font-medium">{node.name}</span>
                <span className="text-gray-400 text-xs">({countLeaves(node)})</span>
              </summary>
              {node.children.length > 0 && <FullTreeView nodes={node.children} depth={depth + 1} />}
            </details>
          )}
        </li>
      ))}
    </ul>
  );
}

function countLeaves(node: TopicNode): number {
  if (node.isLeaf) return 1;
  return node.children.reduce((sum, child) => sum + countLeaves(child), 0);
}
