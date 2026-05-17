import { fetchBilibili } from './bilibili';
import { fetchWechatMP } from './wechat-mp';
import { fetchXiaohongshu } from './xiaohongshu';

export interface AdapterResult {
  sourcePlatform: string;
  sourceUrl: string;
  title: string;
  bodyMarkdown: string;
  author: string | null;
  mediaUrls: Array<{ type: string; url: string }>;
  confidence: 'high' | 'medium' | 'low';
}

export function detectPlatform(url: string): string | null {
  if (url.includes('bilibili.com') || url.includes('b23.tv')) return 'bilibili';
  if (url.includes('mp.weixin.qq.com')) return 'wechat_mp';
  if (url.includes('xiaohongshu.com') || url.includes('xhslink.com')) return 'xiaohongshu';
  return null;
}

export async function fetchContent(url: string): Promise<AdapterResult> {
  const platform = detectPlatform(url);

  if (!platform) {
    throw new Error(`不支持的平台链接: ${url}`);
  }

  switch (platform) {
    case 'bilibili':
      return fetchBilibili(url);
    case 'wechat_mp':
      return fetchWechatMP(url);
    case 'xiaohongshu':
      return fetchXiaohongshu(url);
    default:
      throw new Error(`未实现的平台: ${platform}`);
  }
}
