# 个人工作台实施计划

## Summary

为美团闪购运营同学打造一个前后端分离的个人工作台 Web 应用，集日常办公提效、面试准备中心、数据看板、个人知识库四大用途于一体。包含待办/任务管理、快捷入口面板、笔记/备忘录、数据可视化图表四大核心模块。采用 React + Vite + Tailwind CSS 前端 + Express + SQLite 后端，Notion/Linear 简约现代风格。

## 技术栈

| 层级 | 技术选型 | 说明 |
|------|---------|------|
| 前端框架 | React 18 + Vite 5 + TypeScript | 快速热重载，类型安全 |
| 样式方案 | Tailwind CSS 3 | 原子化 CSS，Notion/Linear 风格 |
| 状态管理 | Zustand | 轻量，无样板代码 |
| 路由 | React Router v6 | 客户端路由 |
| 图表 | Recharts | React 原生，轻量易用 |
| 图标 | lucide-react | 现代图标库 |
| 后端 | Express 4 + TypeScript | RESTful API |
| 数据库 | better-sqlite3 | 同步 API，无需异步包装 |
| 请求校验 | Zod | 类型安全的参数校验 |
| 开发工具 | tsx (后端热重载), concurrently (并行启动) | |

## 项目结构

```
workbench/
├── package.json                 # 根 monorepo 配置
├── tsconfig.base.json           # 共享 TS 配置
├── client/                      # React 前端
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── index.html
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src/
│       ├── main.tsx             # 入口
│       ├── App.tsx              # 路由 + 布局
│       ├── index.css            # Tailwind + 全局样式
│       ├── api/                 # API 调用封装
│       │   ├── client.ts        # fetch 封装
│       │   ├── tasks.ts
│       │   ├── notes.ts
│       │   ├── interviews.ts
│       │   ├── links.ts
│       │   ├── knowledge.ts
│       │   └── dashboard.ts
│       ├── store/               # Zustand stores
│       │   ├── useTaskStore.ts
│       │   ├── useNoteStore.ts
│       │   ├── useInterviewStore.ts
│       │   └── useUIStore.ts    # 侧边栏折叠、主题等
│       ├── components/          # 共享组件
│       │   ├── layout/
│       │   │   ├── Sidebar.tsx       # 左侧导航栏
│       │   │   ├── TopBar.tsx        # 顶部栏
│       │   │   └── Layout.tsx        # 整体布局
│       │   ├── ui/                    # 基础 UI 组件
│       │   │   ├── Card.tsx
│       │   │   ├── Button.tsx
│       │   │   ├── Modal.tsx
│       │   │   ├── Badge.tsx
│       │   │   ├── Input.tsx
│       │   │   ├── Select.tsx
│       │   │   ├── EmptyState.tsx
│       │   │   └── ConfirmDialog.tsx
│       │   └── charts/
│       │       ├── BarChartCard.tsx
│       │       ├── LineChartCard.tsx
│       │       └── PieChartCard.tsx
│       └── pages/               # 页面模块
│           ├── Dashboard/       # 首页概览
│           │   └── index.tsx
│           ├── Tasks/           # 待办/任务管理
│           │   ├── index.tsx
│           │   ├── TaskCard.tsx
│           │   └── TaskForm.tsx
│           ├── Interview/       # 面试准备中心
│           │   ├── index.tsx
│           │   ├── CompanyList.tsx
│           │   ├── CompanyDetail.tsx
│           │   └── QuestionBank.tsx
│           ├── Notes/          # 笔记/备忘录
│           │   ├── index.tsx
│           │   └── NoteEditor.tsx
│           ├── Knowledge/       # 个人知识库
│           │   ├── index.tsx
│           │   └── KnowledgeDetail.tsx
│           ├── QuickLinks/     # 快捷入口
│           │   └── index.tsx
│           └── Charts/         # 数据看板
│               └── index.tsx
├── server/                      # Express 后端
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts             # Express 入口
│       ├── db/
│       │   ├── index.ts         # SQLite 初始化
│       │   └── schema.sql       # 建表 SQL
│       ├── routes/
│       │   ├── tasks.ts
│       │   ├── notes.ts
│       │   ├── interviews.ts
│       │   ├── links.ts
│       │   ├── knowledge.ts
│       │   └── dashboard.ts
│       └── middleware/
│           └── error.ts         # 错误处理
└── data/                        # SQLite 数据文件 (gitignore)
    └── workbench.db
```

## 数据库设计

