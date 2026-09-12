# 个人工作台 - Vercel + Supabase 部署指南

## 架构
- **前端**：React + Vite，部署到 Vercel 静态托管
- **后端**：Express + Vercel Serverless Functions
- **数据库**：Supabase PostgreSQL

## 部署步骤

### 第一步：准备 GitHub 仓库

1. 在 GitHub 创建一个新仓库（Public 或 Private 都可以）
2. 把代码推送到仓库：

```bash
git init
git add .
git commit -m "init: personal workbench"
git branch -M main
git remote add origin https://github.com/你的用户名/仓库名.git
git push -u origin main
```

### 第二步：在 Vercel 导入项目

1. 访问 https://vercel.com ，用 GitHub 账号登录（免费）
2. 点击 **Add New... → Project**
3. 找到你刚创建的仓库，点击 **Import**
4. 配置项目：
   - **Framework Preset**: 选择 `Other`（因为我们用了自定义配置）
   - **Build Command**: `npm run build`
   - **Output Directory**: `client/dist`
   - **Install Command**: `npm install`

### 第三步：配置环境变量

在 Vercel 项目设置的 **Environment Variables** 中添加：

| 变量名 | 值 | 环境 |
|--------|-----|------|
| `SUPABASE_URL` | `https://yiohvkrkneamlrzpriyu.supabase.co` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | 你的 service_role key | Production, Preview, Development |

> 注意：service_role key 有数据库完全访问权限，不要分享给他人。

### 第四步：部署

点击 **Deploy** 按钮，等待 1-2 分钟部署完成。

部署成功后，Vercel 会给你一个域名，比如 `your-project.vercel.app`，通过这个域名就可以访问你的工作台了。

### 第五步：（可选）绑定自定义域名

在 Vercel 项目的 **Settings → Domains** 中添加你自己的域名，按提示配置 DNS 即可。

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器（前端+后端）
npm run dev

# 构建生产版本
npm run build
```

## 文件结构

```
├── api/[...all].js        # Vercel Serverless Function (后端 API)
├── client/                 # 前端 React 应用
├── server/                 # 本地后端 (Express + TypeScript)
├── vercel.json             # Vercel 配置
├── package.json            # 根 package
└── .env                    # 本地环境变量 (不提交到 git)
```
