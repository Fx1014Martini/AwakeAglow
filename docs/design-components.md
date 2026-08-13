# 醒醺 V6 小程序组件规格

> 11 个自建组件 + custom-tab-bar + app-mode-switch 别名。按工作流分类。
> Token 值见 [design.md](design.md)，规则见 [design-guidelines.md](design-guidelines.md)。

---

## Navigation

### BrandHeader

品牌顶部栏，自定义导航（`navigationStyle: custom`）。

| Property | Value |
|---|---|
| 高度 | 115rpx(≈60px) + 状态栏占位 |
| 布局 | 3 列 grid：左 42px(返回/占位) / 中 Logo 122px / 右 42px(更多) |
| 返回按钮 | 仅二级页（detail/compare）显示，根页面保留占位避免 Logo 偏移 |
| 更多按钮 | 打开全局控制台（Mock/API 切换 / 清除状态 / 契约说明） |
| 主题 | `mode` 属性跟随双主题 |

**Types**: 根页面（show-back=false）/ 二级页（show-back=true）

**Do**: 状态栏高度用 `wx.getSystemInfoSync().statusBarHeight`；返回按钮保留占位。
**Don't**: 不用原生导航栏（已 custom）；不在根页面显示返回按钮。

---

### CustomTabBar (BottomTabBar)

底部导航，4 项平级切换。

| Property | Value |
|---|---|
| 高度 | 130rpx(≈68px) + `env(safe-area-inset-bottom)` |
| 布局 | 4 列等宽 grid |
| 图标 | 23px SVG，stroke-width 1.75 |
| 文字 | 10px，active weight 800 |
| active 色 | `--primary` |
| 主题 | `mode` 属性 + store subscribe 自适配 |

**Items**: 首页(home) / 菜单(menu) / 收藏(heart) / 我的(user)

**Do**: 详情/对比页手动挂载 `selected=1`（高亮菜单）；tab 页 onShow 经 `getTabBar().setData` 同步。
**Don't**: 不用 `navigateTo` 跳 tab 页（用 `wx.switchTab`）。

---

### ModeSwitch (app-mode-switch)

双模式切换，咖啡 / 微醺。

| Property | Value |
|---|---|
| 高度 | 88rpx(≈46px) |
| 最大宽度 | 520rpx(≈270px) |
| 圆角 | 27rpx(≈14px) |
| 动画 | 260ms |
| 持久化 | localStorage |

**Types**: coffee active / cocktail active

**Do**: 作为共享组件复用（home/menu/favorites/profile 已接入）；触发 `switch` 事件由页面调 `store.switchMode`。
**Don't**: 组件内不做主题注入（根 view data-mode 负责）；不用 emoji 替代 cup/wine 图标。

---

### Tabs (DetailTabs)

详情页分段 Tab，sticky 在滚动区顶部。

| Property | Value |
|---|---|
| 高度 | 80rpx(≈42px) |
| 布局 | 4 列等宽 |
| 选中态 | 底色 `--primary` 12% + 下边框 2px `--primary` |
| 位置 | `position: sticky; top: 0; z-index: 5` |

**Items**: 概览(overview) / 配方(recipe) / 雷达(radar) / 相似(similar)

**Do**: Tab 变化不改 URL，只存 `store.detailTab`（持久化）。
**Don't**: 不在 Tab 切换时触发页面重载。

---

## Input

### SearchField

搜索栏，菜单内 220ms 防抖，首页 450ms 防抖跳菜单。

| Property | Value |
|---|---|
| 高度 | 96rpx(≈50px) |
| 圆角 | 35rpx(≈18px) |
| 图标 | search 19px，`--text-2` 色 |
| placeholder | `--text-2` opacity 0.76 |
| 阴影 | `--shadow-soft` |

**Do**: 菜单输入 220ms 防抖；首页非空 450ms 跳菜单。
**Don't**: 不用 `debounce` 库（手写 setTimeout 清理）。

---

### TriChip

三态筛选 chip，循环 NONE -> WANT -> EXCLUDE -> NONE。

| State | 样式 | 前缀 |
|---|---|---|
| `NONE` | 透明底，`--border` 描边 | 无 |
| `WANT` | `--primary` 20% 底，`--primary` 55% border | ✓ |
| `EXCLUDE` | `rgba(134,41,41,.14)` 底，`#d78e8e` 字，划线 | × |

| Property | Value |
|---|---|
| 高度 | 54rpx(≈28px) |
| 圆角 | 17rpx(≈9px) |
| 字号 | 17rpx |
| 过渡 | 160ms |

**Do**: 每次点击立即重新请求列表；WANT = 必须匹配，EXCLUDE = 必须不匹配。
**Don't**: 不用按钮组组件（三态循环是自定义交互）。

---

## Containment

### Card

通用卡片容器。

| Property | Value |
|---|---|
| 边框 | 1px solid `--border` |
| 背景 | `--surface` |
| 圆角 | `--radius-lg`(44rpx) |
| 阴影 | `--shadow-soft` |

**Do**: 用于 info-card / step-card / compare-radar / compare-table / conclusion-card。
**Don't**: 不嵌套 Card（一层够了）。

---

### Empty

空状态容器。

| Property | Value |
|---|---|
| 最小高度 | 345rpx(≈180px) |
| 布局 | grid place-items center |
| 边框 | 1px dashed `--border` |
| 圆角 | `--radius-lg` |

