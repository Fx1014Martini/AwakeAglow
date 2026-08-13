# 醒醺 V6 小程序设计系统 - Token Reference

> 本文件是 miniprogram-v2 的设计 Token 真源，继承自 `xingxun-responsive-prototype/styles/tokens.css`。
> 组件规格见 [design-components.md](design-components.md)，可访问性与规则见 [design-guidelines.md](design-guidelines.md)。

醒醺 V6 是咖啡与鸡尾酒双模式决策小程序。核心设计原则：**同一信息架构，两种情绪皮肤**--模式只改变主题和数据，不改变用户学习成本。双主题（咖啡暖纸 / 鸡尾酒深莓）经根 `<view data-mode>` 属性 + CSS 变量重映射切换；4 套字体栈（衬线标题 / 无衬线正文 / 拉丁英文 / 数字）；390 CSS px 设计宽（1 px ≈ 1.923rpx）；11 个 TDesign 变量自建组件 + PAG 动效。

---

## Colors

### 咖啡主题（Coffee · 浅暖）— 晨光、清醒、柔和

| Role | Token | Hex | Usage |
|---|---|---|---|
| 页面背景 | `--coffee-bg` | `#f8f2e9` | 页面底色 |
| 背景渐变 2 | `--coffee-bg-2` | `#efe0cd` | 背景渐变第二色 |
| 半透明表面 | `--coffee-surface` | `rgba(255,253,249,.92)` | 卡片半透明底 |
| 强表面 | `--coffee-surface-strong` | `#fffdf9` | 卡片实底 / 底栏 / 顶栏 |
| 弱表面 | `--coffee-surface-muted` | `#f5eadc` | 次级表面 / 筛选面板 |
| 主文字 | `--coffee-text` | `#342216` | 标题 / 正文 |
| 次文字 | `--coffee-text-2` | `#806b5a` | 辅助说明 / placeholder |
| 边框 | `--coffee-border` | `rgba(113,75,38,.16)` | 卡片 / 分割线 |
| 主色 | `--coffee-primary` | `#9c6118` | 主按钮 / 选中态 / 品牌色（浓缩棕） |
| 主色 2 | `--coffee-primary-2` | `#d5a34e` | 渐变第二色 / 金色强调（琥珀金） |
| 强调 | `--coffee-accent` | `#f0c879` | active 态 / 高亮 |
| 强阴影 | `--coffee-shadow` | `0 18px 46px rgba(104,63,21,.14)` | 主卡 / 弹层 |
| 弱阴影 | `--coffee-shadow-soft` | `0 8px 24px rgba(104,63,21,.09)` | 次级卡片 |

### 鸡尾酒主题（Cocktail · 深暗）— 夜晚、克制、优雅

| Role | Token | Hex | Usage |
|---|---|---|---|
| 页面背景 | `--cocktail-bg` | `#080706` | 页面底色（近黑） |
| 背景渐变 2 | `--cocktail-bg-2` | `#16100d` | 背景渐变第二色 |
| 半透明表面 | `--cocktail-surface` | `rgba(21,17,13,.92)` | 卡片半透明底 |
| 强表面 | `--cocktail-surface-strong` | `#17120f` | 卡片实底 / 底栏 / 顶栏 |
| 弱表面 | `--cocktail-surface-muted` | `#211916` | 次级表面 / 筛选面板 |
| 主文字 | `--cocktail-text` | `#f1dfbd` | 标题 / 正文（暖金） |
| 次文字 | `--cocktail-text-2` | `#a89174` | 辅助说明 / placeholder |
| 边框 | `--cocktail-border` | `rgba(210,167,91,.24)` | 卡片 / 分割线 |
| 主色 | `--cocktail-primary` | `#d4a75b` | 主按钮 / 选中态 / 品牌色（金） |
| 主色 2 | `--cocktail-primary-2` | `#8b2634` | 渐变第二色 / 勃艮第红 |
| 强调 | `--cocktail-accent` | `#741d2a` | active 态 / 深红高亮 |
| 强阴影 | `--cocktail-shadow` | `0 20px 52px rgba(0,0,0,.48)` | 主卡 / 弹层 |
| 弱阴影 | `--cocktail-shadow-soft` | `0 10px 30px rgba(0,0,0,.35)` | 次级卡片 |

### 语义色（双主题通用）

| Role | Token | Hex | Usage |
|---|---|---|---|
| 危险 | `--danger` | `#a93b3b` | 错误 / 删除 / EXCLUDE 态 |
| 成功 | `--success` | `#486c47` | 成功 / WANT 态辅助 |
| 焦点 | `--focus` | `#3c82f6` | `:focus-visible` outline |

### 主题切换机制

