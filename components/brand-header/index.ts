/**
 * 品牌顶部栏（对齐原型 index.html app-header + COMPONENT-SPEC BrandHeader）。
 * - 结构：状态栏占位 + 60px 栏（返回按钮[仅二级页，保留占位] / 品牌 Logo / 更多按钮）
 * - 更多按钮打开全局控制台（PAGE-SPEC §7：切换 Mock/API、清理本地状态、OpenAPI 说明）
 * - 主题经 mode 属性跟随双主题（组件置于页面根 view 内，继承语义变量）
 */
import { resolveDataSource } from '../../services/index'
import { APP_CONFIG } from '../../config/app-config'

const DS_STORAGE_KEY = 'awakeaglow:v6:data-source'

Component({
  properties: {
    mode: { type: String, value: 'coffee' },
    /** 二级页（详情/对比）显示返回按钮；根页面保留 38px 占位避免 Logo 偏移 */
    showBack: { type: Boolean, value: false },
  },

  data: {
    statusBarHeight: 20,
    devOpen: false,
    source: 'mock' as 'mock' | 'api',
    pickSource: 'mock' as 'mock' | 'api',
  },

  lifetimes: {
    attached() {
      let statusBarHeight = 20
      try {
        const sys: any = wx.getSystemInfoSync()
        statusBarHeight = sys?.statusBarHeight || 20
      } catch {
        // 非微信运行时回退默认值
      }
      const source = resolveDataSource()
      this.setData({ statusBarHeight, source, pickSource: source })
    },
  },

  methods: {
    onBack() {
      const pages = getCurrentPages()
      if (pages.length > 1) {
        wx.navigateBack({ delta: 1 })
      } else {
        wx.switchTab({ url: '/pages/home/index' })
      }
    },

    onHome() {
      wx.switchTab({ url: '/pages/home/index' })
    },

    onMore() {
      this.setData({ devOpen: true, pickSource: this.data.source })
    },

    onCloseDev() {
      this.setData({ devOpen: false })
    },

    onPickMock() {
      this.setData({ pickSource: 'mock' })
    },

    onPickApi() {
      this.setData({ pickSource: 'api' })
    },

    onApplySource() {
      try {
        wx.setStorageSync(DS_STORAGE_KEY, this.data.pickSource)
      } catch {
        // 存储失败仍尝试重载
      }
      wx.reLaunch({ url: '/pages/home/index' })
    },

    onResetState() {
      try {
        wx.clearStorageSync()
      } catch {
        // 忽略
      }
      wx.reLaunch({ url: '/pages/home/index' })
    },

    onOpenApiDoc() {
      wx.showToast({
        title: `契约：${APP_CONFIG.apiBaseUrl}`,
        icon: 'none',
        duration: 2500,
      })
    },
  },
})
