/**
 * 轻提示（TDesign 变量自建）。
 * 用法：页面持有 show，show=true 显示；本组件在 duration 后自动触发 hide 事件，调用方置 show=false。
 * 也可直接调用 selectComponent('#toast').show('文案')。
 */
Component({
  properties: {
    content: { type: String, value: '' },
    icon: { type: String, value: '' },
    /** 自动关闭时长（ms），0 表示不自动关闭 */
    duration: { type: Number, value: 2000 },
    show: { type: Boolean, value: false },
  },

  data: {
    visible: false,
    timer: null as ReturnType<typeof setTimeout> | null,
  },

  observers: {
    'show, visible'(show: boolean, visible: boolean) {
      if (show && !visible) {
        // 外部置 show=true 时入场
        this.setData({ visible: true })
      }
    },
  },

  lifetimes: {
    detached() {
      if (this.data.timer) {
        clearTimeout(this.data.timer)
      }
    },
  },

  methods: {
    show(content?: string) {
      if (typeof content === 'string' && content) {
        this.setData({ content })
      }
      this.open()
    },

    open() {
      if (this.data.timer) {
        clearTimeout(this.data.timer)
      }
      this.setData({ visible: true })
      // 下一帧再置 show，保证 hidden -> 显式的过渡生效
      this.setData({ show: true })
      const duration = Number(this.properties.duration) || 0
      if (duration > 0) {
        this.data.timer = setTimeout(() => this.close(), duration)
      }
    },

    close() {
      if (this.data.timer) {
        clearTimeout(this.data.timer)
        this.data.timer = null
      }
      this.setData({ show: false, visible: false })
      this.triggerEvent('hide')
    },
  },
})