根节点 `<view class="page" data-mode="coffee|cocktail">` 挂载模式。`app.wxss` 用 `view[data-mode].page` 选择器将 `--coffee-*` / `--cocktail-*` 重映射到通用语义变量（`--bg` `--surface` `--text` `--primary` 等 13 槽）+ TDesign 变量（`--td-brand-color` 等 20+ 槽）。组件只引用通用变量，切换 data-mode 即整体换肤。

---

## Typography

### 4 套字体栈

| Token | 栈 | 用途 |
|---|---|---|
| `--font-serif` | `"Songti SC", STSong, "Noto Serif CJK SC", SimSun, serif` | 中文标题（display-title / section-head / hero h3 / detail h1） |
| `--font-sans` | `-apple-system, BlinkMacSystemFont, "PingFang SC", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif` | 中文正文（body 默认） |
| `--font-latin` | `Georgia, "Times New Roman", serif` | 英文饮品名（.en / vs-badge / 英文副标题） |
| `--font-number` | `"DIN Alternate", "SF Pro Display", Arial, sans-serif` | 数字（状态栏 / 推荐指数 / 统计数） |

### 平台分叉

- **iOS 优先**：PingFang SC（正文）/ Songti SC（标题）
- **Android 优先**：Noto Sans CJK SC（正文）/ Noto Serif CJK SC（标题）

栈顺序已处理平台回退。未分发字体文件，全靠系统字体。

### 字号梯度（rpx，基于 390px 设计宽）

| Style | Size | Weight | Line Height | Letter Spacing | Font |
|---|---|---|---|---|---|
| Display Title | 64rpx | 500 | 1.18 | -0.035em | serif |
| Section Title | 40rpx | 500 | - | -0.02em | serif |
| Hero Title | 56rpx | 500 | 1.05 | - | serif |
| Detail Name | 67rpx | 500 | - | - | serif |
| Body Large | 30rpx | 400 | 1.7 | - | sans |
| Body Medium | 28rpx | 400 | 1.5 | - | sans |
| Body Small | 23rpx | 400 | 1.7 | - | sans |
| Label / Tag | 17-18rpx | 700-800 | - | 0.18em | sans |
| Number Large | 40rpx | 700 | - | - | number |
| Eyebrow | 17rpx | 800 | - | 0.18em | sans |

---

## Shape

| Token | Radius | Usage |
|---|---|---|
| `--radius-xs` | 8rpx(→16rpx) | tag / 小圆角 |
| `--radius-sm` | 12rpx(→24rpx) | tri-chip / 小卡片 |
| `--radius-md` | 16rpx(→32rpx) | 中等卡片 / 筛选面板 |
| `--radius-lg` | 22rpx(→44rpx) | 主卡片 / 结果卡 / 详情卡 |
| `--radius-xl` | 28rpx(→56rpx) | 大卡片 / 弹层 |
| `--radius-pill` | 999rpx | 按钮 / chip / 搜索框 / toast |

> 注：tokens.wxss 存 px 值，wxss 使用时按 1px≈1.923rpx 换算。app.wxss 中 .page padding 用 31rpx（≈16px）。

---

## Elevation

### 咖啡主题阴影

| Level | Token | CSS | Usage |
|---|---|---|---|
| Soft | `--coffee-shadow-soft` | `0 8px 24px rgba(104,63,21,.09)` | 次级卡片 / 搜索框 / 筛选面板 |
| Strong | `--coffee-shadow` | `0 18px 46px rgba(104,63,21,.14)` | 主推荐卡 / 弹层 |

### 鸡尾酒主题阴影

| Level | Token | CSS | Usage |
|---|---|---|---|
| Soft | `--cocktail-shadow-soft` | `0 10px 30px rgba(0,0,0,.35)` | 次级卡片 / 搜索框 |
| Strong | `--cocktail-shadow` | `0 20px 52px rgba(0,0,0,.48)` | 主推荐卡 / 弹层 |
| Overlay | `--td-shadow-3` | `0 34px 80px rgba(0,0,0,.42)` | 底部弹层 panel |

---

## Interaction States

| State | 视觉表现 | 实现 |
|---|---|---|
| Rest | 默认态 | - |
| Hover | 桌面 hover（小程序无） | `hover-class` 属性 |
| Pressed | scale(0.97) + hover-stay-time 80ms | `:active { transform: scale(.97) }` |
| Focus | 2px solid `--focus` outline | `:focus-visible`（桌面）/ 无（移动端） |
| Disabled | opacity 0.38 | `disabled` 属性 |
| Active (selected) | 主色文字 + 底色 + 字重 800 | `.active` class |

### 按压反馈时序

