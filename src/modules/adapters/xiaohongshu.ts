import puppeteer from 'puppeteer';
import type { ContentAdapter, ContentResult } from './types';

async function resolveShortUrl(url: string): Promise<string> {
  if (url.includes('xhslink.com')) {
    const resp = await fetch(url, { redirect: 'follow' });
    return resp.url;
  }
  return url;
}

export class XiaohongshuAdapter implements ContentAdapter {
  readonly platform = 'xiaohongshu' as const;

  matches(url: string): boolean {
    return url.includes('xiaohongshu.com') || url.includes('xhslink.com');
  }

  async fetch(url: string): Promise<ContentResult> {
    const resolvedUrl = await resolveShortUrl(url);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();

      await page.setUserAgent(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
      );

      await page.setViewport({ width: 390, height: 844 });
      await page.goto(resolvedUrl, { waitUntil: 'networkidle2', timeout: 30000 });

      await page.waitForSelector('[class*="note-content"], [class*="content"], #detail-desc', {
        timeout: 10000,
      }).catch(() => {});

      const data = await page.evaluate(() => {
        const titleEl = document.querySelector(
          '[class*="title"], h1, [class*="note-title"]'
        );
        const title = titleEl?.textContent?.trim() || '';

        const contentEl = document.querySelector(
          '[class*="note-content"], [class*="desc"], #detail-desc, [class*="content"]'
        );
        const content = contentEl?.textContent?.trim() || '';

        const authorEl = document.querySelector(
          '[class*="author"], [class*="nickname"], [class*="user-name"]'
        );
        const author = authorEl?.textContent?.trim() || null;

        const tagEls = document.querySelectorAll('[class*="tag"], a[href*="tag"]');
        const tags = Array.from(tagEls)
          .map(el => el.textContent?.trim())
          .filter(Boolean)
          .slice(0, 10);

        const imgEls = document.querySelectorAll(
          '[class*="slide"] img, [class*="carousel"] img, [class*="image"] img'
        );
        const images = Array.from(imgEls)
          .map(el => (el as HTMLImageElement).src)
          .filter(src => src && !src.includes('avatar'));

        return { title, content, author, tags, images };
      });

      const date = new Date().toISOString().split('T')[0];
      const tagsText = data.tags.length > 0 ? data.tags.join(', ') : '';

      const bodyMarkdown = `---
source: xiaohongshu
url: ${resolvedUrl}
author: ${data.author || '未知'}
date: ${date}
tags: ${tagsText}
---

# ${data.title || '小红书笔记'}

**作者**: ${data.author || '未知'}
**日期**: ${date}
${tagsText ? `**标签**: ${tagsText}` : ''}

## 正文

${data.content || '（内容提取失败，可能需要登录或图片 OCR）'}

${data.images.length > 0 ? `## 图片\n\n${data.images.map((img, i) => `![图${i + 1}](${img})`).join('\n\n')}` : ''}
`;

      return {
        sourcePlatform: 'xiaohongshu',
        sourceUrl: resolvedUrl,
        title: data.title || '小红书笔记',
        bodyMarkdown,
        author: data.author,
        mediaUrls: data.images.map(url => ({ type: 'image', url })),
        confidence: data.content.length > 50 ? 'medium' : 'low',
      };
    } finally {
      await browser.close();
    }
  }
}
