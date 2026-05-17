import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import { AdapterResult } from './index';

export async function fetchWechatMP(url: string): Promise<AdapterResult> {
  const resp = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });

  if (!resp.ok) {
    throw new Error(`微信公众号文章抓取失败: HTTP ${resp.status}`);
  }

  const html = await resp.text();
  const $ = cheerio.load(html);

  const title = $('#activity-name').text().trim() ||
    $('meta[property="og:title"]').attr('content') || '未知标题';

  const author = $('#js_name').text().trim() ||
    $('meta[property="og:article:author"]').attr('content') || null;

  const publishTime = $('#publish_time').text().trim() ||
    $('meta[property="article:published_time"]').attr('content') || '';

  const contentEl = $('#js_content');
  const bodyHtml = contentEl.html() || '';
  const bodyText = htmlToMarkdown($, contentEl);

  const images: Array<{ type: string; url: string }> = [];
  contentEl.find('img').each((_, el) => {
    const src = $(el).attr('data-src') || $(el).attr('src');
    if (src) images.push({ type: 'image', url: src });
  });

  const date = publishTime || new Date().toISOString().split('T')[0];

  const bodyMarkdown = `---
source: wechat_mp
url: ${url}
author: ${author || '未知'}
date: ${date}
---

# ${title}

**公众号**: ${author || '未知'}
**发布时间**: ${date}

## 正文

${bodyText}
`;

  return {
    sourcePlatform: 'wechat_mp',
    sourceUrl: url,
    title,
    bodyMarkdown,
    author,
    mediaUrls: images.slice(0, 10),
    confidence: bodyText.length > 100 ? 'high' : 'low',
  };
}

function htmlToMarkdown($: cheerio.CheerioAPI, el: cheerio.Cheerio<AnyNode>): string {
  let md = '';

  el.children().each((_, child) => {
    const node = $(child);
    const tag = child.type === 'tag' ? (child as unknown as { tagName: string }).tagName : '';

    if (tag === 'h1' || tag === 'h2' || tag === 'h3') {
      const level = parseInt(tag[1]);
      md += `${'#'.repeat(level + 1)} ${node.text().trim()}\n\n`;
    } else if (tag === 'p' || tag === 'section') {
      const text = node.text().trim();
      if (text) md += `${text}\n\n`;
    } else if (tag === 'ul' || tag === 'ol') {
      node.find('li').each((i, li) => {
        const prefix = tag === 'ol' ? `${i + 1}. ` : '- ';
        md += `${prefix}${$(li).text().trim()}\n`;
      });
      md += '\n';
    } else if (tag === 'blockquote') {
      const text = node.text().trim();
      if (text) md += `> ${text.replace(/\n/g, '\n> ')}\n\n`;
    } else if (tag === 'pre' || tag === 'code') {
      md += `\`\`\`\n${node.text().trim()}\n\`\`\`\n\n`;
    } else if (tag === 'img') {
      const src = node.attr('data-src') || node.attr('src');
      if (src) md += `![image](${src})\n\n`;
    } else {
      const text = node.text().trim();
      if (text) md += `${text}\n\n`;
    }
  });

  return md.trim() || el.text().trim();
}