### tasks (待办任务)
```sql
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'work',      -- work | interview | personal | learning
  status TEXT DEFAULT 'pending',      -- pending | in_progress | completed
  priority TEXT DEFAULT 'medium',     -- high | medium | low
  due_date TEXT,                       -- ISO date string
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

### notes (笔记)
```sql
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',            -- Markdown 内容
  tags TEXT DEFAULT '[]',             -- JSON 数组字符串
  pinned INTEGER DEFAULT 0,           -- 置顶标记
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

### interview_companies (面试公司)
```sql
CREATE TABLE IF NOT EXISTS interview_companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  position TEXT DEFAULT '',           -- 岗位名称
  industry TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',      -- pending | scheduled | completed | passed | failed
  interview_date TEXT,                -- 面试时间
  hr_contact TEXT DEFAULT '',
  notes TEXT DEFAULT '',              -- 备注
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

### interview_questions (面试题库)
```sql
CREATE TABLE IF NOT EXISTS interview_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER,                 -- 关联公司，可为空(通用题)
  question TEXT NOT NULL,
  answer TEXT DEFAULT '',             -- 参考答案
  category TEXT DEFAULT 'general',    -- general | behavioral | technical | case
  difficulty TEXT DEFAULT 'medium',   -- easy | medium | hard
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES interview_companies(id) ON DELETE SET NULL
);
```

### quick_links (快捷链接)
```sql
CREATE TABLE IF NOT EXISTS quick_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'work',       -- work | tools | reference | social
  icon TEXT DEFAULT '',               -- 图标名称或 favicon URL
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
```

### knowledge_items (知识条目)
```sql
CREATE TABLE IF NOT EXISTS knowledge_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',            -- Markdown 内容
  source TEXT DEFAULT '',             -- 来源链接
  tags TEXT DEFAULT '[]',             -- JSON 数组字符串
  category TEXT DEFAULT 'general',    -- general | methodology | template | learning
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

## 页面模块详细设计

### 1. Dashboard 首页概览
- **今日待办**: 显示今日到期/未完成的任务，最多5条
- **面试倒计时**: 最近一场面试的倒计时卡片
- **快捷笔记**: 最近3条笔记预览
- **数据概览**: 任务完成率、面试进度、笔记总数等统计数字
- **快捷入口**: 置顶常用链接的横向卡片

### 2. Tasks 待办/任务管理
- 看板视图（三列：待办/进行中/已完成）+ 列表视图切换
- 新建/编辑任务弹窗：标题、描述、分类、优先级、截止日期
- 任务卡片显示：标题、优先级标签、截止日期、分类色块
- 按分类筛选（工作/面试/个人/学习）
- 拖拽改变状态（简单实现：点击切换状态按钮）

### 3. Interview 面试准备中心
- **公司列表**: 卡片展示所有面试公司，按状态分组
- **公司详情**: 点击进入详情页，展示该公司的面试题、备注、时间线
- **题库管理**: 按分类浏览面试题，支持搜索
- **面试状态**: 待面 → 已约 → 已面 → 通过/未通过

### 4. Notes 笔记/备忘录
- 左侧笔记列表 + 右侧编辑器双栏布局
- 支持 Markdown 编辑（使用 textarea + 预览模式切换）
- 标签管理
- 置顶功能
- 搜索笔记

### 5. Knowledge 个人知识库
- 类似笔记的双栏布局
- 按分类（方法论/模板/学习笔记/通用）组织
- 来源链接展示
- 标签筛选

### 6. QuickLinks 快捷入口
- 网格卡片布局
- 按分类分组（工作工具/参考资料/社交/其他）
- 添加/编辑链接弹窗
- 点击直接在新标签页打开
- 显示网站 favicon 图标

### 7. Charts 数据看板
- 预设图表：
  - 任务完成趋势（折线图，近7天/30天）
  - 任务分类分布（饼图）
  - 面试进度统计（柱状图，按公司状态分组）
  - 笔记/知识条目增长趋势（面积图）
- 图表卡片布局，响应式排列

## UI 设计规范

### 色彩系统
```
--color-bg: #fafafa          (主背景)
--color-surface: #ffffff     (卡片背景)
--color-border: #e5e5e5      (边框)
--color-text-primary: #1a1a1a
--color-text-secondary: #737373
--color-text-muted: #a3a3a3
--color-accent: #6366f1      (靛蓝紫，主色)
--color-accent-light: #e0e7ff
--color-success: #22c55e
--color-warning: #f59e0b
--color-danger: #ef4444
```

### 布局
- 左侧固定侧边栏 (240px)，可折叠
- 顶部栏 (56px)：搜索框 + 日期 + 快捷操作
- 主内容区：max-width 1200px，居中
- 卡片圆角：12px，阴影：`shadow-sm`
- 间距：使用 Tailwind 默认间距系统

