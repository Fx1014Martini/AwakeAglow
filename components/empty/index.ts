/**
 * 空状态（TDesign 变量自建）。
 * icon / title / desc / btnText；点击按钮触发 action 事件。
 */
Component({
  properties: {
    icon: { type: String, value: '' },
    title: { type: String, value: '暂无内容' },
    desc: { type: String, value: '' },
    btnText: { type: String, value: '' },
  },

  methods: {
    onAction() {
      this.triggerEvent('action')
    },
  },
})
