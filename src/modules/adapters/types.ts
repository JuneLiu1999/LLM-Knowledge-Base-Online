export type PlatformId = 'bilibili' | 'wechat_mp' | 'xiaohongshu';

export interface ContentResult {
  sourcePlatform: PlatformId;
  sourceUrl: string;
  title: string;
  bodyMarkdown: string;
  author: string | null;
  mediaUrls: Array<{ type: string; url: string }>;
  confidence: 'high' | 'medium' | 'low';
}

export interface ContentAdapter {
  readonly platform: PlatformId;
  matches(url: string): boolean;
  fetch(url: string): Promise<ContentResult>;
}
