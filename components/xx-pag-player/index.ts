/**
 * PAG 动效播放器组件（xx-pag-player）。
 *
 * - ENV.enablePag = true 且 libpag 运行时可用时：渲染 PAGView 动效
 * - 否则：降级为静态图片 + WXSS 呼吸动效（xx-soft-glow）
 * - 完整生命周期：attached 注册 -> visible 播放 -> hidden 暂停 -> detached 销毁
 * - 网络加载失败自动降级
 *
 * 接入真实 PAG 步骤：
 * 1. npm install libpag-miniprogram
 * 2. ENV.enablePag = true
 * 3. 替换 assets/pag/*.pag 为真实 PAG 二进制文件
 * 4. 在 PAGView.init 回调中调用组件 resume()
 */
import { APP_CONFIG } from '../../config/app-config'

Component({
  properties: {
    /** PAG 资源 key（home-hero / detail-hero / overlay） */
    pagKey: { type: String, value: '' },
    /** 降级静态图（PAG 不可用或加载失败时显示） */
    fallbackImage: { type: String, value: '' },
    /** 是否可见（控制播放/暂停） */
    visible: { type: Boolean, value: true },
    /** 是否无限循环 */
    loop: { type: Boolean, value: true },
  },

  data: {
    /** 是否使用 PAG 运行时（false = 降级模式） */
    usePag: false,
    /** 加载失败标志 */
    loadFailed: false,
  },

  lifetimes: {
    attached() {
      this.setData({ usePag: APP_CONFIG.enablePag })
      if (APP_CONFIG.enablePag) {
        this.initPag()
      }
    },
    detached() {
      this.destroyPag()
    },
  },

  observers: {
    visible(val: boolean) {
      if (val) this.resume()
      else this.pause()
    },
  },

  methods: {
    /** 初始化 PAG 运行时（需 libpag-miniprogram npm 包） */
    initPag() {
      // libpag 运行时未安装时降级
      // 真实接入：const PAGView = require('libpag-miniprogram').PAGView
      // PAGView.init().then(() => { this.setData({ usePag: true }) })
      this.setData({ usePag: false })
    },
    resume() {
      // PAGView.play() - 待真实接入
    },
    pause() {
      // PAGView.pause() - 待真实接入
    },
    destroyPag() {
      // PAGView.destroy() - 待真实接入
    },
    /** PAG 网络加载失败回调 */
    onError() {
      this.setData({ loadFailed: true, usePag: false })
    },
  },
})
