# 醒醺 V6 小程序设计系统 - Accessibility & Guidelines

> Token 值见 [design.md](design.md)，组件规格见 [design-components.md](design-components.md)。

---

## Accessibility

### 色彩对比度（WCAG AA）

| 要求 | 比率 | 适用 |
|---|---|---|
| 正常文字 | ≥ 4.5:1 | 正文 / 标题 / 按钮文字 |
| 大号文字（≥18pt 或 14pt bold） | ≥ 3:1 | display-title / section-title |
| 图标 / 边框 | ≥ 3:1 | 导航图标 / 卡片边框 / 分割线 |
| 非文本对比 | ≥ 3:1 | 焦点指示器 / 状态标识 |

#### 咖啡主题关键对比度

| 前景 | 背景 | 比率 | 判定 |
|---|---|---|---|
| `--coffee-text` #342216 | `--coffee-bg` #f8f2e9 | ~11.8:1 | ✅ AAA |
| `--coffee-text-2` #806b5a | `--coffee-bg` #f8f2e9 | ~4.6:1 | ✅ AA |
| `--coffee-primary` #9c6118 | `--coffee-surface-strong` #fffdf9 | ~4.8:1 | ✅ AA |
| `--coffee-surface-strong` #fffdf9 | `--coffee-primary` #9c6118（按钮文字） | ~4.8:1 | ✅ AA |

#### 鸡尾酒主题关键对比度

| 前景 | 背景 | 比率 | 判定 |
|---|---|---|---|
| `--cocktail-text` #f1dfbd | `--cocktail-bg` #080706 | ~13.2:1 | ✅ AAA |
| `--cocktail-text-2` #a89174 | `--cocktail-bg` #080706 | ~7.1:1 | ✅ AAA |
| `#1b1109`（按钮文字） | `--cocktail-primary` #d4a75b | ~8.9:1 | ✅ AAA |

### 触控目标

| 元素 | 最小尺寸 | 实现 |
|---|---|---|
| 底部导航 tab | ≥ 44×44px | custom-tab-bar 高度 130rpx(≈68px) |
| 主按钮 | ≥ 46×46px | `.hero-btn` min-height 88rpx(≈46px) |
| 图标按钮 | ≥ 38×38px（视觉）+ 触控区 ≥44px | brand-header icon-button 73rpx(≈38px) |
| 收藏爱心 | 视觉 17px + 触控区 ≥34px | `.menu-fav` 65rpx(≈34px) |
| 筛选 tri-chip | ≥ 28px 高 | tri-chip min-height 54rpx(≈28px) |
| 场景 chip | ≥ 36px 高 | scene-chip padding 17rpx |

### 键盘导航（桌面端预览）

| 键 | 动作 |
|---|---|
| `Tab` | 焦点遍历交互元素 |
| `Enter` / `Space` | 激活焦点元素 |
| `Escape` | 关闭弹层 |
| `Cmd/Ctrl + K` | 跳转菜单 + 聚焦搜索（桌面端） |

### 辅助技术（屏幕阅读器）

- 所有交互元素必须有 `aria-label` 或可见文字
- 图标按钮 `aria-label` 描述动作（"返回" / "关闭" / "收藏"）
- 装饰性图标 `aria-hidden="true"`
- 状态变化用 `aria-pressed` / `aria-selected` / `aria-live`
- 弹层 `role="dialog"` + `aria-label`
- 雷达图 `role="img"` + `aria-label="风味雷达图"`

---

## Gestures

| 手势 | 用途 |
|---|---|
| Tap | 激活按钮 / 链接 / 卡片 |
| Double tap | 无 |
| Long press | 无 |
| Scroll | 页面垂直滚动 / 横滑区域水平滚动 |
| Swipe | 相似推荐横滑 / 场景 chip 横滑 |
| Drag | 无 |
| Pinch | 无 |

---

## Content Design

### 语气（Voice）

醒醺的语气：**温暖、专业、不卖弄**。像一个懂行的朋友，不是百科全书，不是推销员。

- **温暖**：关心用户当下的感受和场景
- **专业**：信息准确、理由清晰、不模糊
- **不卖弄**：用日常语言，不用术语堆砌

### 语调（Tone）调适

| 场景 | 语调 | 示例 |
|---|---|---|
| 推荐 | 温暖、自信 | "这杯更适合现在的你" |
| 成功 | 简洁、肯定 | "已收藏" |
| 错误 | 共情、给方案 | "收藏失败，请稍后重试" |
| 空态 | 引导、鼓励 | "还没有收藏，在推荐卡片或详情页点击爱心" |
| 安全提示 | 严肃、清晰 | "理性饮酒 · 未满 18 周岁请勿购买" |
| 引导 | 轻盈、不啰嗦 | "减少一个"想要"或取消部分排除条件" |

### 大小写与标点

