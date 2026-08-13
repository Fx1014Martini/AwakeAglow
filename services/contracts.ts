/**
 * Service Contract - 按领域拆分为 Auth / Drink / User 三接口。
 *
 * 参考V8 架构：页面只依赖接口，不耦合具体实现。
 * MockService 与 RealService 同构实现全部三个接口。
 * services/index.ts 的 services() 返回 ServiceBundle { auth, drinks, users }。
 *
 * 向后兼容：AppService（services/index.ts）聚合三个接口，旧代码可继续用 service.listDrinks() 等。
 */
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

/** 认证服务（API 模式启动时 bootstrapAuth 调用） */
export interface AuthService {
  /** 微信登录 code 换取业务 token */
  login(code: string, installIdentity: string): Promise<{ accessToken: string; refreshToken: string; expiresAt: number }>
  /** 刷新 token */
  refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string; expiresAt: number }>
}

/** 饮品服务（检索/详情/推荐/对比/字典） */
export interface DrinkService {
  getBootstrap(): Promise<BootstrapData>
  getTaxonomies(): Promise<Taxonomies>
  search(params: ListDrinksQuery): Promise<DrinkPage>
  /** 列表检索（search 别名，向后兼容） */
  listDrinks(params?: ListDrinksQuery): Promise<DrinkPage>
  getDetail(id: string): Promise<DrinkDetail>
  /** 详情（getDetail 别名，向后兼容） */
  getDrinkDetail(id: string): Promise<DrinkDetail>
  getSimilar(id: string, limit?: number): Promise<DrinkDetail[]>
  recommend(payload: RecommendationRequest): Promise<RecommendationResult>
  compare(payload: CompareRequest): Promise<CompareResult>
}

/** 用户服务（档案/偏好/收藏/历史） */
export interface UserService {
  getProfile(): Promise<Profile>
  updatePreferences(payload: UpdatePreferencesRequest): Promise<Profile>
  setFavorite(drinkId: string, favorite: boolean): Promise<FavoriteToggleResult>
  /** 收藏切换（setFavorite 的 toggle 语义，向后兼容） */
  toggleFavorite(drinkId: string): Promise<FavoriteToggleResult>
  getFavorites(): Promise<string[]>
  addHistory(drinkId: string): Promise<void>
}

/** 服务包：页面通过 services() 获取，按领域调用 */
export interface ServiceBundle {
  auth: AuthService
  drinks: DrinkService
  users: UserService
}
