/**
 * 分段 Tab（TDesign 变量自建）。
 * tabs: [{ key, label }]；active 为当前 key（字符串）或索引。
 * 点击触发 change（detail = { key, index }）。
 */
Component({
  properties: {
    tabs: {
      type: Array,
      value: [] as Array<{ key: string; label: string }>,
    },
    active: { type: String, value: '' },
  },

  data: {
    activeIndex: 0,
  },

  observers: {
    tabs(tabs: Array<{ key: string; label: string }>) {
      this.syncIndex(tabs, this.properties.active)
    },
    active(active: string) {
      this.syncIndex(this.properties.tabs, active)
    },
  },

  lifetimes: {
    attached() {
      this.syncIndex(this.properties.tabs, this.properties.active)
    },
  },

  methods: {
    syncIndex(
      tabs: Array<{ key: string; label: string }>,
      active: string,
    ) {
      const list = Array.isArray(tabs) ? tabs : []
      let idx = 0
      if (active) {
        const found = list.findIndex((t) => t.key === active)
        if (found >= 0) idx = found
      }
      this.setData({ activeIndex: idx })
    },

    onTabTap(e: WechatMiniprogram.CustomEvent) {
      const index = Number(e.currentTarget.dataset.index) || 0
      const list = Array.isArray(this.properties.tabs) ? this.properties.tabs : []
      const tab = list[index]
      if (!tab) return
      this.setData({ activeIndex: index })
      this.triggerEvent('change', { key: tab.key, index })
    },
  },
})
