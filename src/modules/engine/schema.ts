import { readFileSync } from 'fs';
import { join } from 'path';
import type { SchemaLoader } from './types';

export class FileSchemaLoader implements SchemaLoader {
  constructor(private path: string = join(process.cwd(), 'vault', 'schema.md')) {}

  load(): string {
    try {
      return readFileSync(this.path, 'utf-8');
    } catch {
      return '# 知识库 Schema\n\n## 顶层主题\n- 未分类';
    }
  }
}
