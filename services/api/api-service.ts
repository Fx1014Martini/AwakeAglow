/**
 * v1 RealService：页面契约适配当前 BFF `server/app_v1`。
 *
 * BFF 基础路径为 /api/v1，数据库为 workspace/db/awakeaglow_v6_simple.db。
 * 页面只消费 lib/contracts.ts，避免把 v1 的 HTTP 形状泄漏到 UI。
 */
import type {
  BootstrapData,
  CompareRequest,
  CompareResult,
  DrinkDetail,
  DrinkPage,
  DrinkSummary,
  FavoriteToggleResult,
  FilterGroup,
  ListDrinksQuery,
  Profile,
  RecommendationRequest,
  RecommendationResult,
  Taxonomies,
  UpdatePreferencesRequest,
} from '../../lib/contracts'
import { HttpClient, type HttpClientConfig } from './http-client'

const LOCAL_IMAGE_BY_ID: Record<string, string> = {
  'coffee-latte': '/assets/images/latte.webp',
  'coffee-oat-latte': '/assets/images/oat-latte.webp',
  'coffee-cappuccino': '/assets/images/cappuccino.webp',
  'coffee-flat-white': '/assets/images/flat-white.webp',
  'coffee-cold-brew': '/assets/images/cold-brew.webp',
  'coffee-pour-over': '/assets/images/pour-over.jpg',
  'cocktail-manhattan': '/assets/images/manhattan.webp',
  'cocktail-mojito': '/assets/images/mojito.webp',
  'cocktail-margarita': '/assets/images/margarita.webp',
  'cocktail-whiskey-sour': '/assets/images/whisky-sour.webp',
}

const LOCAL_POSTER_BY_ID: Record<string, string> = {
  'coffee-oat-latte': '/assets/images/posters/coffee-oat-latte-hero.webp',
  'coffee-cold-brew': '/assets/images/posters/coffee-cold-brew-hero.webp',
  'coffee-pour-over': '/assets/images/posters/coffee-pour-over-hero.webp',
  'coffee-latte': '/assets/images/posters/coffee-latte-hero.webp',
  'coffee-flat-white': '/assets/images/posters/coffee-flat-white-hero.webp',
  'coffee-cappuccino': '/assets/images/posters/coffee-cappuccino-hero.webp',
  'coffee-americano': '/assets/images/posters/coffee-americano-hero.webp',
  'coffee-espresso': '/assets/images/posters/coffee-espresso-hero.webp',
  'coffee-coconut-latte': '/assets/images/posters/coffee-coconut-latte-hero.webp',
  'cocktail-mojito': '/assets/images/posters/cocktail-mojito-hero.webp',
  'cocktail-margarita': '/assets/images/posters/cocktail-margarita-hero.webp',
  'cocktail-manhattan': '/assets/images/posters/cocktail-manhattan-hero.webp',
  'cocktail-whiskey-sour': '/assets/images/posters/cocktail-whiskey-sour-hero.webp',
  'cocktail-negroni': '/assets/images/posters/cocktail-negroni-hero.webp',
  'cocktail-espresso-martini': '/assets/images/posters/cocktail-espresso-martini-hero.webp',
  'cocktail-french-75': '/assets/images/posters/cocktail-french75-hero.webp',
}

/**
 * Wikimedia Special:Redirect 是 301 跳转页，微信 <image> 不跟随重定向，回退 placeholder。
 * Wikimedia upload 的 .tif/.tiff 原图微信 <image> 不支持，也回退 placeholder。
 * 其他 URL 原样返回。
 */
function normalizeImageUrl(url: string): string {
  if (!url) return url
  if (/^https:\/\/commons\.wikimedia\.org\/wiki\/Special:Redirect\/file\//i.test(url)) {
    return '/assets/images/placeholder.jpg'
  }
  if (/^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/[0-9a-f]\/[0-9a-f]{2}\/[^/]+\.(tif|tiff)$/i.test(url)) {
    return '/assets/images/placeholder.jpg'
  }
  return url
}

function imageUrl(value: unknown, id?: string): string {
  return LOCAL_IMAGE_BY_ID[id || ''] || normalizeImageUrl(String(value || '/assets/images/placeholder.jpg'))
}

function posterUrl(value: unknown, id?: string): string {
  return LOCAL_POSTER_BY_ID[id || ''] || imageUrl(value, id)
}

