# 快速开始（中文）

## 开始前先做什么

先把仓库拉到本地：

```bash
git clone https://github.com/dongerydp/amazon-ad-workbench.git
cd amazon-ad-workbench
```

如果你不用 Git，也可以直接在 GitHub 页面下载 ZIP，然后解压到本地。

## 小白最简单的启用方式

最简单的流程就是：

1. 启动后端
2. 启动前端
3. 打开页面
4. 点击 `Load Demo Data`
5. 依次查看：
   - `Reports`
   - `Analysis`
   - `Tags`
   - `Exports`

第一次体验时你不需要：

- AI Key
- 领星账号
- Amazon SP-API
- internal SKU 映射

## Windows 一键启动

在仓库根目录运行：

```powershell
.\start-backend.ps1
.\start-frontend.ps1
```

或者直接一起启动：

```powershell
.\start-all.ps1
```

## 手工启动方式

### 第一步：启动后端

在仓库根目录执行：

```bash
cd backend
python -m venv .venv
```

激活虚拟环境：

Windows PowerShell：

```powershell
.\.venv\Scripts\activate
```

macOS / Linux：

```bash
source .venv/bin/activate
```

安装依赖并启动后端：

```bash
pip install -r requirements.txt -r requirements-dev.txt
uvicorn app.main:app --reload --port 8080
```

启动成功后，访问：

- `http://127.0.0.1:8080/health`

如果返回 `{"status":"ok"...}`，说明后端正常。

### 第二步：启动前端

回到仓库根目录后执行：

```bash
cd frontend
npm install
npm run dev
```

前端地址通常是：

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
4. 再按顺序查看：
   - `Reports`
   - `Analysis`
   - `Tags`
   - `Exports`

这条路径最适合第一次体验项目，不需要任何外部账号。

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
6. 去 `Tags` 查看打标结果
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

### 1. 我只上传了一份报表，能分析吗

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
