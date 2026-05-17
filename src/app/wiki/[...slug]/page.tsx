'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface TopicData {
  topicPath: string;
  contentMd: string;
  updatedAt: string;
  links: Array<{ path: string; reason: string }>;
  contradictions: Array<{ note: string; resolved: boolean }>;
  sources: Array<{ title: string; url: string; platform: string }>;
}

export default function WikiPage() {
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug.map(decodeURIComponent).join('/') : '';
  const [topic, setTopic] = useState<TopicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/wiki?path=${encodeURIComponent(slug)}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setTopic(data);
      })
      .catch(() => setError('加载失败'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="text-gray-400 py-8 text-center">加载中...</div>;
  if (error) return <div className="text-red-500 py-8 text-center">{error}</div>;
  if (!topic) return null;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500">
        <a href="/" className="hover:text-blue-600">首页</a>
        {topic.topicPath.split('/').map((part, i, arr) => (
          <span key={i}>
            <span className="mx-1">/</span>
            {i === arr.length - 1 ? (
              <span className="text-gray-800 font-medium">{part}</span>
            ) : (
              <a href={`/wiki/${encodeURIComponent(arr.slice(0, i + 1).join('/'))}`} className="hover:text-blue-600">
                {part}
              </a>
            )}
          </span>
        ))}
      </nav>

      {/* Content */}
      <article className="wiki-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {topic.contentMd}
        </ReactMarkdown>
      </article>

      {/* Links */}
      {topic.links.length > 0 && (
        <section className="border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-500 mb-2">🔗 关联主题</h3>
          <ul className="space-y-1">
            {topic.links.map((link, i) => (
              <li key={i}>
                <a href={`/wiki/${encodeURIComponent(link.path)}`} className="text-blue-600 text-sm hover:underline">
                  {link.path}
                </a>
                <span className="text-gray-400 text-xs ml-2">— {link.reason}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Contradictions */}
      {topic.contradictions.filter(c => !c.resolved).length > 0 && (
        <section className="border-t pt-4">
          <h3 className="text-sm font-semibold text-yellow-600 mb-2">⚠️ 待澄清</h3>
          <ul className="space-y-1">
            {topic.contradictions.filter(c => !c.resolved).map((c, i) => (
              <li key={i} className="text-sm text-yellow-700 bg-yellow-50 p-2 rounded">{c.note}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Sources */}
      {topic.sources.length > 0 && (
        <section className="border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-500 mb-2">📎 原始来源</h3>
          <ul className="space-y-1">
            {topic.sources.map((s, i) => (
              <li key={i} className="text-sm">
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {s.title}
                </a>
                <span className="text-gray-400 text-xs ml-2">[{s.platform}]</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Meta */}
      <footer className="text-xs text-gray-400 border-t pt-3">
        最后更新: {new Date(topic.updatedAt).toLocaleString('zh-CN')}
      </footer>
    </div>
  );
}
