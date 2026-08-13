// 由 mode-switch/index.ts 编译产物生成（微信 TS 插件会跳过同名 .js，但此文件供依赖分析直接识别）
Component({
  properties: {
    mode: { type: String, value: 'coffee' },
  },
  methods: {
    onSwitch(e) {
      const mode = e.currentTarget.dataset.mode
      if (mode !== 'coffee' && mode !== 'cocktail') return
      if (mode === this.properties.mode) return
      this.triggerEvent('switch', { mode })
    },
  },
})
