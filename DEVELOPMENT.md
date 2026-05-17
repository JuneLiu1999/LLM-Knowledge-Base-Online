# 开发文档

LLM Knowledge Base —— 个人知识库 Web Clipper，支持从 B站 / 微信公众号 / 小红书抓取内容，AI 自动归类到多层主题文件夹并建立双向链接，每日生成日报。

最后更新：2026-05-17

---

## 1. 部署拓扑

```
本地开发                GitHub                 VPS (Tencent Cloud)
─────────              ─────────              ──────────────────────────
worktree     ──push─►  main 分支     ──pull─► ~/LLM-Knowledge-Base-Online
                                                  │
                                                  ▼
                                              Docker 容器 (port 3001)
                                                  │
                                                  ▼
                                              Nginx (port 443, SSL)
                                                  │
                                                  ▼
                                              https://read.aigameplay.cn
```

| 资源 | 位置 |
|---|---|
| 本地仓库 | `/Users/liujiyu/AI Project/LLM Knowledge Base` |
| GitHub | https://github.com/JuneLiu1999/LLM-Knowledge-Base-Online |
| VPS | `agentuser@81.70.175.73` |
| 服务器项目目录 | `~/LLM-Knowledge-Base-Online` |
| 域名 | https://read.aigameplay.cn |
| 数据库 | 宿主机 PostgreSQL（容器通过 `host.docker.internal` 连接） |
| SSL | Let's Encrypt（certbot 自动续期） |

---

## 2. 修改 → 部署工作流

每次改动严格按此流程：

### 步骤 1：本地修改
在工作区里改代码。

### 步骤 2：本地确认
```bash
npx tsc --noEmit          # 类型检查
npx next build            # 构建验证
# UI 改动：npm run dev 本地浏览器验证
```

### 步骤 3：推送 GitHub
```bash
git add -A
git commit -m "..."
git push -u origin <branch>
# 直接推 main 会被拦截 → 走 PR 流程：
gh pr create --base main --head <branch> --title "..." --body "..."
gh pr merge <#> --merge --delete-branch    # 需用户授权
```

### 步骤 4：部署 VPS
- **代码变更**（`src/`、`prisma/`、`Dockerfile`、`docker-compose.yml`、`package.json` 等）：
  ```bash
  ssh agentuser@81.70.175.73 'cd ~/LLM-Knowledge-Base-Online && git pull && docker compose up -d --build'
  ```
- **仅文档变更**（`*.md`）：因为 `.dockerignore` 排除了 md，**不需要** rebuild：
  ```bash
  ssh agentuser@81.70.175.73 'cd ~/LLM-Knowledge-Base-Online && git pull'
  ```

### 步骤 5：验证
```bash
curl -sI https://read.aigameplay.cn        # 期待 HTTP 200
ssh agentuser@81.70.175.73 'docker ps'     # 容器 Up
```

---

## 3. 项目结构

```
src/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # 首页：链接输入 + 最近 clipped
│   ├── wiki/                     # 主题树 + 详情
│   ├── reports/                  # 日报列表
│   ├── settings/                 # LLM API key 设置
│   ├── api/
│   │   ├── clip/                 # POST: 接收 URL → ingest
│   │   ├── share-target/         # PWA Share Target 接收
│   │   ├── wiki/                 # GET 主题树/详情
│   │   ├── report/               # GET/POST 日报
│   │   └── settings/             # GET/PUT 设置
│   ├── layout.tsx
│   └── globals.css
└── modules/                      # 业务模块（接口隔离）
    ├── settings/                 # 加密 KV 存储
    │   ├── types.ts              # SettingsService 接口
    │   ├── crypto.ts             # AES-256-GCM
    │   ├── service.ts            # PrismaSettingsService
    │   └── index.ts              # 默认实例 settingsService
    ├── storage/                  # Prisma 仓库
    │   ├── types.ts              # 6 个 Repository 接口
    │   ├── client.ts             # Prisma singleton
    │   ├── repositories.ts       # Prisma*Repository
    │   └── index.ts              # 默认实例 storage
    ├── llm/                      # LLM 客户端抽象
    │   ├── types.ts              # ChatClient + EmbeddingClient 接口
    │   ├── openai.ts             # OpenAI 兼容实现
    │   └── index.ts              # SettingsBackedLLMProvider（懒加载 + 60s 缓存）
    ├── adapters/                 # 平台抓取器
    │   ├── types.ts              # ContentAdapter 接口
    │   ├── bilibili.ts           # BilibiliAdapter
    │   ├── wechat-mp.ts          # WechatMPAdapter
    │   ├── xiaohongshu.ts        # XiaohongshuAdapter (Puppeteer)
    │   └── index.ts              # AdapterRegistry
    └── engine/                   # 业务逻辑（只依赖接口）
        ├── types.ts              # IngestPipeline/Classifier/Embedder/Reporter 接口
        ├── embedder.ts           # LLMEmbedder
        ├── classifier.ts         # LLMClassifier（调用强模型）
        ├── ingest.ts             # DefaultIngestPipeline（完整流水线）
        ├── reporter.ts           # DefaultReporter（日报）
        ├── schema.ts             # FileSchemaLoader（读 vault/schema.md）
        └── index.ts              # 默认装配（embedder/classifier/ingestPipeline/reporter）

prisma/
└── schema.prisma                 # 数据模型：RawCapture, WikiTopic, Contribution, TopicLink, Contradiction, DailyReport, Setting

vault/
└── schema.md                     # 用户手动维护的分类规则（喂给 classifier）

public/
├── manifest.json                 # PWA manifest (share_target)
└── sw.js                         # Service Worker

Dockerfile                        # 多阶段构建：base (chromium + 清华镜像) → deps (npmmirror) → builder → runner
docker-compose.yml                # 单容器，连接宿主机 Postgres
.dockerignore                     # 排除 node_modules, .next, .git, *.md (vault/schema.md 例外)
```

