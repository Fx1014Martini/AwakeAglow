/**
 * Mock 数据：10 款饮品（6 咖啡 + 4 鸡尾酒）。
 *
 * 字段即冻结契约（openapi/openapi.yaml）DrinkDetail/Profile/Taxonomies 形状，无翻译层：
 * id/mode/category/nameZh/nameEn/intro/imageUrl/posterUrl/tags/scene/recommendationScore/attributes/description/ingredients/steps/radar/similarIds/sourceInfo。
 * id 与产品 code 对齐（coffee-* / cocktail-*，DECISIONS §1），保证 mock/api 可切换。
 */

import type {
  DrinkDetail,
  FilterGroup,
  FilterOption,
  Profile,
  RadarMetric,
  Taxonomies,
} from '../../lib/contracts'

/** Mock 饮品即契约 DrinkDetail（含可选 similar，getDrinkDetail 时内联填充） */
export type MockDrink = DrinkDetail
export type MockProfile = Profile

const option = (label: string): FilterOption => ({ value: label, label })

/** 筛选字典种子（options 为中文 label，与原型 TAXONOMIES 逐字一致） */
interface TaxonomySeedGroup {
  key: string
  label: string
  options: string[]
}

interface TaxonomySeed {
  coffee: TaxonomySeedGroup[]
  cocktail: TaxonomySeedGroup[]
}

const TAXONOMY_GROUPS: TaxonomySeed = {
  coffee: [
    { key: 'coffeeType', label: '咖啡类型', options: ['浓缩咖啡', '黑咖啡', '奶咖', '手冲咖啡', '冷萃咖啡', '咖啡特调'] },
    { key: 'milk', label: '奶类选择', options: ['无奶', '牛奶', '燕麦奶', '椰奶', '其他植物奶', '奶油'] },
    { key: 'sweetBitter', label: '甜苦程度', options: ['不甜低苦', '不甜偏苦', '微甜低苦', '微甜偏苦', '偏甜低苦', '偏甜偏苦'] },
    { key: 'temperature', label: '饮用温度', options: ['热饮', '冰饮', '常温'] },
    { key: 'caffeine', label: '咖啡因', options: ['无咖啡因', '低咖啡因', '中等咖啡因', '较高咖啡因', '高咖啡因'] },
  ],
  cocktail: [
    { key: 'baseSpirit', label: '基酒', options: ['金酒', '伏特加', '朗姆酒', '威士忌', '龙舌兰/梅斯卡尔', '白兰地', '无单一基酒'] },
    { key: 'cocktailType', label: '鸡尾酒类型', options: ['高球长饮', '酸甜短饮', '烈酒短饮', '气泡型', '热带果汁型', '咖啡/甜点型', '热鸡尾酒'] },
    { key: 'flavor', label: '风味倾向', options: ['酸味明显', '甜味明显', '苦味明显', '辛辣刺激', '酸甜平衡', '甜苦平衡', '偏干不甜'] },
    { key: 'abv', label: '成品酒精度', options: ['无酒精', '低度≤10%', '中度＞10%～20%', '较高＞20%～30%', '高度＞30%'] },
    { key: 'extra', label: '其他主要成分', options: ['柠檬/青柠', '其他水果', '苏打/汤力', '咖啡', '奶/奶油', '蛋清', '姜辣香料', '无明显非酒精成分'] },
  ],
}

/** 契约 FilterGroup.options 为 FilterOption[]：label 即 value（筛选语义按中文 label 匹配） */
const toFilterGroup = (group: TaxonomySeedGroup): FilterGroup => ({
  key: group.key,
  label: group.label,
  options: group.options.map((label) => option(label)),
})

export const TAXONOMIES: Taxonomies = {
  coffee: TAXONOMY_GROUPS.coffee.map(toFilterGroup),
  cocktail: TAXONOMY_GROUPS.cocktail.map(toFilterGroup),
}

const r = (key: string, label: string, score: number): RadarMetric => ({ key, label, score })

