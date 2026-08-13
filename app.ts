/**
 * 醒醺 V6 小程序根实例（微信云托管版）。
 * onLaunch：wx.cloud.init + 注册枚举字典 + 稳定安装身份。
 */
import { setEnumsDict, ENUMS_DICT } from './lib/core'
import { initInstallIdentity } from './lib/identity'
import { APP_CONFIG } from './config/app-config'

App({
  globalData: {
    installIdentity: '',
  },

  onLaunch() {
    // 初始化微信云托管（callContainer 走微信专线，免域名备案）
    if (typeof wx !== 'undefined' && wx.cloud) {
      wx.cloud.init({
        env: APP_CONFIG.cloudEnv,
      })
    }

    setEnumsDict(ENUMS_DICT)

    const identity = initInstallIdentity((value) => {
      APP_CONFIG.requestHeaders['X-Install-Identity'] = value
      this.globalData.installIdentity = value
    })
    this.globalData.installIdentity = identity
  }
})