**Do**: 标题 + 说明两行；提供下一步引导。
**Don't**: 不加图标（原型 empty-state 无图标）；不用"暂无数据"这种模糊文案。

---

### Toast

全局提示，1.8s 自动消失。

| Property | Value |
|---|---|
| 位置 | 底部居中，距底 50rpx |
| 圆角 | `--radius-pill` |
| 背景 | `#18120e` |
| 文字 | `#fff7e8` |
| 字号 | 21rpx |
| 动画 | 260ms translateY + opacity |

**Do**: 成功/失败/提示统一用 Toast；1800ms 自动隐藏。
**Don't**: 不用 Toast 做确认操作（用弹层）；不堆叠多个 Toast。

---

## Data Display

### RadarChart (t-radar-chart)

SVG 雷达图，支持单/双产品叠加。

| Property | Value |
|---|---|
| viewBox | 0 0 220 220 |
| 中心 | (110, 110) |
| 半径 | 220/2 - 220*0.16 = 92.4 |
| 网格层 | 0.25 / 0.5 / 0.75 / 1.0 |
| 分数范围 | 0-10 |
| 标签位置 | r * 1.22（外圈） |
| 标签字号 | 15rpx(≈8px) |

**Types**: 单产品（metrics）/ 双产品（metrics + compareMetrics）

**Props**: `metrics: RadarMetric[]` / `compareMetrics?: RadarMetric[]` / `size?: number=220`

**Do**: 分数 0-10（DB 存 0-5 步进 0.5，对外 ×2 归一）；标签数量 5-8 个。
**Don't**: 不用 Canvas（SVG 足够）；不在雷达图表达品质排名（只表达风格）。

---

### Icon (app-icon)

SVG 图标组件，12 个内置图标。

| Property | Value |
|---|---|
| viewBox | 0 0 24 24 |
| 线宽 | 1.75-1.8 |
| 端点 | stroke-linecap: round / stroke-linejoin: round |
| 填充 | none（filled 态 fill currentColor + opacity .25） |
| 尺寸 | `size` prop，单位 rpx |

**Icons**: home / menu / heart / user / search / filter / compare / close / back / more / cup / wine

**Do**: 颜色继承 `currentColor`；filled 态用于收藏激活爱心。
**Don't**: 不用 Emoji / Unicode 替代；不加新图标除非同步更新此清单。

---

### Chip

通用 chip / tag，用于标签和场景筛选。

| Type | Padding | 圆角 | 字号 |
|---|---|---|---|
| chip (场景) | 17rpx 25rpx | `--radius-pill` | 19rpx |
| tag (产品标签) | 10rpx 15rpx | 15rpx(≈8px) | 17rpx |

**States**: default / active

**Do**: 场景 chip active 用 `--primary` 渐变；tag 只展示，不交互。
**Don't**: 不用 chip 做表单选项（用 tri-chip）。

---

### BrandLogo

品牌 Logo SVG，融合咖啡杯 + 太阳 + 酒瓶 + 酒杯 + 月亮。

| Property | Value |
|---|---|
| viewBox | 0 0 310 96 |
| 线宽 | 3.2 |
| 中文 | "醒醺" Songti SC 33px |
| 英文 | "AWAKE & AGLOW" Georgia 10px |
| 颜色 | `currentColor`（继承 `--primary`） |

**Do**: 用于 brand-header 中间 + 启动页。
**Dontr**: 不改 Logo 路径（品牌资产锁定）。

---

## Feedback

### Skeleton

骨架屏，shimmer 动画。

| Property | Value |
|---|---|
| 背景 | `--surface-muted` |
| 圆角 | 23rpx(≈12px) |
| 动画 | shimmer 1.2s infinite |
| shimmer | `translateX(-100% -> 100%)` linear-gradient |

**Do**: 菜单加载 3 个骨架卡；详情加载骨架 hero + line。
**Don't**: 不用 Spinner（骨架屏更符合内容形态）。

---

## 组件依赖关系

```
BrandHeader → app-icon, brand-logo
CustomTabBar → (无依赖，自 themed)
ModeSwitch → (无依赖)
Tabs → (TDesign t-tabs 封装)
SearchField → app-icon
TriChip → (独立)
Card → (独立)
Empty → (TDesign t-empty 封装)
Toast → (TDesign t-toast 封装)
RadarChart → lib/radar.ts
Icon → (独立)
Chip → (独立)
BrandLogo → (独立)
Skeleton → (CSS only)
```

## 尺寸速查（rpx / px 对照）

| 组件 | rpx | ≈px | 来源 |
|---|---|---|---|
| brand-header 高 | 115rpx | 60px | COMPONENT-SPEC |
| mode-switch 高 | 88rpx | 46px | COMPONENT-SPEC |
| search-field 高 | 96rpx | 50px | COMPONENT-SPEC |
| detail-tabs 高 | 80rpx | 42px | COMPONENT-SPEC |
| tab-bar 高 | 130rpx | 68px | COMPONENT-SPEC |
| favorite-button | 65rpx | 34px | COMPONENT-SPEC |
| icon-button | 73rpx | 38px | COMPONENT-SPEC |
| primary-button | 88rpx | 46px | COMPONENT-SPEC |
| recommend-hero min-height | 480rpx | 250px | DESIGN.md §5 |
| detail-hero min-height | 660rpx | 345px | DESIGN.md §5 |
| radar-chart size | 420rpx | 220px | lib/radar.ts |
