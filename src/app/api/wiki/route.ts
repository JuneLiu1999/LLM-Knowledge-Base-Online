import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');

  if (path) {
    const topic = await prisma.wikiTopic.findUnique({
      where: { topicPath: path },
      include: {
        linksFrom: { include: { toTopic: { select: { topicPath: true } } } },
        linksTo: { include: { fromTopic: { select: { topicPath: true } } } },
        contradictions: true,
        contributions: {
          include: { rawCapture: { select: { title: true, sourceUrl: true, sourcePlatform: true } } },
          orderBy: { contributedAt: 'desc' },
        },
      },
    });

    if (!topic) {
      return NextResponse.json({ error: '主题不存在' }, { status: 404 });
    }

    const links = [
      ...topic.linksFrom.map(l => ({ path: l.toTopic.topicPath, reason: l.reason })),
      ...topic.linksTo.map(l => ({ path: l.fromTopic.topicPath, reason: l.reason })),
    ];

    return NextResponse.json({
      topicPath: topic.topicPath,
      contentMd: topic.contentMd,
      updatedAt: topic.updatedAt,
      links,
      contradictions: topic.contradictions,
      sources: topic.contributions.map(c => ({
        title: c.rawCapture.title,
        url: c.rawCapture.sourceUrl,
        platform: c.rawCapture.sourcePlatform,
      })),
    });
  }

  const topics = await prisma.wikiTopic.findMany({
    select: { topicPath: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  });

  const tree = buildTree(topics.map(t => t.topicPath));

  return NextResponse.json({ tree, topics });
}

interface TreeNode {
  name: string;
  path: string;
  children: TreeNode[];
  isLeaf: boolean;
}

function buildTree(paths: string[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const path of paths) {
    const parts = path.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const fullPath = parts.slice(0, i + 1).join('/');
      const isLeaf = i === parts.length - 1;

      let node = current.find(n => n.name === name);
      if (!node) {
        node = { name, path: fullPath, children: [], isLeaf };
        current.push(node);
      }
      current = node.children;
    }
  }

  return root;
}
