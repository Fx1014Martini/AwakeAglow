/**
 * 应用配置（微信云托管版）。
 * 数据源默认 api，走 HTTPS 直连（wx.request）。
 */

export type DataSource = 'mock' | 'api'

export const APP_CONFIG: AppConfig = {
  appName: '醒醺',
  version: '9.0.0',
  dataSource: 'api',
  // 云托管环境 ID（在云托管控制台 -> 服务列表 -> 环境信息中查看）
  cloudEnv: 'awakeaglow-prod',
  cloudAppid: 'wx36fbc06d56aa520b',
  // 云托管服务名（container.config.json 中的 service name）
  cloudService: 'awakeaglow-bff',
  // 自定义域名（HTTPS 直连；需在小程序后台配 request 合法域名）
  apiBaseUrl: 'https://cfx.woofcloud.com/api/v1',
  timeoutMs: 10000,
  requestHeaders: {
    'Content-Type': 'application/json',
    'X-Install-Identity': 'anonymous-v6-dev',
  },
  enablePag: false,
  pagRemoteUrl: '',
  mockLatencyMs: 90,
}

export interface AppConfig {
  appName: string
  version: string
  dataSource: DataSource
  cloudEnv: string
  cloudAppid: string
  cloudService: string
  apiBaseUrl: string
  timeoutMs: number
  requestHeaders: Record<string, string>
  enablePag: boolean
  pagRemoteUrl: string
  mockLatencyMs: number
}
