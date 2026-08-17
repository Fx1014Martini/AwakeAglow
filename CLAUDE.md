# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概览

醒醺（AwakeAglow）V6 微信小程序，独立仓库（与父目录 AwakeAglow 的 V1/V2/V3 体系并行，无共享代码）。技术栈：**微信原生小程序 + TypeScript + WXML/WXSS**，双主题（咖啡暖纸 / 鸡尾酒深莓）、双模式（coffee/cocktail）决策小程序。后端为仓库内 `bff/`（FastAPI + SQLAlchemy + MySQL，部署到微信云托管）。

## 常用命令

```bash
npm run uno        # 生成 UnoCSS 原子类 -> dist/uno.wxss（改 class 后必须重跑）
npm run typecheck  # tsc --noEmit 类型检查
npm test           # vitest run（99 tests, 9 文件）
npm run dev        # uno + vitest watch
npm run build      # uno + typecheck
npx vitest run tests/filter.test.ts          # 单文件
npx vitest run -t "三态循环"                  # 单用例

# BFF（bff/ 目录）
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8010    # 本地开发，docs at /docs
python3 export_seed.py > seed.sql            # SQLite -> MySQL 种子（SQLITE_PATH 指向 v6 workspace 库）
pytest bff/tests/                            # BFF 单测
```

测试是纯 Node 环境（vitest，不触网不依赖 wx）；UI 验证在微信开发者工具中打开本目录（project.config.json appid `wx642403f9172425a0`）。

## 架构

### 前端（小程序根目录）

- `app.ts`：onLaunch 时 `wx.cloud.init` + 注册枚举字典 + 安装身份（X-Install-Identity，storage 持久化，见 `lib/identity.ts`）。
- 主包 5 页（home/menu/favorites/profile/age-gate）+ 3 分包（pkgDetail、pkgCompare、pkgExplore/discover+encyclopedia），preloadRule 在 `app.json`。tabBar 为 custom（`custom-tab-bar/`）。
- **数据层三层**（关键设计）：
  - `services/index.ts`：Service 工厂。`AppService` 统一接口（bootstrap/taxonomies/drinks/detail/recommend/compare/profile/favorites/history），`MockService` 与 `RealService` 双实现，按 `APP_CONFIG.dataSource` + storage 覆盖（控制台「应用并刷新」）切换。页面只依赖接口，**不直接 wx.request**。
  - `services/api/http-client.ts`：wx.request 封装，信封解包（`code !== '0'` 抛 ApiClientError）。
  - `services/contracts.ts` + `lib/contracts.ts`：DTO 契约。
- `stores/index.ts`：Store 类 + 模块级单例 `store`。双模式筛选各自独立、三态筛选（NONE→WANT→EXCLUDE）、收藏走服务端确认（失败不残留乐观状态）、route/detailTab 等运行时字段不持久化。
- `lib/`：纯函数库（core 枚举字典+triState、abv、radar、similarity、theme、age-gate、image、pag），**不依赖 wx**，全部可单测。
- **主题机制**：双主题靠根节点 `data-mode` 属性 + CSS 变量重映射（styles/themes.wxss、tokens.wxss），不换组件树。原生导航栏用 `lib/theme.ts` 的 `applyNavigationThemeSafe(mode)`（wx.setNavigationBarColor，frontColor 仅支持黑白两值）。Token 真源是 `docs/design.md`。
- **年龄门禁**：进入鸡尾酒内容前 `lib/age-gate.ts` 的 `guardCocktailEntry()` 拦截跳 `pages/age-gate/index`，确认态单向持久化，咖啡模式不受影响。`needsAgeGate(mode)` 显式接受目标模式（从 coffee 切往 cocktail 时须传 `'cocktail'`）。
- **UnoCSS 特殊约束**：WXSS 不支持 `*` 通配与转义类名，故 preflight 关闭、内容源**仅限 `src/uno-usage.ts` 白名单文件**——新原子类必须写入该文件再 `npm run uno`，不要让扫描器读组件 wxml。
- 组件自建（TDesign 变量风格），样式见 `styles/td-variables.wxss`；PAG 动效在 `lib/pag/`（默认 `enablePag: false`）。

### 后端（bff/）

