import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/modules/storage';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');

  if (path) {
    const topic = await storage.topic.findByPathWithRelations(path);
    if (!topic) {
      return NextResponse.json({ error: '主题不存在' }, { status: 404 });
    }

    return NextResponse.json({
      topicPath: topic.topicPath,
      contentMd: topic.contentMd,
      updatedAt: topic.updatedAt,
      links: topic.links,
      contradictions: topic.contradictions,
      sources: topic.sources,
    });
  }

  const topics = await storage.topic.listAll();
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
