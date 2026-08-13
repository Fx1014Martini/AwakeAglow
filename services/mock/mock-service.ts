/**
 * Mock 服务适配器。与 RealService 方法签名完全同构（冻结契约 lib/contracts.ts），页面只依赖统一接口。
 * 行为与 xingxun-responsive-prototype/js/api/mock-service.js 同构：
 * 本地筛选/排序/分页、相似关联、场景推荐加分、收藏切换与偏好更新。
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
} from '../../lib/contracts'
import { DRINKS, PROFILE, TAXONOMIES, type MockDrink, type MockProfile } from './mock-data'

const delay = (ms = 120): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

export class MockService {
  private profile: MockProfile

  constructor() {
    this.profile = clone(PROFILE)
  }

  async getBootstrap(): Promise<BootstrapData> {
    await delay(80)
    return {
      taxonomies: clone(TAXONOMIES),
      profile: clone(this.profile),
      featured: clone(DRINKS.filter((d) => d.recommendationScore >= 92)),
    }
  }

  async getTaxonomies(): Promise<Taxonomies> {
    await delay()
    return clone(TAXONOMIES)
  }

  async listDrinks(params?: ListDrinksQuery): Promise<DrinkPage> {
    await delay()
    const { mode, filters = {}, page = 1, pageSize = 20, sort = 'recommendation' } = params ?? {}
    const keyword = String(params?.keyword ?? '').trim().toLowerCase()
    let items = DRINKS.filter((item) => !mode || item.mode === mode)

    if (keyword) {
      items = items.filter((item) =>
        [item.nameZh, item.nameEn, item.intro, item.description || '', ...(item.tags || []), ...(item.scene || [])]
          .join(' ')
          .toLowerCase()
          .includes(keyword),
      )
    }

    Object.entries(filters || {}).forEach(([key, rule]) => {
      if (!rule) return
      const want = Array.isArray(rule.want) ? rule.want : []
      const exclude = Array.isArray(rule.exclude) ? rule.exclude : []
      items = items.filter((item) => {
        const raw = item.attributes?.[key]
        const values = Array.isArray(raw) ? raw : [raw].filter(Boolean)
        const wantPass = want.length === 0 || want.every((option) => values.includes(option))
        const excludePass = exclude.length === 0 || exclude.every((option) => !values.includes(option))
        return wantPass && excludePass
      })
    })

    if (sort === 'recommendation') items.sort((a, b) => b.recommendationScore - a.recommendationScore)
    if (sort === 'name') items.sort((a, b) => a.nameZh.localeCompare(b.nameZh, 'zh-CN'))

    const total = items.length
    const start = (page - 1) * pageSize
    const pagedItems = clone(items.slice(start, start + pageSize))
    return { items: pagedItems, page, pageSize, total, hasMore: start + pageSize < total }
  }

  async getDrinkDetail(id: string): Promise<DrinkDetail> {
    await delay()
    const item = DRINKS.find((d) => d.id === id)
    if (!item) throw Object.assign(new Error('饮品不存在'), { code: 'DRINK_NOT_FOUND', status: 404 })
    const similar = (item.similarIds || []).map((similarId) => DRINKS.find((d) => d.id === similarId)).filter((d): d is MockDrink => Boolean(d))
    return { ...clone(item), similar: clone(similar) }
  }

  async recommend(payload: RecommendationRequest): Promise<RecommendationResult> {
    await delay(180)
    const mode = payload.mode
    const candidates = DRINKS.filter((d) => d.mode === mode).filter((d) => !(payload.excludedDrinkIds || []).includes(d.id))
    const scene = String(payload.scene || '')
    const ranked = candidates
      .map((item) => {
        const sceneBonus = item.scene?.some((value) => scene.includes(value) || value.includes(scene)) ? 12 : 0
        return { item, score: item.recommendationScore + sceneBonus }
      })
      .sort((a, b) => b.score - a.score)
    const item = ranked[0]?.item || candidates[0]
    return {
      drink: clone(item),
      reasons: [`推荐指数 ${item.recommendationScore}%`, `与“${scene || '当前状态'}”更接近`, `风味标签：${item.tags.slice(0, 3).join('、')}`],
    }
  }

  async compare(payload: CompareRequest): Promise<CompareResult> {
    await delay()
    const ids = payload.drinkIds || []
    const items = ids.map((id) => DRINKS.find((d) => d.id === id)).filter((d): d is MockDrink => Boolean(d))
    if (items.length !== 2) throw Object.assign(new Error('对比必须选择两款饮品'), { code: 'COMPARE_REQUIRES_TWO', status: 400 })
    return {
      items: clone(items),
      conclusion: items[0].mode === 'coffee' ? ['更适合专注办公', '更适合夏日清爽'] : ['更适合社交优雅', '更适合轻松放松'],
    }
  }

  async getProfile(): Promise<Profile> {
    await delay()
    return clone(this.profile)
  }

  async updatePreferences(payload: UpdatePreferencesRequest): Promise<Profile> {
    await delay()
    if (payload.mode === 'coffee') this.profile.coffeePreferences = [...(payload.values || [])]
    if (payload.mode === 'cocktail') this.profile.cocktailPreferences = [...(payload.values || [])]
    return clone(this.profile)
  }

  async toggleFavorite(drinkId: string): Promise<FavoriteToggleResult> {
    await delay(60)
    const set = new Set(this.profile.favorites)
    if (set.has(drinkId)) {
      set.delete(drinkId)
    } else {
      set.add(drinkId)
    }
    this.profile.favorites = [...set]
    return { favorite: set.has(drinkId), favorites: clone(this.profile.favorites) }
  }

  async addHistory(drinkId: string): Promise<void> {
    await delay(20)
    this.profile.history = [drinkId, ...this.profile.history.filter((id) => id !== drinkId)].slice(0, 30)
  }

  async getScenes(): Promise<{ coffee: string[]; cocktail: string[] }> {
    await delay(60)
    return {
      coffee: ['下午茶', '夏季', '新手友好', '日常', '早午餐', '经典', '节日', '餐后'],
      cocktail: ['下午茶', '夏季', '开胃', '新手友好', '日常', '早午餐', '经典', '餐后'],
    }
  }

  async getCompareRows(): Promise<{ coffee: Array<{ key: string; label: string }>; cocktail: Array<{ key: string; label: string }> }> {
    await delay(60)
    return {
      coffee: [
        { key: 'coffeeType', label: '咖啡类型' },
        { key: 'milk', label: '奶类选择' },
        { key: 'sweetBitter', label: '甜苦程度' },
        { key: 'temperature', label: '饮用温度' },
        { key: 'caffeine', label: '咖啡因' },
        { key: 'scene', label: '适合场景' },
      ],
      cocktail: [
        { key: 'baseSpirit', label: '基酒' },
        { key: 'cocktailType', label: '鸡尾酒类型' },
        { key: 'flavor', label: '风味倾向' },
        { key: 'abv', label: '成品酒精度' },
        { key: 'extra', label: '其他主要成分' },
        { key: 'scene', label: '适合场景' },
      ],
    }
  }

  async getDiscoveryScenes(): Promise<Array<{ id: string; scene: string; mode: 'coffee' | 'cocktail'; desc: string; homeScene: string }>> {
    await delay(60)
    return [
      { id: 'morning-focus', scene: '晨间专注', mode: 'coffee', desc: '清醒开始一天，低苦醇厚', homeScene: '日常' },
      { id: 'afternoon-break', scene: '午后小憩', mode: 'coffee', desc: '柔和奶香，不抢注意力', homeScene: '下午茶' },
      { id: 'weekend-brew', scene: '周末手冲', mode: 'coffee', desc: '花时间理解风味层次', homeScene: '新手友好' },
      { id: 'social-night', scene: '社交夜晚', mode: 'cocktail', desc: '酸甜平衡，适合举杯', homeScene: '开胃' },
      { id: 'solo-relax', scene: '独处微醺', mode: 'cocktail', desc: '克制烈感，慢慢品', homeScene: '经典' },
      { id: 'party-fresh', scene: '派对清爽', mode: 'cocktail', desc: '高球长饮，清爽不腻', homeScene: '夏季' },
    ]
  }

  async getKnowledge(): Promise<{ categories: Array<{ id: string; title: string; desc: string; mode: 'coffee' | 'cocktail' }>; articles: Record<string, { title: string; lead: string; points: string[] }> }> {
    await delay(60)
    return {
      categories: [
        { id: 'coffee-basics', title: '咖啡基础', desc: '浓缩、手冲、奶咖的区别', mode: 'coffee' },
        { id: 'coffee-beans', title: '豆种与产地', desc: '阿拉比卡、罗布斯塔、产区风味', mode: 'coffee' },
        { id: 'coffee-brew', title: '冲煮参数', desc: '粉水比、研磨度、水温', mode: 'coffee' },
        { id: 'cocktail-basics', title: '鸡尾酒入门', desc: '基酒、技法、经典结构', mode: 'cocktail' },
        { id: 'cocktail-spirits', title: '六大基酒', desc: '金酒、伏特加、朗姆、威士忌、龙舌兰、白兰地', mode: 'cocktail' },
        { id: 'cocktail-iba', title: 'IBA 经典', desc: '国际调酒师协会官方配方', mode: 'cocktail' },
      ],
      articles: {
        'coffee-basics': { title: '咖啡基础', lead: '先理解结构，再选择风味。', points: ['浓缩是基底，风味集中、口感厚实。', '奶咖用牛奶或植物奶拉长口感，甜感更柔和。', '手冲强调豆子产地与冲煮参数，层次更清晰。'] },
        'coffee-beans': { title: '豆种与产地', lead: '同一杯咖啡，产区会改变它的性格。', points: ['阿拉比卡通常香气更复杂，罗布斯塔更醇厚有力。', '高海拔豆常见花香、果酸与更明亮的尾韵。', '深烘焙偏坚果、可可与焦糖，浅烘焙更突出产地风味。'] },
        'coffee-brew': { title: '冲煮参数', lead: '粉水比、研磨度和水温共同决定萃取。', points: ['研磨越细，萃取越快；苦涩时可适当调粗。', '水温高会带来更充分萃取，浅烘豆通常更适合高温。', '先固定粉水比，再一次只调整一个变量。'] },
        'cocktail-basics': { title: '鸡尾酒入门', lead: '基酒决定骨架，甜酸决定平衡。', points: ['先辨认基酒，再看甜、酸、苦与气泡的关系。', '摇和适合果汁、糖浆等需要充分融合的配方。', '搅拌保留清澈与丝滑口感，常用于烈酒型经典。'] },
        'cocktail-spirits': { title: '六大基酒', lead: '从基酒入门，是最快建立味觉地图的方法。', points: ['金酒带草本与杜松子香，伏特加干净中性。', '朗姆偏甘蔗与热带风味，威士忌常见木质、谷物和烟熏。', '龙舌兰有植物与泥土感，白兰地更偏果香与熟成。'] },
        'cocktail-iba': { title: 'IBA 经典', lead: '经典配方是理解鸡尾酒结构的共同语言。', points: ['先按标准配方体验，再根据个人口味微调。', '杯型、冰块和稀释量会显著影响最终口感。', '经典不是固定答案，而是一套可复用的平衡方法。'] },
      },
    }
  }
}