### 字体
```css
font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro SC', sans-serif;
```

## API 设计

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/dashboard | 获取首页汇总数据 |
| GET/POST/PUT/DELETE | /api/tasks | 任务 CRUD |
| PATCH | /api/tasks/:id/status | 更新任务状态 |
| GET/POST/PUT/DELETE | /api/notes | 笔记 CRUD |
| PATCH | /api/notes/:id/pin | 笔记置顶 |
| GET/POST/PUT/DELETE | /api/interviews/companies | 面试公司 CRUD |
| GET/POST/PUT/DELETE | /api/interviews/questions | 面试题 CRUD |
| GET/POST/PUT/DELETE | /api/links | 快捷链接 CRUD |
| GET/POST/PUT/DELETE | /api/knowledge | 知识条目 CRUD |
| GET | /api/charts/tasks-trend | 任务趋势数据 |
| GET | /api/charts/task-distribution | 任务分布数据 |
| GET | /api/charts/interview-progress | 面试进度数据 |

## 实施步骤

### Step 1: 项目初始化与基础搭建
1. 创建根目录 `package.json`（npm workspaces）
2. 初始化 `client/`：`npm create vite@latest client -- --template react-ts`
3. 初始化 `server/`：Express + TypeScript + tsx
4. 配置 Tailwind CSS（client）
5. 配置 Vite proxy 代理到 Express
6. 配置 `concurrently` 并行启动脚本

### Step 2: 后端搭建
1. SQLite 初始化与 schema.sql 建表
2. 封装 db 模块（better-sqlite3）
3. 实现 6 个路由模块的 CRUD API
4. 实现首页汇总 API
5. 实现图表数据 API
6. 错误处理中间件

### Step 3: 前端基础架构
1. 路由配置（React Router v6）
2. 布局组件（Sidebar + TopBar + Layout）
3. 基础 UI 组件（Card, Button, Modal, Badge, Input, Select, EmptyState）
4. API client 封装（fetch + 错误处理）
5. Zustand store 初始化

### Step 4: 各页面模块实现
按以下顺序逐个实现（每个包含前端页面 + API 对接）：
1. **Tasks** - 待办/任务管理（核心功能先行）
2. **QuickLinks** - 快捷入口（简单，快速见效）
3. **Notes** - 笔记/备忘录
4. **Interview** - 面试准备中心
5. **Knowledge** - 个人知识库
6. **Charts** - 数据看板
7. **Dashboard** - 首页概览（最后实现，汇总各模块数据）

### Step 5: 样式打磨与交互优化
1. 全局样式统一检查
2. 空状态设计
3. 加载状态设计
4. 响应式适配
5. 过渡动画（淡入、滑入）

### Step 6: 预设数据填充
1. 快捷链接预设（美团内部工具、常用网站等）
2. 面试题库预设（通用行为面、运营方法论等）
3. 知识库模板（运营方法论模板、面试复盘模板）

## Assumptions & Decisions

1. **图表库选 Recharts 而非 ECharts**：Recharts 是 React 原生组件，与 React 生态集成更好，包体积更小。数据看板需求不复杂，Recharts 足够。
2. **Markdown 编辑用 textarea + 预览切换**：不引入富文本编辑器（如 TipTap），保持轻量。用户本身熟悉 Markdown。
3. **不引入认证系统**：个人本地使用，无需登录认证。
4. **不做暗色模式**：首期只做浅色模式，降低复杂度。后续可扩展。
5. **任务状态切换用按钮而非拖拽**：拖拽实现复杂度高（需要 dnd-kit），首期用点击按钮切换状态，简单可靠。
6. **预设数据**：根据用户背景（美团闪购运营、面试准备），预设部分面试题和快捷链接，让工作台开箱即用。
7. **不使用 shadcn/ui**：虽然 shadcn/ui 很好，但引入会增加学习成本和配置复杂度。直接用 Tailwind 手写组件更直接可控。

## Verification

1. `npm run dev` 能同时启动前后端，前端在 `localhost:5173`，后端在 `localhost:3000`
2. 访问首页，侧边栏7个模块入口可见且可点击
3. Tasks 模块：能创建、编辑、删除、切换状态任务
4. QuickLinks 模块：能添加、编辑、删除、点击打开链接
5. Notes 模块：能创建、编辑、删除、搜索笔记
6. Interview 模块：能管理公司列表和面试题
7. Knowledge 模块：能管理知识条目
8. Charts 模块：能看到任务趋势、分布、面试进度图表
9. Dashboard 模块：能看到各模块汇总数据
10. 所有数据持久化到 SQLite，刷新后不丢失
