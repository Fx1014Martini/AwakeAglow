Component({
  properties: {
    mode: { type:String, value:'coffee' },
    title: { type:String, value:'' },
    showBack: { type:Boolean, value:false },
    showLogo: { type:Boolean, value:true }
  },
  data: { navigationHeight:88, statusBarHeight:20, contentHeight:68 },
  lifetimes: {
    attached() {
      const system = wx.getSystemInfoSync()
      const statusBarHeight = system.statusBarHeight || 20
      const navigationHeight = statusBarHeight + 68
      this.setData({ navigationHeight, statusBarHeight, contentHeight: 68 })
    }
  },
  methods: {
    onBack() {
      wx.navigateBack({ delta: 1, fail: () => wx.switchTab({ url: '/pages/home/index' }) })
    },
  },
})