---

## 4. 模块架构（接口隔离）

```
app/api/*                                  ← 只 import 模块的 index.ts
   │
   ├──► adapters (ContentAdapter)          ← 平台抓取
   │
   └──► engine (IngestPipeline / Reporter) ← 业务逻辑
              │
              ├──► llm (ChatClient / EmbeddingClient)
              │       │
              │       └──► settings (SettingsService)
              │              │
              │              └──► storage (PrismaClient)
              │
              └──► storage (Storage = 6 个 Repository)
```

**核心原则：**
- 每个模块的对外接口在该模块的 `types.ts`
- 实现类（`Prisma*`、`OpenAI*`、`LLM*`、`Default*`）通过模块 `index.ts` 装配出默认实例并导出
- API 路由只 import `index.ts` 的导出（`storage`、`llm`、`adapterRegistry`、`ingestPipeline`、`reporter`、`settingsService`），不 import 具体实现
- 写单元测试时，可以用内存假对象替换接口

**定位问题：**

| 症状 | 看这里 |
|---|---|
| 抓取失败 | `src/modules/adapters/<platform>.ts` |
| 分类不准 | `src/modules/engine/classifier.ts` + `vault/schema.md` |
| 嵌入向量问题 | `src/modules/engine/embedder.ts` + `src/modules/llm/openai.ts` |
| 数据库错误 | `src/modules/storage/repositories.ts` + `prisma/schema.prisma` |
| 日报内容空 | `src/modules/engine/reporter.ts` |
| 设置保存失败 | `src/modules/settings/service.ts` + `crypto.ts` |
| LLM 调用 401 | `src/app/settings` 页面检查 key 配置 |

---

## 5. Ingest Pipeline 流程

```
URL 输入
  │
  ▼
adapterRegistry.detect(url)        → 检测平台
  │
  ▼
adapterRegistry.fetch(url)         → ContentResult { title, bodyMarkdown, ... }
  │
  ▼
ingestPipeline.ingest(content)
  ├─ storage.raw.create()                          → 保存原始 MD
  ├─ embedder.embed(bodyMarkdown)                  → 生成 1536 维向量
  ├─ storage.topic.findSimilar(embedding, 5)       → pgvector 检索 Top-5
  ├─ classifier.classify(md, candidates)           → LLM 决策：topicPath / action / links / contradictions
  ├─ applyClassification()                         → create 或 append 主题页
  ├─ storage.contribution.create()                 → 记录贡献
  ├─ storage.link.create() ×N                      → 建双链
  └─ storage.contradiction.create() ×N             → 标记冲突
```

---

## 6. 数据模型

| 表 | 用途 |
|---|---|
| `raw_captures` | 原始抓取的文章 MD（永久保留） |
| `wiki_topics` | 主题页（contentMd + 1536 维 embedding） |
| `contributions` | 文章 ↔ 主题的贡献关系（日报数据源） |
| `topic_links` | 主题间双向链接（reason 字段记录关系） |
| `contradictions` | 标记冲突论点（待人工解决） |
| `daily_reports` | 每日日报（按 date 唯一） |
| `settings` | 加密 KV 存储（LLM API key 等） |

---

## 7. LLM 配置

通过 https://read.aigameplay.cn/settings 页面管理，分三档：

| 档位 | 用途 | 推荐模型 |
|---|---|---|
| Cheap | （目前未直接调用，预留给简单任务） | deepseek-chat |
| Strong | 分类决策 + 日报生成 | kimi-k2 / deepseek-v3 |
| Embedding | 文章 + 主题向量化 | bge-m3 / text-embedding-3-small |

- API key 用 AES-256-GCM 加密（密钥来自 `ENCRYPTION_SECRET` 环境变量 + scrypt 派生）
- 页面只显示遮罩值（`sk-***xxxx`）
- 配置变更后下次请求时（最多 60 秒）自动生效（`llm.invalidate()`）

---

## 8. PWA / Share Target

- `public/manifest.json` 声明 `share_target: /api/share-target`
- 安卓用户打开 https://read.aigameplay.cn → 加到主屏幕 → 任意 App 分享链接 → 选 KClip → 自动 ingest
- iOS 不支持 Share Target（限制）

---

## 9. 常用命令速查

### 本地
```bash
cd "/Users/liujiyu/AI Project/LLM Knowledge Base"
npm run dev                       # 开发服
npx tsc --noEmit                  # 类型检查
npx next build                    # 生产构建
npx prisma migrate dev            # 创建迁移
npx prisma studio                 # 数据库 GUI
```

### 服务器
```bash
ssh agentuser@81.70.175.73
cd ~/LLM-Knowledge-Base-Online
git pull
docker compose up -d --build      # 代码改动后重建
docker compose logs -f --tail=100 # 查日志
docker compose restart            # 仅重启不重建
docker ps                         # 容器状态
```

### 数据库（在 VPS 上）
```bash
psql -U <user> -d knowledge_clipper      # 连接
# 容器内连宿主机用 host.docker.internal
```

---

## 10. 已知约束

- **微信公众号链接有时效**：收到分享后立即抓取，避免链接失效
- **小红书需 Puppeteer**：容器内已安装 chromium，但抓取速度慢（10-30s）
- **iOS 不支持 PWA Share Target**：iOS 用户只能手动复制链接到首页
- **中国大陆 Docker Hub 不通**：`Dockerfile` 已用清华 apt 镜像 + npmmirror；如果服务器换镜像源失效要更新 Dockerfile
- **直接推 main 被拦**：必须走 `gh pr create` + 用户授权合并
