/**
 * Service 工厂：按 APP_CONFIG.dataSource 一键切换 Mock / Real API 数据层。
 *
 * 页面只依赖统一 Service 接口（getBootstrap/getTaxonomies/listDrinks/getDrinkDetail/
 * recommend/compare/getProfile/updatePreferences/toggleFavorite），
 * 不直接 wx.request。数据源切换改 config/app-config.ts 一处即可。
 */

import { APP_CONFIG } from '../config/app-config'
import type {
  BootstrapData,
  CompareRequest,
  CompareResult,
  DrinkDetail,
  DrinkPage,
  FavoriteToggleResult,
  ListDrinksQuery,
  Profile,
  RecommendationRequest,
  RecommendationResult,
  Taxonomies,
  UpdatePreferencesRequest,
} from '../lib/contracts'
import { RealService } from './api/api-service'
import type { DrinkService, UserService, ServiceBundle } from './contracts'
import { MockService } from './mock/mock-service'

export type DataSource = 'mock' | 'api'

/** 统一服务接口（冻结契约 9 端点）：MockService 与 RealService 均实现 */
export interface AppService {
  getBootstrap(): Promise<BootstrapData>
  getTaxonomies(): Promise<Taxonomies>
  listDrinks(params?: ListDrinksQuery): Promise<DrinkPage>
  getDrinkDetail(id: string): Promise<DrinkDetail>
  recommend(payload: RecommendationRequest): Promise<RecommendationResult>
  compare(payload: CompareRequest): Promise<CompareResult>
  getProfile(): Promise<Profile>
  updatePreferences(payload: UpdatePreferencesRequest): Promise<Profile>
  toggleFavorite(drinkId: string): Promise<FavoriteToggleResult>
  addHistory(drinkId: string): Promise<void>
  getScenes(): Promise<{ coffee: string[]; cocktail: string[] }>
  getCompareRows(): Promise<{ coffee: Array<{ key: string; label: string }>; cocktail: Array<{ key: string; label: string }> }>
  getDiscoveryScenes(): Promise<Array<{ id: string; scene: string; mode: 'coffee' | 'cocktail'; desc: string; homeScene: string }>>
  getKnowledge(): Promise<{ categories: Array<{ id: string; title: string; desc: string; mode: 'coffee' | 'cocktail' }>; articles: Record<string, { title: string; lead: string; points: string[] }> }>
}

/** 解析数据源：显式入参优先，其次全局控制台持久化选择（storage），否则读全局配置 */
export function resolveDataSource(override?: DataSource | string | null): DataSource {
  const value = override || storedDataSource() || APP_CONFIG.dataSource
  return value === 'mock' ? 'mock' : 'api'
}

/** 全局控制台「应用并刷新」写入的运行时数据源选择 */
function storedDataSource(): DataSource | null {
  try {
    if (typeof wx === 'undefined' || typeof wx.getStorageSync !== 'function') return null
    const value = wx.getStorageSync('awakeaglow:v6:data-source')
    return value === 'mock' || value === 'api' ? value : null
  } catch {
    return null
  }
}

/** 创建服务实例。resolve 到 'api' 时注入全局 API 配置（baseUrl/timeout/headers）。 */
export function createService(override?: DataSource | string | null): AppService {
  const dataSource = resolveDataSource(override)
  if (dataSource === 'mock') {
    return new MockService()
  }
  return new RealService({
    apiBaseUrl: APP_CONFIG.apiBaseUrl,
    timeoutMs: APP_CONFIG.timeoutMs,
    requestHeaders: APP_CONFIG.requestHeaders,
  })
}

/** 便捷访问：全局单例服务（App onLaunch 按需覆盖） */
export const service: AppService = createService()


// ---------- ServiceBundle（V8 三接口模式）----------

/**
 * 服务包：按领域拆分为 auth/drinks/users。
 * 旧代码可继续用 `service` 单例（AppService）；新代码推荐用 `services()` 获取 ServiceBundle。
 */
export function services(): ServiceBundle {
  return {
    auth: {
      async login(_code: string, _installIdentity: string) {
        throw new Error('Auth not implemented for current data source')
      },
      async refresh(_refreshToken: string) {
        throw new Error('Auth not implemented for current data source')
      },
    },
    drinks: service as unknown as DrinkService,
    users: service as unknown as UserService,
  }
}

export type { AuthService, DrinkService, UserService, ServiceBundle } from './contracts'
