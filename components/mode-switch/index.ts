/**
 * 双模式切换组件（对齐原型 modeSwitch()，见 xingxun-responsive-prototype/js/pages/templates.js:19）。
 * properties.mode：'coffee' | 'cocktail'（当前激活项）
 * 点击某模式触发 switch 事件（detail = { mode }），由宿主页面调 store.switchMode。
 * 组件自身不做主题注入（根 view data-mode 由页面根节点负责），仅负责 UI。
 * 注意：组件内的 mode-option 子节点同样带 data-mode 属性，app.wxss 的 view[data-mode] 主题
 * 选择器已限定 .page/.page-root，不会命中本组件子节点。
 */
Component({
  properties: {
    /** 'coffee' | 'cocktail' */
    mode: { type: String, value: 'coffee' },
  },

  methods: {
    onSwitch(e: WechatMiniprogram.TouchEvent) {
      const mode = e.currentTarget.dataset.mode as string
      if (mode !== 'coffee' && mode !== 'cocktail') return
      if (mode === this.properties.mode) return
      this.triggerEvent('switch', { mode })
    },
  },
})