- 标题用句子首字母大写（中文无大小写问题，英文用 sentence case）
- 按钮用祈使句动词开头："推荐这杯" "换一杯" "查看详情"
- 不用句号结尾（按钮 / 标签 / 标题）
- Toast 不用标点结尾
- 箭头符号 `->` `›` 用于引导动作，不用 `→`

### 文案长度基准

| 元素 | 字数 | 字符数 |
|---|---|---|
| 按钮 | 2-4 字 | ≤8 |
| 标题 | 3-8 字 | ≤20 |
| Toast | 4-10 字 | ≤16 |
| 空态说明 | 8-15 字 | ≤30 |
| 错误消息 | 10-18 字 | ≤30 |

---

## Do's and Don'ts

### Color

- ✅ 主色 `--primary` 只用于当前页最重要的单一动作（主按钮 / 选中态）
- ✅ 双主题经 data-mode 切换，组件引用 `var(--primary)` 而非 `var(--coffee-primary)`
- ✅ 鸡尾酒模式主按钮文字用深色（`#1b1109`）保证对比度
- ❌ 不在同一视图出现多个主色按钮（分散注意力）
- ❌ 不直接引用 `--coffee-*` / `--cocktail-*` token（破坏主题切换）
- ❌ 不用纯黑 `#000` 或纯白 `#fff`（用 surface-strong / bg）

### Shape

- ✅ 主卡片用 `--radius-lg`（22px / 44rpx）
- ✅ 按钮用 `--radius-pill`（胶囊形）
- ✅ tri-chip 用 9px 圆角（区别于场景 chip 的胶囊形）
- ❌ 不混用圆角值（严格用 token 档位）
- ❌ 不给图片加圆角超过容器圆角

### Elevation

- ✅ 主推荐卡 / 弹层用 `--shadow`（强阴影）
- ✅ 次级卡片 / 搜索框用 `--shadow-soft`（弱阴影）
- ✅ 鸡尾酒主题阴影更深（rgba 0,0,0,.48）以增强层次
- ❌ 不在咖啡主题用深黑阴影（破坏温暖感）
- ❌ 不叠加多层阴影（阴影不累积）

### Interaction

- ✅ 按压反馈用 `scale(0.97)` + `hover-stay-time="80"`
- ✅ 收藏切换"成功再更新"（先调 service，成功才改 state）
- ✅ 三态筛选 `NONE -> WANT -> EXCLUDE -> NONE` 立即重新请求
- ❌ 收藏不做乐观更新（失败会闪现乐观态）
- ❌ 不用 `hover` 做关键交互（移动端无 hover）
- ❌ 不在加载中禁用交互但不给视觉反馈

### Layout

- ✅ 页面边距 16px（窄屏 12px / 宽屏 20px）
- ✅ 底部导航加 `safe-area-inset-bottom`
- ✅ 详情/对比页仍显示底栏，高亮菜单
- ❌ 不出现横向滚动
- ❌ 不让底部导航遮挡内容
- ❌ 不用物理 px（用 rpx 等比缩放）

### Typography

- ✅ 中文标题用 `--font-serif`（Songti SC）
- ✅ 英文饮品名用 `--font-latin`（Georgia）
- ✅ 数字用 `--font-number`（DIN Alternate）
- ✅ 标题区域留换行余量
- ❌ 不用固定字符宽度推算布局
- ❌ 不用 Arial / Inter 等通用字体作为主字体
- ❌ 不在正文用 serif（serif 仅用于标题）

### Motion

- ✅ 页面进入 260ms standard
- ✅ 弹层 260ms standard
- ✅ 主题过渡 420ms
- ✅ `prefers-reduced-motion: reduce` 时降级
- ❌ 动效不超过 420ms（过长感觉迟钝）
- ❌ 不用弹跳曲线做正式交互（spring 仅预留）
- ❌ 不在列表滚动时触发动画

### Components

- ✅ 图标用 `app-icon` 组件（SVG，无 emoji）
- ✅ 雷达图用 `t-radar-chart` 组件（0-10 分，支持双产品叠加）
- ✅ 双模式切换用 `app-mode-switch` 共享组件
- ✅ 二级页 brand-header 显示返回按钮
- ❌ 不用 Emoji 替代核心 SVG 图标
- ❌ 不页面直接 `wx.request`（走 services 层）
- ❌ 不写死服务地址（走 config）
- ❌ 不将 Mock / API 做成两套页面逻辑

### Content

- ✅ 推荐必须给出理由（≥1 条）
- ✅ 雷达文案声明"分数表达风格强弱，不代表品质高低"
- ✅ 不出现价格 / 订单 / 库存 / 电商入口
- ✅ 鸡尾酒安全提示在所有鸡尾酒页面可见
- ❌ 不给酒类附加健康暗示（治疗焦虑/助眠/缓解抑郁）
- ❌ 不向未成年人推荐酒精
- ❌ 不改变原型锁定的文案和分类枚举