- `bff/app/`：FastAPI，基础路径 `/api/v1`，容器内端口 80（云托管要求）。
- **三个 router 模块**：
  - `api/drinks.py`：公开饮品端点（bootstrap/taxonomies/drinks/{id}/recommendations/comparisons）。
  - `api/me.py`：用户态端点（profile/preferences/favorites toggle）。
  - `api/extras.py`：扩展端点（scenes/compare-rows/discovery-scenes/knowledge）。
- `response.py` 统一信封 `{code:'0', data, request_id}`。CORS `allow_credentials=False`（小程序 wx.request 不走 CORS，无需 cookie）。
- `app/db.py`：MySQL 连接走云托管注入的环境变量（`MYSQL_ADDRESS`/`MYSQL_USERNAME`/`MYSQL_PASSWORD`/`MYSQL_DATABASE`，云托管自动注入，无需在 container.config.json envParams 手动配置）。
- `repository.py`：SQLAlchemy ORM 仓储层。
  - **固定字典映射**：`FIXED_TO_DB_EXACT` / `FIXED_TO_DB_SUBSTR` 将前端筛选字典值映射到数据库 attributes 值域（组内 OR、多值 AND、EXCLUDE 剔除）。
  - **推荐算法**：scored 排序（场景 +12 / 偏好命中 +5 封顶 +25）→ hit_rows 筛选（偏好命中优先）→ top3 加权随机。
  - JSON 列在 Python 侧 `json.loads`，`card_json` 物化列表卡片直出。
- 部署：`Dockerfile`（Python 3.13-slim）+ `container.config.json`（含建库 executeSQLs，7 张表，时间列 VARCHAR(19)）。`schema.sql`/`seed.sql` 为库结构种子；`migrate_data.py` 数据迁移；`export_seed.py` 从 SQLite 导出 MySQL 种子（自动修正本地 127.0.0.1 图片地址）。
- 数据血缘：V6 workspace SQLite（`SQLITE_PATH` 指向 `~/vibe_coding/AwakeAglow/v6/workspace/db/awakeaglow_v6_simple.db`）→ `export_seed.py` → MySQL。仓储层契约对齐 v6/server/app_v1。

### 数据库（MySQL，schema v2）

7 张表，数据规模 **190 款**（coffee 45 + cocktail 145）：

| 表 | 用途 | 数据量 |
|---|---|---|
| `drink` | 产品主表（含 FULLTEXT 索引 name_zh/name_en/intro/description） | 190 |
| `taxonomy` | 固定筛选字典（与 BFF `FIXED_TO_DB_EXACT` 逐字一致） | 60 |
| `drink_similar` | 相似产品预计算 Top-10 | 1900 |
| `meta` | 元数据（release_code 等） | 6 |
| `user_profile` | 用户档案（匿名安装身份关联，偏好 JSON） | 按需 |
| `user_favorite` | 收藏（install_identity + drink_id 联合主键） | 按需 |
| `user_history` | 浏览历史（viewed_at DESC 索引，上限 50） | 按需 |

时间列均为 VARCHAR(19)（完整 ISO 时间戳 `YYYY-MM-DDTHH:MM:SS`）。

### 前后端联调

`config/app-config.ts` 的 `apiBaseUrl` 决定后端指向：生产 `https://awakeaglow.asia/api/v1`（HTTPS 直连，需配 request 合法域名）；本地开发切 `http://127.0.0.1:8010/api/v1`（开发者工具需勾选「不校验合法域名」）。云托管信息：env `awakeaglow-prod`，服务 `awakeaglow-bff`，自定义域名 `awakeaglow.asia`。

## 约定

- 页面枚举展示一律查 `ENUMS_DICT`（lib/core.ts），不硬编码 code 中文。
- 持久化字段白名单见 `stores/index.ts` 注释（mode/filters/keyword/favorites/profile/compareIds/detailTab/ageConfirmed），新增运行时字段勿落盘。
- 新页面/router：app.json 注册 + tsconfig include 对应目录；BFF 新 router 在 `app/main.py` include_router。
- Python import 一律在文件顶部（PEP 8 E402），禁止函数内 import。
- 文档：`docs/` 含设计系统三件套（design.md token 真源 / design-components.md / design-guidelines.md 可访问性）与验收走查记录，改视觉前先读。
- `docs/上线准备清单.md`：外部依赖（正式 AppID、酒类资质、域名备案、图片托管）待用户确认项。
