/**
 * 轻量按钮组件（TDesign 变量自建）。
 * 主按钮使用 --td-brand-color-gradient；次按钮使用 --td-bg-color-container。
 * 点击触发 change 事件，disabled / loading 状态下不派发。
 */
Component({
  properties: {
    /** primary | secondary */
    type: { type: String, value: 'primary' },
    disabled: { type: Boolean, value: false },
    loading: { type: Boolean, value: false },
    /** 块级铺满 */
    block: { type: Boolean, value: false },
  },

  methods: {
    onTap() {
      const { disabled, loading } = this.properties
      if (disabled || loading) return
      this.triggerEvent('click')
    },
  },
})
