# 快速开始（中文）

## 这个项目适合谁

这个项目适合：

- 想直接分析亚马逊广告搜索词的小团队
- 没有内部 SKU 映射体系的卖家
- 想基于 `sellerSKU` 看广告词表现的人
- 想先用规则分析，后续再接 AI 的用户

这个项目不要求你先准备：

- internal SKU 映射表
- Amazon SP-API
- AI Key
- 领星账号

## 小白怎么启用

最简单的方式就是先跑本地，再点示例数据。

### 第一步：启动后端

```powershell
cd D:\amazon-ad-workbench\backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt -r requirements-dev.txt
uvicorn app.main:app --reload --port 8080
```

启动后端成功后，访问：

- `http://127.0.0.1:8080/health`

如果返回 `{"status":"ok"...}`，说明后端正常。

### 第二步：启动前端

```powershell
cd D:\amazon-ad-workbench\frontend
npm install
npm run dev
```

启动后前端地址通常是：

- `http://127.0.0.1:3000`

## 最快体验路径

### 体验模式

1. 打开首页 `Overview`
2. 点击 `Load Demo Data`
3. 系统会自动导入：
   - 示例店铺
   - 示例 sellerSKU
   - 示例广告报表
   - 一次完整分析结果
4. 再按顺序看：
   - `Reports`
   - `Analysis`
   - `Tags`
   - `Exports`

这条路径最适合第一次看项目，不需要任何外部账号。

## 真实数据怎么用

如果你要分析自己的数据，至少准备 2 份报表：

- `Search Term Report`
- `Advertised Product Report`

然后：

1. 打开 `Reports`
2. 上传搜索词报表
3. 上传投放商品报表
4. 打开 `Analysis`
5. 点击 `Run Analysis`
6. 去 `Tags` 看打标结果
7. 去 `Exports` 下载结果

## 不配 AI 能不能用

可以。

系统内置了 heuristic tagging 和规则引擎，所以即使你不填任何模型 Key，也能得到：

- 高效词
- 待观察词
- 高花费无单词
- 否定词建议
- sellerSKU 汇总

## AI 怎么启用

如果你想启用 AI：

1. 打开 `AI Providers`
2. 选择一个模型提供商
3. 填写 `API Key`
4. 可选填写 `Base URL` 和 `Model`
5. 先点 `Test`
6. 再回到 `Analysis` 勾选 `Enable AI Tagging`

当前支持：

- OpenAI
- Claude
- Gemini
- DeepSeek
- Qwen
- Doubao

## 领星怎么启用

如果你想用领星补充店铺和 sellerSKU：

1. 打开 `Lingxing`
2. 填写：
   - `App ID`
   - `App Secret`
   - `Base URL`
3. 点击 `Test Connection`
4. 再点击：
   - `Sync Shops`
   - `Sync sellerSKU`

## 导出结果在哪里

分析完成后，在 `Exports` 页面可以下载：

- 高效词
- 否定词建议
- sellerSKU 汇总
- 完整 Excel 工作簿

## 常见问题

### 1. 我只上传了一个报表，能分析吗

不建议。这个项目最少要两份报表一起使用：

- Search Term Report
- Advertised Product Report

否则 sellerSKU 归因会不完整。

### 2. 我没有 AI Key，项目是不是没法用

不是。AI 是增强项，不是启动前提。

### 3. 我是不是必须对接领星

不是。领星只是增强数据来源。

### 4. 线上能不能直接访问

代码仓库可以直接访问，但在线操作网址需要你自己部署。

部署说明见：

- [部署说明（中文）](./deployment-zh.md)