function toSummary(raw: any, fallbackMode?: 'coffee' | 'cocktail'): DrinkSummary {
  const mode = raw?.mode === 'cocktail' || fallbackMode === 'cocktail' ? 'cocktail' : 'coffee'
  const attributes = { ...(raw?.attributes || {}) } as Record<string, string | string[]>
  // BFF 保留“含乳”作为数据事实；小程序菜单的用户语言是“牛奶”，在适配层统一。
  if (mode === 'coffee' && attributes.milk === '含乳') attributes.milk = '牛奶'
  return {
    id: String(raw?.id || raw?.code || ''),
    mode,
    category: mode === 'coffee' ? 'COFFEE' : 'COCKTAIL',
    nameZh: String(raw?.nameZh || raw?.name_zh || ''),
    nameEn: String(raw?.nameEn || raw?.name_en || ''),
    intro: String(raw?.intro || raw?.summary || ''),
    imageUrl: imageUrl(raw?.imageUrl || raw?.image_url, String(raw?.id || raw?.code || '')),
    posterUrl: posterUrl(raw?.posterUrl || raw?.poster_url, String(raw?.id || raw?.code || '')),
    tags: Array.isArray(raw?.tags) ? raw.tags.map((tag: any) => String(tag?.label || tag?.name_zh || tag)).filter(Boolean) : [],
    scene: Array.isArray(raw?.scene) ? raw.scene.map(String) : [],
    recommendationScore: Number(raw?.recommendationScore ?? raw?.recommendation_score ?? 0),
    attributes,
  }
}

function toDetail(raw: any, fallbackMode?: 'coffee' | 'cocktail'): DrinkDetail {
  const summary = toSummary(raw, fallbackMode)
  const ingredients = Array.isArray(raw?.ingredients)
    ? raw.ingredients.map((item: any) => ({
        nameZh: String(item?.nameZh || item?.name_zh || ''),
        nameEn: String(item?.nameEn || item?.name_en || ''),
        amount: Number(item?.amount ?? 0),
        unit: String(item?.unit || 'piece').toLowerCase() as any,
        role: item?.role,
      }))
    : []
  return {
    ...summary,
    description: String(raw?.description || summary.intro),
    posterUrl: posterUrl(raw?.posterUrl || raw?.poster_url || summary.imageUrl, summary.id),
    ingredients,
    steps: Array.isArray(raw?.steps) ? raw.steps.map(String) : [],
    radar: Array.isArray(raw?.radar)
      ? raw.radar.map((item: any) => ({ key: String(item?.key || item?.code || ''), label: String(item?.label || item?.name_zh || ''), score: Number(item?.score || 0) }))
      : [],
    similarIds: Array.isArray(raw?.similarIds) ? raw.similarIds.map(String) : [],
    similar: Array.isArray(raw?.similar) ? raw.similar.map((item: any) => toSummary(item, summary.mode)) : [],
    sourceInfo: {
      sourceLevel: raw?.sourceInfo?.sourceLevel || 'B',
      updatedAt: String(raw?.sourceInfo?.updatedAt || ''),
      reviewed: raw?.sourceInfo?.reviewed !== false,
    },
  }
}

function taxonomies(raw: any): Taxonomies {
  const map = (mode: 'coffee' | 'cocktail'): FilterGroup[] =>
    (Array.isArray(raw?.[mode]) ? raw[mode] : []).map((group: any) => ({
      key: String(group?.key || ''),
      label: String(group?.label || group?.key || ''),
      options: Array.isArray(group?.options)
        ? group.options.map((option: any) => ({
            value: String(option?.value || option?.label || ''),
            label: String(option?.label || option?.value || ''),
            enabled: true,
          }))
        : [],
    }))
  return { coffee: map('coffee'), cocktail: map('cocktail') }
}

export class RealService {
  private http: HttpClient
  private searchChain: Promise<unknown> = Promise.resolve()

  constructor(config: HttpClientConfig = {}) {
    this.http = new HttpClient(config)
  }

  async getBootstrap(): Promise<BootstrapData> {
    const data = await this.http.get<any>('/bootstrap')
    return {
      taxonomies: taxonomies(data?.taxonomies),
      profile: this.toProfile(data?.profile),
      featured: Array.isArray(data?.featured) ? data.featured.map((item: any) => toSummary(item, undefined)) : [],
    }
  }

  async getTaxonomies(): Promise<Taxonomies> {
    return taxonomies(await this.http.get<any>('/taxonomies'))
  }

  listDrinks(params: ListDrinksQuery = { mode: 'coffee' }): Promise<DrinkPage> {
    return new Promise<DrinkPage>((resolve, reject) => {
      const task = this.searchChain.then(() => this.fetchDrinks(params))
      this.searchChain = task.catch(() => undefined)
      task.then(resolve, reject)
    })
  }

  async getDrinkDetail(id: string): Promise<DrinkDetail> {
    return toDetail(await this.http.get<any>(`/drinks/${encodeURIComponent(id)}`), undefined)
  }

  async getSimilar(id: string, limit = 5): Promise<DrinkDetail[]> {
    const detail = await this.getDrinkDetail(id)
    const summaries = (detail.similar || []).slice(0, Math.max(3, Math.min(10, limit)))
    return Promise.all(summaries.map((item) => this.getDrinkDetail(item.id)))
  }

