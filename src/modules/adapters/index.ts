import { BilibiliAdapter } from './bilibili';
import { WechatMPAdapter } from './wechat-mp';
import { XiaohongshuAdapter } from './xiaohongshu';
import type { ContentAdapter, ContentResult, PlatformId } from './types';

export * from './types';
export { BilibiliAdapter } from './bilibili';
export { WechatMPAdapter } from './wechat-mp';
export { XiaohongshuAdapter } from './xiaohongshu';

export class AdapterRegistry {
  constructor(private adapters: ContentAdapter[]) {}

  detect(url: string): PlatformId | null {
    return this.adapters.find(a => a.matches(url))?.platform ?? null;
  }

  async fetch(url: string): Promise<ContentResult> {
    const adapter = this.adapters.find(a => a.matches(url));
    if (!adapter) throw new Error(`不支持的平台链接: ${url}`);
    return adapter.fetch(url);
  }
}

export const adapterRegistry = new AdapterRegistry([
  new BilibiliAdapter(),
  new WechatMPAdapter(),
  new XiaohongshuAdapter(),
]);