| 元素 | 按压效果 | 时长 |
|---|---|---|
| 主按钮 | scale(0.97) | 160ms (--motion-fast) |
| 图标按钮 | scale(0.97) | 160ms |
| 卡片 | scale(0.96) | 160ms |
| Chip | 色彩过渡 | 160ms |

---

## Layout

### 设计宽度

- 黄金设计宽度：390 CSS px
- rpx 基准：750rpx = 屏幕宽度
- 换算公式：1 CSS px ≈ 1.923rpx（750/390）

### 断点

| 断点 | 触发 | 布局变化 |
|---|---|---|
| 窄屏 | `max-width: 370px` | 页面边距 12px(→23rpx) / 收藏宫格 2 列 / 详情双列→单列 / 结果图 92px |
| 默认 | 371-429px | 页面边距 16px(→31rpx) / 收藏宫格 3 列 / 详情双列 |
| 宽屏 | `min-width: 430px` | 页面边距 20px(→38rpx) / hero 增高 / 结果图 132px |

### 页面结构

| 区域 | 高度 | 说明 |
|---|---|---|
| 状态栏 | `env(safe-area-inset-top)` | wx.getSystemInfoSync 获取 |
| 品牌顶栏 | 115rpx(≈60px) | 返回按钮(仅二级页) + Logo + 更多 |
| 内容区 | flex 1 | 可滚动，overscroll-behavior: contain |
| 底部导航 | 130rpx(≈68px) + safe-bottom | 4 tab + iOS 安全区 |

### 安全区

- `--safe-top: env(safe-area-inset-top, 0px)`
- `--safe-bottom: env(safe-area-inset-bottom, 0px)`
- 状态栏 / 底栏 / 弹层均加 safe-area inset

---

## Motion

### 时长

| Token | 时长 | 用途 |
|---|---|---|
| `--motion-fast` | 160ms | 按钮按压 / 图标反馈 / 色彩过渡 |
| `--motion-normal` | 260ms | 页面进入 / 底部弹层 / ModeSwitch / Toast |
| `--motion-slow` | 420ms | 双主题过渡 |

### 曲线

| Token | cubic-bezier | 用途 |
|---|---|---|
| `--ease-standard` | `cubic-bezier(.2,.8,.2,1)` | 通用 |
| `--ease-spring` | `cubic-bezier(.2,1.25,.4,1)` | 弹性（预留） |

### 关键动画

| 动画 | 实现 | 时长 |
|---|---|---|
| 页面进入 | `translateY(7px) + opacity 0→1` | 260ms standard |
| 底部弹层 | `translate(-50%,20px) → 0` | 260ms standard |
| Toast 显示 | `translateY(20px) + opacity 0→1` | 260ms |
| Skeleton shimmer | `translateX(-100% → 100%)` | 1.2s infinite |
| 模式切换 | 主题变量过渡 | 420ms |

### 无障碍降级

`@media (prefers-reduced-motion: reduce)` 时所有动画降至 0.01ms。

---

## Icons

### 图标系统

- 风格：线性 SVG（stroke only），圆角端点
- 默认线宽：1.75-1.8
- viewBox：`0 0 24 24`
- 颜色：`stroke: currentColor`（继承父级 color）
- 填充态：`fill: currentColor; fill-opacity: .25`（收藏激活爱心）

### 图标清单（12 个）

`home` `menu` `heart` `user` `search` `filter` `compare` `close` `back` `more` `cup` `wine`

### 禁止事项

- ❌ 禁止用 Emoji 替代核心 SVG 图标（AGENT-HANDOFF 硬约束）
- ❌ 禁止用 Unicode 符号替代导航图标
- ✅ 装饰性符号（✓ × › ↻ ✦ ☆）可用于状态标记和引导

---

## Design Tokens

### 命名规范

| 前缀 | 含义 | 示例 |
|---|---|---|
| `--coffee-*` / `--cocktail-*` | 主题原始 token | `--coffee-primary` |
| `--bg` `--surface` `--text` `--primary` | 通用语义别名（经 data-mode 切换） | `var(--primary)` |
| `--td-*` | TDesign 变量（映射到语义别名） | `--td-brand-color` |
| `--space-*` | 间距（2-40px，14 档） | `--space-16` |
| `--radius-*` | 圆角（xs/sm/md/lg/xl/pill） | `--radius-lg` |
| `--motion-*` | 动效时长 | `--motion-normal` |
| `--font-*` | 字体栈 | `--font-serif` |

### 使用规则

- 组件 wxss **只引用通用语义变量**（`var(--text)` `var(--primary)`），不直接引用 `--coffee-*` / `--cocktail-*`
- 主题切换只改 data-mode 属性，不改组件代码
- 新增 token 须先加到 `styles/tokens.wxss`，再在 `app.wxss` 做语义映射