  async recommend(payload: RecommendationRequest): Promise<RecommendationResult> {
    const data = await this.http.post<any>('/recommendations', {
      mode: payload.mode,
      scene: payload.scene,
      preferences: payload.preferences || [],
      excludedDrinkIds: payload.excludedDrinkIds || [],
    })
    return { drink: toDetail(data?.drink, payload.mode), reasons: Array.isArray(data?.reasons) ? data.reasons.map(String) : [] }
  }

  async compare(payload: CompareRequest): Promise<CompareResult> {
    if (payload.drinkIds.length !== 2) throw Object.assign(new Error('对比必须选择两款饮品'), { code: 'COMPARE_REQUIRES_TWO', status: 400 })
    const data = await this.http.post<any>('/comparisons', { drinkIds: payload.drinkIds })
    return {
      items: Array.isArray(data?.items) ? data.items.map((item: any) => toDetail(item, undefined)) : [],
      conclusion: Array.isArray(data?.conclusion) ? data.conclusion.map(String) : [],
    }
  }

  async getProfile(): Promise<Profile> {
    return this.toProfile(await this.http.get<any>('/profile'))
  }

  async updatePreferences(payload: UpdatePreferencesRequest): Promise<Profile> {
    return this.toProfile(await this.http.put<any>('/profile/preferences', { mode: payload.mode, values: [...new Set(payload.values.map(String))] }))
  }

  async toggleFavorite(drinkId: string): Promise<FavoriteToggleResult> {
    const data = await this.http.post<any>(`/favorites/${encodeURIComponent(drinkId)}/toggle`, {})
    return { favorite: Boolean(data?.favorite), favorites: Array.isArray(data?.favorites) ? data.favorites.map(String) : [] }
  }

  /** v1 在 GET /drinks/{id} 时由 BFF 自动记录历史，前端无需重复写入。 */
  async addHistory(_drinkId: string): Promise<void> {}

  /** 场景字典：GET /scenes（drink.scene_json 聚合） */
  async getScenes(): Promise<{ coffee: string[]; cocktail: string[] }> {
    return await this.http.get<any>('/scenes')
  }

  /** 对比维度：GET /compare-rows（taxonomy groups + scene） */
  async getCompareRows(): Promise<{ coffee: Array<{ key: string; label: string }>; cocktail: Array<{ key: string; label: string }> }> {
    return await this.http.get<any>('/compare-rows')
  }

  /** 发现场景：GET /discovery-scenes（含 homeScene 映射） */
  async getDiscoveryScenes(): Promise<Array<{ id: string; scene: string; mode: 'coffee' | 'cocktail'; desc: string; homeScene: string }>> {
    return await this.http.get<any>('/discovery-scenes')
  }

  /** 知识百科：GET /knowledge（分类 + 文章内容） */
  async getKnowledge(): Promise<{ categories: Array<{ id: string; title: string; desc: string; mode: 'coffee' | 'cocktail' }>; articles: Record<string, { title: string; lead: string; points: string[] }> }> {
    return await this.http.get<any>('/knowledge')
  }

  private toProfile(raw: any): Profile {
    return {
      id: String(raw?.id || 'anonymous'),
      displayName: String(raw?.displayName || '匿名访客'),
      avatarUrl: raw?.avatarUrl ? String(raw.avatarUrl) : undefined,
      avatarText: String(raw?.avatarText || 'A').slice(0, 2),
      favorites: Array.isArray(raw?.favorites) ? raw.favorites.map(String) : [],
      history: Array.isArray(raw?.history) ? raw.history.map(String) : [],
      coffeePreferences: Array.isArray(raw?.coffeePreferences) ? raw.coffeePreferences.map(String) : [],
      cocktailPreferences: Array.isArray(raw?.cocktailPreferences) ? raw.cocktailPreferences.map(String) : [],
    }
  }

  private async fetchDrinks(params: ListDrinksQuery): Promise<DrinkPage> {
    // filters 的 want/exclude 为固定字典值（菜单展示值），BFF 统一映射到数据库 attributes 值域
    const data = await this.http.get<any>('/drinks', {
      mode: params.mode,
      keyword: params.keyword || undefined,
      filters: params.filters && Object.keys(params.filters).length ? JSON.stringify(params.filters) : undefined,
      sort: params.sort || 'recommendation',
      page: params.page || 1,
      pageSize: Math.min(params.pageSize || 20, 100),
    })
    const items = Array.isArray(data?.items) ? data.items.map((item: any) => toSummary(item, params.mode)) : []
    return {
      items,
      page: Number(data?.page || params.page || 1),
      pageSize: Number(data?.pageSize || params.pageSize || 20),
      total: Number(data?.total || items.length),
      hasMore: Boolean(data?.hasMore),
    }
  }
}