export const DRINKS: MockDrink[] = [
  {
    id: 'coffee-oat-latte', mode: 'coffee', category: 'COFFEE', nameZh: '燕麦拿铁', nameEn: 'Oat Latte',
    intro: '柔和顺滑，燕麦的自然甜感与浓缩完美平衡。',
    description: '燕麦的自然香甜与浓缩咖啡的醇厚相遇，口感顺滑柔和。无需复杂判断，它适合需要专注、又不想承受明显苦感的日常时刻。',
    imageUrl: '/assets/images/oat-latte.webp', posterUrl: '/assets/images/oat-latte.jpg', recommendationScore: 94,
    tags: ['奶咖', '燕麦奶', '微甜低苦', '中等咖啡因', '热饮'], scene: ['专注办公', '早餐搭配', '上午'],
    attributes: { coffeeType: '奶咖', milk: '燕麦奶', sweetBitter: '微甜低苦', temperature: '热饮', caffeine: '中等咖啡因' },
    ingredients: [
      { nameZh: '浓缩咖啡', nameEn: 'Espresso', amount: 60, unit: 'ml', role: '咖啡骨架' },
      { nameZh: '燕麦奶', nameEn: 'Oat Milk', amount: 210, unit: 'ml', role: '主体与甜感' },
      { nameZh: '细腻奶泡', nameEn: 'Milk Foam', amount: 40, unit: 'ml', role: '触感' },
    ],
    steps: ['预热杯具并萃取 60ml 浓缩咖啡，建议萃取时间 25–30 秒。', '将燕麦奶加热至 55–60°C，打发出均匀细腻的微泡。', '先将燕麦奶缓慢倒入杯中，让液面稳定。', '沿杯壁注入浓缩咖啡，再以细流完成融合。', '轻晃杯体后饮用，避免温度过高掩盖燕麦甜感。'],
    radar: [r('SWEETNESS', '甜感', 9), r('BITTERNESS', '苦度', 4), r('ACIDITY', '酸度', 3), r('BODY', '醇厚度', 8), r('ROAST', '烘焙感', 4), r('REFRESHING', '清爽度', 5)],
    similarIds: ['coffee-latte', 'coffee-flat-white', 'coffee-cappuccino'],
    sourceInfo: { sourceLevel: 'A', updatedAt: '2026-08-05', reviewed: true },
  },
  {
    id: 'coffee-cold-brew', mode: 'coffee', category: 'COFFEE', nameZh: '冷萃咖啡', nameEn: 'Cold Brew',
    intro: '低温慢萃，口感清爽纯粹，低酸回甘。', description: '以低温和时间替代高温萃取，苦感更克制，香气更柔和。适合夏日、通勤和需要长时间清醒的场景。',
    imageUrl: '/assets/images/cold-brew.webp', posterUrl: '/assets/images/cold-brew.jpg', recommendationScore: 92,
    tags: ['黑咖啡', '冷萃咖啡', '不甜偏苦', '中等咖啡因', '冰饮'], scene: ['夏日消暑', '户外出行', '通勤'],
    attributes: { coffeeType: '冷萃咖啡', milk: '无奶', sweetBitter: '不甜偏苦', temperature: '冰饮', caffeine: '中等咖啡因' },
    ingredients: [
      { nameZh: '中度烘焙咖啡粉', nameEn: 'Coffee', amount: 70, unit: 'g', role: '主体' },
      { nameZh: '过滤水', nameEn: 'Water', amount: 700, unit: 'ml', role: '萃取介质' },
      { nameZh: '冰块', nameEn: 'Ice', amount: 6, unit: 'piece', role: '降温' },
    ],
    steps: ['咖啡豆研磨至粗砂糖颗粒。', '按 1:10 粉水比混合并充分浸润。', '冷藏浸泡 12–16 小时。', '使用滤纸或滤布缓慢过滤。', '加冰后按喜好兑水饮用。'],
    radar: [r('SWEETNESS', '甜感', 4), r('BITTERNESS', '苦度', 7), r('ACIDITY', '酸度', 3), r('BODY', '醇厚度', 6), r('ROAST', '烘焙感', 6), r('REFRESHING', '清爽度', 8)],
    similarIds: ['coffee-pour-over', 'coffee-latte'],
    sourceInfo: { sourceLevel: 'A', updatedAt: '2026-08-05', reviewed: true },
  },
  {
    id: 'coffee-pour-over', mode: 'coffee', category: 'COFFEE', nameZh: '手冲咖啡', nameEn: 'Pour Over',
    intro: '风味层次丰富，感受咖啡豆的原始魅力。', description: '通过水温、研磨与注水节奏控制萃取，更适合愿意花几分钟理解风味的人。',
    imageUrl: '/assets/images/pour-over.webp', posterUrl: '/assets/images/pour-over.jpg', recommendationScore: 90,
    tags: ['手冲咖啡', '无奶', '不甜偏苦', '热饮', '中等咖啡因'], scene: ['周末学习', '独处', '风味探索'],
    attributes: { coffeeType: '手冲咖啡', milk: '无奶', sweetBitter: '不甜偏苦', temperature: '热饮', caffeine: '中等咖啡因' },
    ingredients: [
      { nameZh: '咖啡豆', nameEn: 'Coffee', amount: 15, unit: 'g' },
      { nameZh: '热水', nameEn: 'Water', amount: 240, unit: 'ml' },
    ],
    steps: ['滤纸润洗并预热器具。', '中细研磨 15g 咖啡豆。', '以 30g 水闷蒸 30 秒。', '分三段稳定注水至 240g。', '总萃取时间控制在 2:30–3:00。'],
    radar: [r('SWEETNESS', '甜感', 5), r('BITTERNESS', '苦度', 5), r('ACIDITY', '酸度', 7), r('BODY', '醇厚度', 5), r('ROAST', '烘焙感', 6), r('REFRESHING', '清爽度', 6)],
    similarIds: ['coffee-cold-brew'],
    sourceInfo: { sourceLevel: 'A', updatedAt: '2026-08-05', reviewed: true },
  },
  {
    id: 'coffee-latte', mode: 'coffee', category: 'COFFEE', nameZh: '经典拿铁', nameEn: 'Caffè Latte',
    intro: '咖啡与牛奶的经典平衡。', description: '稳定、柔和、适合大多数日常时刻。',
    imageUrl: '/assets/images/latte.webp', posterUrl: '/assets/images/latte.jpg', recommendationScore: 89,
    tags: ['奶咖', '牛奶', '微甜低苦', '中等咖啡因', '热饮'], scene: ['日常', '早餐'],
    attributes: { coffeeType: '奶咖', milk: '牛奶', sweetBitter: '微甜低苦', temperature: '热饮', caffeine: '中等咖啡因' },
    ingredients: [
      { nameZh: '浓缩咖啡', nameEn: 'Espresso', amount: 30, unit: 'ml', role: '咖啡骨架' },
      { nameZh: '牛奶', nameEn: 'Milk', amount: 240, unit: 'ml', role: '主体' },
      { nameZh: '奶泡', nameEn: 'Milk Foam', amount: 20, unit: 'ml', role: '触感' },
    ],
    steps: ['萃取 30ml 浓缩咖啡。', '牛奶加热至 60–65°C 并打出细泡。', '先倒入牛奶，再注入浓缩咖啡。'],
    radar: [r('SWEETNESS', '甜感', 7), r('BITTERNESS', '苦度', 4), r('ACIDITY', '酸度', 3), r('BODY', '醇厚度', 7), r('ROAST', '烘焙感', 5), r('REFRESHING', '清爽度', 4)],
    similarIds: ['coffee-oat-latte'],
    sourceInfo: { sourceLevel: 'B', updatedAt: '2026-08-05', reviewed: true },
  },
  {
    id: 'coffee-flat-white', mode: 'coffee', category: 'COFFEE', nameZh: '馥芮白', nameEn: 'Flat White',
    intro: '更浓郁的咖啡感与细腻奶泡。', description: '比拿铁更突出浓缩咖啡，同时保持顺滑触感。',
    imageUrl: '/assets/images/flat-white.webp', posterUrl: '/assets/images/flat-white.jpg', recommendationScore: 91,
    tags: ['奶咖', '牛奶', '不甜偏苦', '较高咖啡因', '热饮'], scene: ['专注', '上午'],
    attributes: { coffeeType: '奶咖', milk: '牛奶', sweetBitter: '不甜偏苦', temperature: '热饮', caffeine: '较高咖啡因' },
    ingredients: [
      { nameZh: '浓缩咖啡', nameEn: 'Espresso', amount: 45, unit: 'ml', role: '咖啡骨架' },
      { nameZh: '牛奶', nameEn: 'Milk', amount: 180, unit: 'ml', role: '主体' },
    ],
    steps: ['萃取 45ml 浓缩咖啡。', '牛奶加热至 55–60°C 打出细密奶泡。', '先倒奶再倒咖啡，杯量更小咖啡感更足。'],
    radar: [r('SWEETNESS', '甜感', 5), r('BITTERNESS', '苦度', 7), r('ACIDITY', '酸度', 4), r('BODY', '醇厚度', 8), r('ROAST', '烘焙感', 6), r('REFRESHING', '清爽度', 4)],
    similarIds: ['coffee-oat-latte'],
    sourceInfo: { sourceLevel: 'B', updatedAt: '2026-08-05', reviewed: true },
  },
  {
    id: 'coffee-cappuccino', mode: 'coffee', category: 'COFFEE', nameZh: '卡布奇诺', nameEn: 'Cappuccino',
    intro: '奶泡丰富，咖啡香气集中。', description: '奶泡让入口更轻盈，但咖啡香气仍然突出。',
    imageUrl: '/assets/images/cappuccino.webp', posterUrl: '/assets/images/cappuccino.jpg', recommendationScore: 87,
    tags: ['奶咖', '牛奶', '不甜偏苦', '中等咖啡因', '热饮'], scene: ['早餐', '下午茶'],
    attributes: { coffeeType: '奶咖', milk: '牛奶', sweetBitter: '不甜偏苦', temperature: '热饮', caffeine: '中等咖啡因' },
    ingredients: [
      { nameZh: '浓缩咖啡', nameEn: 'Espresso', amount: 30, unit: 'ml', role: '咖啡骨架' },
      { nameZh: '牛奶', nameEn: 'Milk', amount: 120, unit: 'ml', role: '主体' },
      { nameZh: '奶泡', nameEn: 'Milk Foam', amount: 80, unit: 'ml', role: '触感' },
    ],
    steps: ['萃取 30ml 浓缩咖啡。', '打出厚实奶泡。', '咖啡与奶泡 1:1:1 比例分层倒入。'],
    radar: [r('SWEETNESS', '甜感', 5), r('BITTERNESS', '苦度', 6), r('ACIDITY', '酸度', 4), r('BODY', '醇厚度', 7), r('ROAST', '烘焙感', 6), r('REFRESHING', '清爽度', 4)],
    similarIds: ['coffee-oat-latte'],
    sourceInfo: { sourceLevel: 'B', updatedAt: '2026-08-05', reviewed: true },
  },
  {
    id: 'cocktail-cosmopolitan', mode: 'cocktail', category: 'COCKTAIL', nameZh: '大都会', nameEn: 'Cosmopolitan',
    intro: '清爽酸甜，微醺优雅，适合社交灵感。',
    description: '大都会是一款经典的现代鸡尾酒。蔓越莓的明亮果香、橙味利口酒与青柠共同建立清晰酸甜骨架，适合约会、晚宴和精致社交。',
    imageUrl: '/assets/images/cosmopolitan.webp', posterUrl: '/assets/images/cosmopolitan.jpg', recommendationScore: 95,
    tags: ['伏特加', '酸甜短饮', '酸甜平衡', '中度＞10%～20%', '柠檬/青柠'], scene: ['约会', '晚宴', '社交'],
    attributes: { baseSpirit: '伏特加', cocktailType: '酸甜短饮', flavor: '酸甜平衡', abv: '中度＞10%～20%', extra: ['柠檬/青柠', '其他水果'] },
    ingredients: [
      { nameZh: '伏特加', nameEn: 'Vodka', amount: 45, unit: 'ml', role: '基酒' },
      { nameZh: '蔓越莓汁', nameEn: 'Cranberry Juice', amount: 30, unit: 'ml', role: '果香与颜色' },
      { nameZh: '橙味利口酒', nameEn: 'Cointreau', amount: 15, unit: 'ml', role: '甜感与橙香' },
      { nameZh: '青柠汁', nameEn: 'Lime Juice', amount: 15, unit: 'ml', role: '酸度' },
    ],
    steps: ['预先冰镇马天尼杯。', '将伏特加、橙味利口酒、蔓越莓汁和青柠汁倒入雪克壶。', '加入大块冰，充分摇和约 10 秒。', '双重过滤倒入冰镇杯中。', '用橙皮扭香并装饰杯口。'],
    radar: [r('SWEETNESS', '甜度', 6), r('SOURNESS', '酸度', 8), r('BITTERNESS', '苦度', 2), r('ALCOHOL', '酒精感', 6), r('BODY', '酒体', 5), r('REFRESHING', '清爽度', 8)],
    similarIds: ['cocktail-margarita', 'cocktail-manhattan', 'cocktail-mojito'],
    sourceInfo: { sourceLevel: 'A', updatedAt: '2026-08-05', reviewed: true },
  },
  {
    id: 'cocktail-mojito', mode: 'cocktail', category: 'COCKTAIL', nameZh: '莫吉托', nameEn: 'Mojito',
    intro: '清新沁爽，薄荷青柠，一口惬意的微醺时光。',
    description: '白朗姆、青柠、薄荷与苏打组成清晰、低负担的长饮结构。',
    imageUrl: '/assets/images/mojito.webp', posterUrl: '/assets/images/mojito.jpg', recommendationScore: 93,
    tags: ['朗姆酒', '高球长饮', '酸味明显', '低度≤10%', '柠檬/青柠', '苏打/汤力'], scene: ['休闲', '聚会', '户外'],
    attributes: { baseSpirit: '朗姆酒', cocktailType: '高球长饮', flavor: '酸味明显', abv: '低度≤10%', extra: ['柠檬/青柠', '苏打/汤力'] },
    ingredients: [
      { nameZh: '白朗姆', nameEn: 'White Rum', amount: 45, unit: 'ml', role: '基酒' },
      { nameZh: '青柠汁', nameEn: 'Lime Juice', amount: 25, unit: 'ml', role: '酸度' },
      { nameZh: '糖浆', nameEn: 'Syrup', amount: 15, unit: 'ml', role: '甜感' },
      { nameZh: '苏打水', nameEn: 'Soda', amount: 80, unit: 'ml', role: '气泡' },
    ],
    steps: ['杯中轻拍薄荷释放香气。', '加入青柠汁与糖浆。', '加入碎冰和白朗姆搅拌。', '补满苏打水。', '薄荷枝与青柠角装饰。'],
    radar: [r('SWEETNESS', '甜度', 5), r('SOURNESS', '酸度', 7), r('BITTERNESS', '苦度', 1), r('ALCOHOL', '酒精感', 4), r('BODY', '酒体', 3), r('REFRESHING', '清爽度', 10)],
    similarIds: ['cocktail-gin-tonic', 'cocktail-cosmopolitan'],
    sourceInfo: { sourceLevel: 'A', updatedAt: '2026-08-05', reviewed: true },
  },
  {
    id: 'cocktail-gin-tonic', mode: 'cocktail', category: 'COCKTAIL', nameZh: '金汤力', nameEn: 'Gin & Tonic',
    intro: '干爽清冽，杜松与柑橘香气纯粹。',
    description: '金酒与汤力的高球结构，适合希望低甜、清爽又有草本香气的人。',
    imageUrl: '/assets/images/gin-tonic.webp', posterUrl: '/assets/images/gin-tonic.jpg', recommendationScore: 91,
    tags: ['金酒', '高球长饮', '偏干不甜', '低度≤10%', '苏打/汤力', '柠檬/青柠'], scene: ['商务', '餐前', '放松'],
    attributes: { baseSpirit: '金酒', cocktailType: '高球长饮', flavor: '偏干不甜', abv: '低度≤10%', extra: ['苏打/汤力', '柠檬/青柠'] },
    ingredients: [
      { nameZh: '金酒', nameEn: 'Gin', amount: 45, unit: 'ml', role: '基酒' },
      { nameZh: '汤力水', nameEn: 'Tonic', amount: 120, unit: 'ml', role: '气泡与草本' },
    ],
    steps: ['高球杯加满冰。', '加入金酒。', '沿吧匙加入冰镇汤力水。', '轻搅一次。', '青柠角装饰。'],
    radar: [r('SWEETNESS', '甜度', 2), r('SOURNESS', '酸度', 3), r('BITTERNESS', '苦度', 3), r('ALCOHOL', '酒精感', 5), r('BODY', '酒体', 3), r('REFRESHING', '清爽度', 9)],
    similarIds: ['cocktail-mojito'],
    sourceInfo: { sourceLevel: 'A', updatedAt: '2026-08-05', reviewed: true },
  },
  {
    id: 'cocktail-margarita', mode: 'cocktail', category: 'COCKTAIL', nameZh: '玛格丽特', nameEn: 'Margarita',
    intro: '龙舌兰与青柠的清晰酸香。', description: '咸味杯口增强酸甜层次，是经典酸酒结构。',
    imageUrl: '/assets/images/margarita.webp', posterUrl: '/assets/images/margarita.jpg', recommendationScore: 90,
    tags: ['龙舌兰/梅斯卡尔', '酸甜短饮', '酸味明显', '中度＞10%～20%', '柠檬/青柠'], scene: ['派对', '餐前'],
    attributes: { baseSpirit: '龙舌兰/梅斯卡尔', cocktailType: '酸甜短饮', flavor: '酸味明显', abv: '中度＞10%～20%', extra: '柠檬/青柠' },
    ingredients: [
      { nameZh: '龙舌兰', nameEn: 'Tequila', amount: 50, unit: 'ml', role: '基酒' },
      { nameZh: '橙味利口酒', nameEn: 'Cointreau', amount: 20, unit: 'ml', role: '甜感与橙香' },
      { nameZh: '青柠汁', nameEn: 'Lime Juice', amount: 20, unit: 'ml', role: '酸度' },
    ],
    steps: ['杯口沾盐。', '将龙舌兰、橙味利口酒与青柠汁倒入雪克壶。', '加冰摇和约 12 秒。', '滤入冰镇杯中。', '青柠角装饰。'],
    radar: [r('SWEETNESS', '甜度', 5), r('SOURNESS', '酸度', 9), r('BITTERNESS', '苦度', 2), r('ALCOHOL', '酒精感', 7), r('BODY', '酒体', 5), r('REFRESHING', '清爽度', 8)],
    similarIds: ['cocktail-cosmopolitan'],
    sourceInfo: { sourceLevel: 'B', updatedAt: '2026-08-05', reviewed: true },
  },
  {
    id: 'cocktail-manhattan', mode: 'cocktail', category: 'COCKTAIL', nameZh: '曼哈顿', nameEn: 'Manhattan',
    intro: '威士忌、甜味美思与苦精的成熟平衡。', description: '更偏烈酒、甜苦与香料，适合慢饮。',
    imageUrl: '/assets/images/manhattan.webp', posterUrl: '/assets/images/manhattan.jpg', recommendationScore: 88,
    tags: ['威士忌', '烈酒短饮', '甜苦平衡', '高度＞30%', '无明显非酒精成分'], scene: ['餐后', '独处', '商务'],
    attributes: { baseSpirit: '威士忌', cocktailType: '烈酒短饮', flavor: '甜苦平衡', abv: '高度＞30%', extra: '无明显非酒精成分' },
    ingredients: [
      { nameZh: '黑麦威士忌', nameEn: 'Rye Whiskey', amount: 60, unit: 'ml', role: '基酒' },
      { nameZh: '甜味美思', nameEn: 'Sweet Vermouth', amount: 30, unit: 'ml', role: '甜苦草本' },
      { nameZh: '苦精', nameEn: 'Angostura Bitters', amount: 2, unit: 'dash', role: '香气' },
    ],
    steps: ['冰镇马天尼杯。', '将所有原料倒入搅拌杯。', '加冰搅拌约 30 秒。', '滤入杯中。', '酒渍樱桃装饰。'],
    radar: [r('SWEETNESS', '甜度', 6), r('SOURNESS', '酸度', 1), r('BITTERNESS', '苦度', 6), r('ALCOHOL', '酒精感', 9), r('BODY', '酒体', 8), r('REFRESHING', '清爽度', 3)],
    similarIds: ['cocktail-cosmopolitan'],
    sourceInfo: { sourceLevel: 'B', updatedAt: '2026-08-05', reviewed: true },
  },
]

export const PROFILE: MockProfile = {
  id: 'demo-user',
  displayName: 'Awakener',
  avatarText: 'A',
  coffeePreferences: ['奶咖', '轻甜', '低苦', '中等咖啡因'],
  cocktailPreferences: ['低度友好', '果香清爽', '酸甜平衡', '金酒/伏特加'],
  favorites: ['coffee-oat-latte', 'coffee-cold-brew', 'coffee-pour-over', 'cocktail-cosmopolitan', 'cocktail-mojito', 'cocktail-gin-tonic'],
  history: ['coffee-flat-white', 'coffee-cold-brew', 'cocktail-manhattan', 'cocktail-cosmopolitan'],
}
