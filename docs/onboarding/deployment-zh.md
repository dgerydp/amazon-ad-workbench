# 部署说明（中文）

## 先说结论

现在 GitHub 仓库已经有了，但“线上可操作网址”还不是自动就有的。

要想让别人通过浏览器直接在线使用，你还需要部署：

- 前端
- 后端
- PostgreSQL
- Redis
- HTTPS 反向代理

## 本地可用和线上可用的区别

### 本地可用

你现在已经可以：

- 本机启动前后端
- 本机上传报表
- 本机跑分析
- 本机导出结果

### 线上可用

你还需要：

- 一个公网服务器或托管平台
- 一个前端域名
- 一个后端 API 域名
- 正式数据库
- 正式 Redis

## 生产环境最小架构

建议最少这样：

- 前端：静态站点
- 后端：FastAPI
- 数据库：PostgreSQL
- 缓存/任务：Redis
- 反向代理：Nginx 或 Caddy

## 一定要改的配置

### 1. 不要再用 SQLite

本地 Demo 可以用 SQLite，但线上必须换 PostgreSQL。

后端环境变量：

```env
DATABASE_URL=postgresql+psycopg2://user:password@host:5432/amazon_ad_workbench
```

### 2. 配置前端 API 地址

前端环境变量：

```env
VITE_API_BASE_URL=https://your-api-domain/api
```

### 3. 配置后端 CORS

后端要允许你的前端域名访问。

### 4. 开启 HTTPS

不要裸奔 HTTP。

## 最简单的部署方案

### 方案 1：单台 VPS

适合你自己先跑一个演示地址。

做法：

- 前端打包后放 Nginx
- 后端用 Uvicorn 跑
- PostgreSQL 和 Redis 放同一台机或托管服务
- 用 Nginx/Caddy 做 HTTPS

### 方案 2：前后端分开托管

比如：

- 前端：Vercel / Netlify
- 后端：Railway / Render / VPS
- 数据库：托管 PostgreSQL
- Redis：托管 Redis

## 生产环境注意事项

- 不要把真实 `API Key` 提交进仓库
- 不要把真实客户报表提交进仓库
- 不要让 Demo 数据在生产环境自动导入
- 不要继续使用默认测试配置
- 最好给后端加日志、监控和备份

## 推送到 GitHub 后你下一步最该做什么

1. 先检查 GitHub 仓库首页 README
2. 再选部署方式
3. 先做一个可访问的测试地址
4. 最后再公开给别人试用

## 如果只是给小白先试用

最实用的方式不是先上复杂生产环境，而是：

1. 先部署一个演示版
2. 保留 `Load Demo Data`
3. 再让用户自己上传 2 份报表

这样最容易跑通第一轮使用体验。
