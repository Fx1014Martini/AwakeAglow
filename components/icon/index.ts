/**
 * 图标组件（对齐原型 templates.js ICONS，AGENT-HANDOFF「禁止用 Emoji 替代核心 SVG」）。
 *
 * WXML 不支持 <svg>/<path>/<circle> 标签（见 commit b68e36f），改用 <image> 引用
 * assets/icons/{name}-{mode}.png（每个 name 有 coffee/cocktail/muted/white 四变体）。
 *
 * properties:
 * - name: home | menu | heart | user | search | filter | compare | close | back | more |
 *         bookmark | chevron | refresh | star | info | coffee | cocktail
 * - size: 尺寸（rpx）
 * - mode: 图标变体 'muted'(默认灰色) | 'coffee' | 'cocktail'（跟随主题）
 *
 * 状态图标用法：收藏爱心 favorite 时传 mode="{{mode}}"（彩色），未收藏传 'muted'（灰色）。
 * 非状态图标用法：导航/关闭等传 mode="{{mode}}" 跟随主题。
 */
Component({
  properties: {
    name: { type: String, value: 'search' },
    size: { type: Number, value: 38 },
    mode: { type: String, value: 'muted' },
  },
  data: { src: '/assets/icons/search-muted.png' },
  observers: {
    'name, mode'() {
      this.setData({ src: this.resolveSrc() })
    },
  },
  lifetimes: {
    attached() {
      this.setData({ src: this.resolveSrc() })
    },
  },
  methods: {
    resolveSrc(): string {
      const { name, mode } = this.properties
      const variant = mode === 'cocktail' ? 'cocktail' : mode === 'coffee' ? 'coffee' : 'muted'
      return `/assets/icons/${name}-${variant}.png`
    },
  },
})
