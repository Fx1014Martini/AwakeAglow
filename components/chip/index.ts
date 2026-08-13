/**
 * 筛选/标签 chip（TDesign 变量自建）。
 * 点击触发 change（detail = !active）；disabled 时不派发。
 */
Component({
  properties: {
    active: { type: Boolean, value: false },
    disabled: { type: Boolean, value: false },
  },

  methods: {
    onTap(e: WechatMiniprogram.CustomEvent) {
      if (this.properties.disabled) return
      const next = !this.properties.active
      const value = e.currentTarget.dataset.value
      this.triggerEvent('change', { active: next, value })
    },
  },
})
