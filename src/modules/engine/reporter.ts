import type { ChatClient } from '@/modules/llm/types';
import type { Storage } from '@/modules/storage/types';
import type { Reporter } from './types';

export class DefaultReporter implements Reporter {
  constructor(
    private storage: Storage,
    private chat: ChatClient,
  ) {}

  async generateDailyReport(date?: string): Promise<string> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const startOfDay = new Date(targetDate + 'T00:00:00Z');
    const endOfDay = new Date(targetDate + 'T23:59:59Z');

    const contributions = await this.storage.contribution.findByDateRange(startOfDay, endOfDay);

    if (contributions.length === 0) {
      return `# 日报 ${targetDate}\n\n今日无新增内容。`;
    }

    const articlesInfo = contributions.map(c => ({
      title: c.rawCapture.title,
      platform: c.rawCapture.sourcePlatform,
      topic: c.wikiTopic.topicPath,
      author: c.rawCapture.author,
    }));

    const topicsAffected = Array.from(new Set(contributions.map(c => c.wikiTopic.topicPath)));

    const prompt = `你是一个知识库日报生成器。根据今天新增的文章信息，生成一份结构化日报。

## 今日新增文章
${JSON.stringify(articlesInfo, null, 2)}

## 影响的主题
${topicsAffected.join('\n')}

## 要求
生成 Markdown 格式日报，包含以下章节：
1. **今日概览**：一句话总结今天的收获
2. **新增内容**：按主题分组列出今天 clip 的文章
3. **主题动态**：哪些主题有新内容、是否出现新趋势
4. **值得关注**：特别有价值或需要深入研究的内容

保持简洁，突出重点。输出纯 Markdown。`;

    const content = await this.chat.complete({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
    });

    const fullReport = `# 日报 ${targetDate}\n\n${content || '日报生成失败'}`;
    await this.storage.report.upsert(targetDate, fullReport);
    return fullReport;
  }
}
