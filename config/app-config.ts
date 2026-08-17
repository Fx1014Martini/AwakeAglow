/**
 * 应用配置（微信云托管版）。
 *
 * 数据源默认 api，有两种传输方式：
 * - callContainer（推荐）：走微信云托管专线，免域名备案、免白名单，适合体验版/正式版
 * - HTTPS 直连：走 wx.request，需在小程序后台配 request 合法域名（仅适合开发调试）
 */

export type DataSource = 'mock' | 'api'

export const APP_CONFIG: AppConfig = {
  appName: '醒醺',
  version: '9.0.0',
  dataSource: 'api',
  // 传输方式：true=callContainer（免备案），false=HTTPS 直连（需配白名单）
  useCallContainer: true,
  // 云托管环境 ID（在云托管控制台 -> 服务列表 -> 环境信息中查看）
  cloudEnv: 'awakeaglow-prod',
  cloudAppid: 'wx36fbc06d56aa520b',
  // 云托管服务名（控制台 -> 服务列表中的服务名）
  cloudService: 'flask-8rcf',
  // HTTPS 直连域名（仅 useCallContainer=false 时使用；需配 request 白名单）
  apiBaseUrl: 'https://flask-8rcf-296365-11-1467877005.sh.run.tcloudbase.com/api/v1',
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
  useCallContainer: boolean
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
