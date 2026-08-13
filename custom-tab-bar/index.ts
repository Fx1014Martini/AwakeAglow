/**
 * 自定义底部导航（对齐原型 #tabBar，COMPONENT-SPEC CustomTabBar）。
 *
 * 使用方式：
 * - tab 页面：框架在 tabBar.custom:true 时自动挂载本组件，页面 onShow 经
 *   `this.getTabBar().setData({ selected })` 同步高亮索引。
 * - 非 tab 页面（pkgDetail/pkgCompare）：在 wxml 手动挂载
 *   `<custom-tab-bar selected="{{1}}" mode="{{mode}}" />` 高亮菜单。
 *
 * 切换：用 wx.switchTab（禁止 navigateTo 跳 tab 页，对齐原型）。
 */
const TABS = [
  { key: 'home', text: '首页', icon: 'home', path: '/pages/home/index' },
  { key: 'menu', text: '菜单', icon: 'menu', path: '/pages/menu/index' },
  { key: 'heart', text: '收藏', icon: 'heart', path: '/pages/favorites/index' },
  { key: 'user', text: '我的', icon: 'user', path: '/pages/profile/index' },
]

Component({
  properties: {
    /** 当前激活项索引：0=首页 1=菜单 2=收藏 3=我的 */
    selected: { type: Number, value: 0 },
    /** 主题模式：coffee | cocktail（图标与配色跟随） */
    mode: { type: String, value: 'coffee' },
  },

  data: {
    tabs: TABS,
  },

  methods: {
    onTap(e: WechatMiniprogram.TouchEvent) {
      const index = Number(e.currentTarget.dataset.index)
      if (Number.isNaN(index)) return
      if (index === this.properties.selected) return
      const tab = TABS[index]
      if (!tab) return
      wx.switchTab({ url: tab.path })
    },
  },
})
