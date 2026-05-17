import type { ContentAdapter, ContentResult } from './types';

interface BiliVideoInfo {
  title: string;
  desc: string;
  owner: { name: string };
  dynamic: string;
  tname: string;
  pic: string;
  pubdate: number;
  stat: { view: number; like: number; coin: number };
  pages: Array<{ cid: number; part: string }>;
  bvid: string;
  aid: number;
}

function extractBVID(url: string): string {
  const match = url.match(/BV[a-zA-Z0-9]+/);
  if (match) return match[0];
  throw new Error(`无法从链接中提取 BVID: ${url}`);
}

async function resolveShortUrl(url: string): Promise<string> {
  if (url.includes('b23.tv')) {
    const resp = await fetch(url, { redirect: 'follow' });
    return resp.url;
  }
  return url;
}

async function getVideoInfo(bvid: string): Promise<BiliVideoInfo> {
  const resp = await fetch(
    `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.bilibili.com',
      },
    }
  );
  const data = await resp.json();
  if (data.code !== 0) throw new Error(`B站 API 错误: ${data.message}`);
  return data.data;
}

async function getSubtitle(bvid: string, cid: number): Promise<string | null> {
  try {
    const resp = await fetch(
      `https://api.bilibili.com/x/player/v2?bvid=${bvid}&cid=${cid}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://www.bilibili.com',
        },
      }
    );
    const data = await resp.json();
    const subtitles = data?.data?.subtitle?.subtitles;
    if (!subtitles || subtitles.length === 0) return null;

    const subUrl = subtitles[0].subtitle_url;
    const fullUrl = subUrl.startsWith('//') ? `https:${subUrl}` : subUrl;
    const subResp = await fetch(fullUrl);
    const subData = await subResp.json();

    return subData.body
      .map((item: { content: string }) => item.content)
      .join(' ');
  } catch {
    return null;
  }
}

export class BilibiliAdapter implements ContentAdapter {
  readonly platform = 'bilibili' as const;

  matches(url: string): boolean {
    return url.includes('bilibili.com') || url.includes('b23.tv');
  }

  async fetch(url: string): Promise<ContentResult> {
    const resolvedUrl = await resolveShortUrl(url);
    const bvid = extractBVID(resolvedUrl);
    const info = await getVideoInfo(bvid);

    let subtitle: string | null = null;
    if (info.pages.length > 0) {
      subtitle = await getSubtitle(bvid, info.pages[0].cid);
    }

    const date = new Date(info.pubdate * 1000).toISOString().split('T')[0];
    const stats = `播放 ${info.stat.view} | 点赞 ${info.stat.like} | 投币 ${info.stat.coin}`;

    let bodyMarkdown = `---
source: bilibili
url: ${resolvedUrl}
author: ${info.owner.name}
date: ${date}
tags: ${info.tname}
---

# ${info.title}

**UP主**: ${info.owner.name}
**分区**: ${info.tname}
**数据**: ${stats}
**发布日期**: ${date}

## 简介

${info.desc || '无简介'}
`;

    if (subtitle) {
      bodyMarkdown += `\n## 字幕内容\n\n${subtitle}\n`;
    }

    return {
      sourcePlatform: 'bilibili',
      sourceUrl: resolvedUrl,
      title: info.title,
      bodyMarkdown,
      author: info.owner.name,
      mediaUrls: [{ type: 'image', url: info.pic }],
      confidence: subtitle ? 'high' : 'medium',
    };
  }
}
