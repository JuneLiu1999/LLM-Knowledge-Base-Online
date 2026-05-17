import { getStrongClient, getStrongModelName } from '@/lib/llm';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface ClassificationResult {
  topicPath: string;
  action: 'create' | 'append' | 'merge';
  summary: string;
  links: Array<{ targetTopicPath: string; reason: string }>;
  contradictions: Array<{ targetTopicPath: string; note: string }>;
}

function loadSchema(): string {
  try {
    return readFileSync(join(process.cwd(), 'vault', 'schema.md'), 'utf-8');
  } catch {
    return '# 知识库 Schema\n\n## 顶层主题\n- 未分类';
  }
}

export async function classifyContent(
  articleMarkdown: string,
  candidateTopics: Array<{ topic_path: string; content_md: string }>
): Promise<ClassificationResult> {
  const schema = loadSchema();

  const candidatesText = candidateTopics.length > 0
    ? candidateTopics.map(t => `### ${t.topic_path}\n${t.content_md.slice(0, 500)}`).join('\n\n')
    : '（知识库目前为空，没有已有主题）';

  const prompt = `你是一个知识库管理 AI。你的任务是将新文章归类到合适的主题文件夹，并建立与已有主题的双向链接。

## 分类规则（schema.md）
${schema}

## 已有的相关主题（候选）
${candidatesText}

## 新文章内容
${articleMarkdown.slice(0, 4000)}

## 你的任务
根据 schema 和已有主题，输出 JSON 决策：

1. **topicPath**: 这篇文章应归入的主题路径（如 "AI技术/Agent框架/上下文工程"）。最多三层。如果已有主题中有合适的，直接用它的路径；否则新建。
2. **action**:
   - "create": 需要新建一个主题页
   - "append": 追加到已有主题页
   - "merge": 该文章涉及多个已有主题，需要合并讨论
3. **summary**: 用 2-3 句话概括这篇文章的核心内容，作为主题页中的引用描述。
4. **links**: 与哪些已有主题建立双向链接，以及原因。仅在"同一论点的不同证据"或"互为因果/对立"时建链。
5. **contradictions**: 如果新文章与已有主题的结论冲突，标记出来。

只输出 JSON，不要其他文字。`;

  const client = await getStrongClient();
  const modelName = await getStrongModelName();

  const response = await client.chat.completions.create({
    model: modelName,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error('LLM returned empty response');

  return JSON.parse(content) as ClassificationResult;
}
