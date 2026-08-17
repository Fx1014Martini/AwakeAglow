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

export const DRINKS: MockDrink[] = [
  {
    id: "coffee-espresso",
    mode: "coffee",
    category: "COFFEE",
    nameZh: "意式浓缩",
    nameEn: "Espresso",
    intro: "以意式配方咖啡豆在九个大气压下、约三十秒内萃取约二十五毫升的高浓度咖啡液，油脂绵密，是意式咖啡系列的经典基底。",
    description: "V6 标准采用意式配方豆 18 克出双份、单品浓缩按 8 克粉萃 25 毫升。本条目以单份浓缩为基准。",
    imageUrl: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Espresso.jpg",
    posterUrl: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Espresso.jpg",
    tags: [
      "浓缩基底",
      "热饮",
      "苦味明显",
      "浓缩",
      "醇厚/酒体饱满",
      "含咖啡因",
      "无乳配方"
    ],
    scene: [
      "日常",
      "下午茶",
      "经典"
    ],
    recommendationScore: 98,
    attributes: {
      "coffeeType": "浓缩咖啡",
      "milk": "无奶",
      "sweetBitter": "不甜偏苦",
      "temperature": "热饮",
      "caffeine": "中等咖啡因"
    },
    ingredients: [
      {
        "nameZh": "咖啡豆（意式配方）",
        "nameEn": "Coffee beans for espresso",
        "amount": 8,
        "unit": "g",
        "role": "意式配方细磨"
      },
      {
        "nameZh": "热过滤水",
        "nameEn": "Hot filtered water",
        "amount": 40,
        "unit": "ml",
        "role": "92-94°C 萃取用水"
      }
    ],
    steps: [
      "用电子秤称取 8 克意式配方咖啡豆并研磨成细粉。",
      "将咖啡粉布平并用压粉器压实至表面平整。",
      "用 92-94°C 的热水在 9 个大气压下萃取约 25 毫升浓缩液。",
      "萃取时间控制在 25-30 秒，观察油脂呈琥珀色即可停止。",
      "立即注入预热的小杯并饮用，以保留油脂与香气。"
    ],
    radar: [
      {
        "key": "ACIDITY",
        "label": "酸度",
        "score": 6.0
      },
      {
        "key": "BITTERNESS",
        "label": "苦度",
        "score": 8.0
      },
      {
        "key": "SWEETNESS",
        "label": "甜感",
        "score": 4.0
      },
      {
        "key": "BODY",
        "label": "醇厚度",
        "score": 9.0
      },
      {
        "key": "ROAST",
        "label": "烘焙感",
        "score": 8.0
      },
      {
        "key": "REFRESHING",
        "label": "清爽度",
        "score": 2.0
      }
    ],
    similarIds: [
      "coffee-americano"
    ],
    sourceInfo: {
      "sourceLevel": "B",
      "updatedAt": "2026-08-17",
      "reviewed": true
    }
  },
  {
    id: "coffee-americano",
    mode: "coffee",
    category: "COFFEE",
    nameZh: "美式咖啡",
    nameEn: "Caffè Americano",
    intro: "以双份意式浓缩加入热水稀释而成的黑咖啡，保留浓缩的烘焙香与油脂，同时降低浓度并增大杯量，口感比浓缩更轻盈。",
    description: "V6 标准为双份浓缩 36 克加 120 毫升热水。先加热水再加入浓缩可更完整保留表面油脂。",
    imageUrl: "http://127.0.0.1:8020/static/products/coffee-americano/card.webp?v=2026.08.1",
    posterUrl: "http://127.0.0.1:8020/static/products/coffee-americano/poster.webp?v=2026.08.1",
    tags: [
      "热饮",
      "黑咖啡",
      "浓缩基底",
      "无乳配方",
      "中等酒体",
      "日常"
    ],
    scene: [
      "日常"
    ],
    recommendationScore: 96,
    attributes: {
      "coffeeType": "黑咖啡",
      "milk": "无奶",
      "sweetBitter": "不甜低苦",
      "temperature": "热饮",
      "caffeine": "中等咖啡因"
    },
    ingredients: [
      {
        "nameZh": "热过滤水",
        "nameEn": "Hot filtered water",
        "amount": 120,
        "unit": "ml",
        "role": "88-94°C"
      },
      {
        "nameZh": "双份浓缩咖啡液",
        "nameEn": "Double espresso liquid",
        "amount": 36,
        "unit": "g",
        "role": "由 18 克咖啡粉萃取"
      }
    ],
    steps: [
      "预热容量不低于 180 毫升的杯子。",
      "向杯中加入 120 毫升、88-94°C 的热水。",
      "按意式浓缩标准萃取 36 克双份浓缩咖啡液。",
      "将浓缩缓慢倒入热水中，避免剧烈搅动。",
      "轻搅一次后立即饮用。"
    ],
    radar: [
      {
        "key": "ACIDITY",
        "label": "酸度",
        "score": 5.0
      },
      {
        "key": "BITTERNESS",
        "label": "苦度",
        "score": 6.0
      },
      {
        "key": "SWEETNESS",
        "label": "甜感",
        "score": 3.0
      },
      {
        "key": "BODY",
        "label": "醇厚度",
        "score": 4.0
      },
      {
        "key": "ROAST",
        "label": "烘焙感",
        "score": 7.0
      },
      {
        "key": "REFRESHING",
        "label": "清爽度",
        "score": 6.0
      }
    ],
    similarIds: [
      "coffee-pour-over",
      "coffee-espresso",
      "coffee-latte"
    ],
    sourceInfo: {
      "sourceLevel": "B",
      "updatedAt": "2026-08-17",
      "reviewed": true
    }
  },
  {
    id: "coffee-latte",
    mode: "coffee",
    category: "COFFEE",
    nameZh: "拿铁",
    nameEn: "Latte",
    intro: "以双份浓缩为基底，加入大量蒸热牛奶与薄层奶泡的奶咖，奶香柔和、口感顺滑，是奶味最突出的经典意式饮品。",
    description: "V6 标准为双份浓缩 36 克加热牛奶 180 毫升与约 1 厘米奶泡，奶咖比约 1 比 5。",
    imageUrl: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Latte%20art.jpg",
    posterUrl: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Latte%20art.jpg",
    tags: [
      "奶咖",
      "热饮",
      "奶油感",
      "顺滑",
      "日常",
      "早午餐"
    ],
    scene: [
      "日常",
      "早午餐"
    ],
    recommendationScore: 96,
    attributes: {
      "coffeeType": "奶咖",
      "milk": "牛奶",
      "sweetBitter": "微甜低苦",
      "temperature": "热饮",
      "caffeine": "中等咖啡因"
    },
    ingredients: [
      {
        "nameZh": "双份浓缩咖啡液",
        "nameEn": "Double espresso liquid",
        "amount": 36,
        "unit": "g",
        "role": "由 18 克咖啡粉萃取"
      },
      {
        "nameZh": "全脂牛奶",
        "nameEn": "Whole milk",
        "amount": 180,
        "unit": "ml",
        "role": "蒸热至 60-65°C"
      }
    ],
    steps: [
      "萃取 36 克双份浓缩咖啡液注入预热的大杯。",
      "将 180 毫升全脂牛奶蒸热至 60-65°C，打出细密奶泡。",
      "先倒入 120 g 牛奶，轻晃杯子使奶咖混合。",
      "将剩余 60 g 牛奶与奶泡沿杯缘注入，形成约 1 厘米奶泡层。",
      "按喜好做简单拉花后立即饮用。"
    ],
    radar: [
      {
        "key": "ACIDITY",
        "label": "酸度",
        "score": 3.0
      },
      {
        "key": "BITTERNESS",
        "label": "苦度",
        "score": 4.0
      },
      {
        "key": "SWEETNESS",
        "label": "甜感",
        "score": 7.0
      },
      {
        "key": "BODY",
        "label": "醇厚度",
        "score": 6.0
      },
      {
        "key": "ROAST",
        "label": "烘焙感",
        "score": 6.0
      },
      {
        "key": "REFRESHING",
        "label": "清爽度",
        "score": 4.0
      }
    ],
    similarIds: [
      "coffee-flat-white",
      "coffee-cappuccino",
      "coffee-oat-latte"
    ],
    sourceInfo: {
      "sourceLevel": "B",
      "updatedAt": "2026-08-17",
      "reviewed": true
    }
  },
  {
    id: "coffee-cappuccino",
    mode: "coffee",
    category: "COFFEE",
    nameZh: "卡布奇诺",
    nameEn: "Cappuccino",
    intro: "由浓缩、蒸奶与绵密奶泡各占约三分之一组成的奶咖，奶泡厚而干爽，咖啡香与奶香层次分明，口感绵密。",
    description: "V6 标准为双份浓缩 36 克、牛奶 60 毫升与厚奶泡，泡体丰盈可直接呈勺。",
    imageUrl: "http://127.0.0.1:8020/static/products/coffee-cappuccino/card.webp?v=2026.08.1",
    posterUrl: "http://127.0.0.1:8020/static/products/coffee-cappuccino/poster.webp?v=2026.08.1",
    tags: [
      "奶咖",
      "热饮",
      "泡沫质地",
      "奶油感",
      "经典",
      "早午餐"
    ],
    scene: [
      "经典",
      "早午餐"
    ],
    recommendationScore: 96,
    attributes: {
      "coffeeType": "奶咖",
      "milk": "牛奶",
      "sweetBitter": "微甜偏苦",
      "temperature": "热饮",
      "caffeine": "中等咖啡因"
    },
    ingredients: [
      {
        "nameZh": "双份浓缩咖啡液",
        "nameEn": "Double espresso liquid",
        "amount": 36,
        "unit": "g",
        "role": "由 18 克咖啡粉萃取"
      },
      {
        "nameZh": "全脂牛奶",
        "nameEn": "Whole milk",
        "amount": 120,
        "unit": "ml",
        "role": "其中 60 毫升蒸热，余下打成奶泡"
      }
    ],
    steps: [
      "萃取 36 克双份浓缩咖啡液注入预热的中杯。",
      "将 120 毫升全脂牛奶蒸热，打出绵密厚实的奶泡。",
      "先用勺挡住奶泡，把牛奶倒入浓缩中至半满。",
      "再舀入厚奶泡至杯满，使奶泡堆起高于杯口。",
      "可撒 1 g 可可粉或肉桂粉后立即饮用。"
    ],
    radar: [
      {
        "key": "ACIDITY",
        "label": "酸度",
        "score": 4.0
      },
      {
        "key": "BITTERNESS",
        "label": "苦度",
        "score": 5.0
      },
      {
        "key": "SWEETNESS",
        "label": "甜感",
        "score": 6.0
      },
      {
        "key": "BODY",
        "label": "醇厚度",
        "score": 6.0
      },
      {
        "key": "ROAST",
        "label": "烘焙感",
        "score": 7.0
      },
      {
        "key": "REFRESHING",
        "label": "清爽度",
        "score": 3.0
      }
    ],
    similarIds: [
      "coffee-flat-white",
      "coffee-latte"
    ],
    sourceInfo: {
      "sourceLevel": "B",
      "updatedAt": "2026-08-17",
      "reviewed": true
    }
  },
  {
    id: "coffee-flat-white",
    mode: "coffee",
    category: "COFFEE",
    nameZh: "馥芮白",
    nameEn: "Flat White",
    intro: "以双份浓缩与细滑微泡牛奶组成的小杯奶咖，奶泡极薄、奶量少于拿铁，突出咖啡本身风味，口感柔和顺滑。",
    description: "V6 标准为双份浓缩 36 克加热牛奶 150 毫升，薄奶泡约 3-5 毫米，拉花细腻。",
    imageUrl: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Flat%20white.jpg",
    posterUrl: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Flat%20white.jpg",
    tags: [
      "奶咖",
      "热饮",
      "顺滑",
      "奶油感",
      "早午餐",
      "下午茶"
    ],
    scene: [
      "早午餐",
      "下午茶"
    ],
    recommendationScore: 96,
    attributes: {
      "coffeeType": "奶咖",
      "milk": "牛奶",
      "sweetBitter": "微甜偏苦",
      "temperature": "热饮",
      "caffeine": "中等咖啡因"
    },
    ingredients: [
      {
        "nameZh": "双份浓缩咖啡液",
        "nameEn": "Double espresso liquid",
        "amount": 36,
        "unit": "g",
        "role": "由 18 克咖啡粉萃取"
      },
      {
        "nameZh": "全脂牛奶",
        "nameEn": "Whole milk",
        "amount": 150,
        "unit": "ml",
        "role": "蒸热至 55-60°C 打出微泡"
      }
    ],
    steps: [
      "萃取 36 克双份浓缩咖啡液注入预热的小杯。",
      "将 150 毫升全脂牛奶蒸热至 55-60°C，仅打出细小微泡。",
      "把牛奶与微泡一起匀速倒入浓缩中。",
      "以收尾点出细密奶泡，形成薄而光滑的表面。",
      "趁奶温合适立即饮用，无需额外装饰。"
    ],
    radar: [
      {
        "key": "ACIDITY",
        "label": "酸度",
        "score": 4.0
      },
      {
        "key": "BITTERNESS",
        "label": "苦度",
        "score": 5.0
      },
      {
        "key": "SWEETNESS",
        "label": "甜感",
        "score": 6.0
      },
      {
        "key": "BODY",
        "label": "醇厚度",
        "score": 5.0
      },
      {
        "key": "ROAST",
        "label": "烘焙感",
        "score": 7.0
      },
      {
        "key": "REFRESHING",
        "label": "清爽度",
        "score": 3.0
      }
    ],
    similarIds: [
      "coffee-latte",
      "coffee-cappuccino",
      "coffee-oat-latte"
    ],
    sourceInfo: {
      "sourceLevel": "B",
      "updatedAt": "2026-08-17",
      "reviewed": true
    }
  },
  {
    id: "coffee-cold-brew",
    mode: "coffee",
    category: "COFFEE",
    nameZh: "冷萃咖啡",
    nameEn: "Cold Brew Coffee",
    intro: "使用室温或冷水长时间浸泡粗研磨咖啡制成的冷咖啡，通常更圆润、苦感较低，可直接饮用或加冰。",
    description: "V6 样例以 60 g 咖啡和 300 g 水制得浓缩液，浸泡约 12 小时，再以 120 ml 浓缩液、80 ml 水和 80 g 冰组成一杯。咖啡水比与接触时间会影响浓度与咖啡因。",
    imageUrl: "http://127.0.0.1:8020/static/products/coffee-cold-brew/card.webp?v=2026.08.1",
    posterUrl: "http://127.0.0.1:8020/static/products/coffee-cold-brew/poster.webp?v=2026.08.1",
    tags: [
      "冷萃",
      "冷饮",
      "黑咖啡",
      "无乳配方",
      "顺滑",
      "低苦",
      "长时间制作",
      "清爽"
    ],
    scene: [
      "新手友好",
      "下午茶",
      "日常"
    ],
    recommendationScore: 97,
    attributes: {
      "coffeeType": "冷萃咖啡",
      "milk": "无奶",
      "sweetBitter": "微甜低苦",
      "temperature": "冰饮",
      "caffeine": "较高咖啡因"
    },
    ingredients: [
      {
        "nameZh": "中度烘焙咖啡豆",
        "nameEn": "Medium roast coffee beans",
        "amount": 60,
        "unit": "g",
        "role": "粗研磨"
      },
      {
        "nameZh": "室温过滤水",
        "nameEn": "Room-temperature filtered water",
        "amount": 300,
        "unit": "g",
        "role": "浸泡用"
      },
      {
        "nameZh": "冷萃浓缩液",
        "nameEn": "Cold brew concentrate",
        "amount": 120,
        "unit": "ml",
        "role": "由前两项过滤所得"
      },
      {
        "nameZh": "冷过滤水",
        "nameEn": "Cold filtered water",
        "amount": 80,
        "unit": "ml",
        "role": "稀释用"
      },
      {
        "nameZh": "冰块",
        "nameEn": "Ice cubes",
        "amount": 80,
        "unit": "g",
        "role": "饮用冰"
      }
    ],
    steps: [
      "将 60 g 咖啡豆粗研磨并放入洁净带盖容器。",
      "分次加入 300 g 室温过滤水，轻搅确保咖啡粉完全湿润。",
      "密封后在室温或冷藏环境浸泡约 12 小时。",
      "先用细筛过滤，再用纸滤二次过滤，得到冷萃浓缩液。",
      "杯中加入 80 g 冰和 80 ml 冷水。",
      "加入 120 ml 冷萃浓缩液并轻搅。",
      "未使用浓缩液应冷藏，并按食品安全规则设置保质期。"
    ],
    radar: [
      {
        "key": "ACIDITY",
        "label": "酸度",
        "score": 3.0
      },
      {
        "key": "BITTERNESS",
        "label": "苦度",
        "score": 4.0
      },
      {
        "key": "SWEETNESS",
        "label": "甜感",
        "score": 6.0
      },
      {
        "key": "BODY",
        "label": "醇厚度",
        "score": 7.0
      },
      {
        "key": "ROAST",
        "label": "烘焙感",
        "score": 6.0
      },
      {
        "key": "REFRESHING",
        "label": "清爽度",
        "score": 9.0
      }
    ],
    similarIds: [

    ],
    sourceInfo: {
      "sourceLevel": "B",
      "updatedAt": "2026-08-17",
      "reviewed": true
    }
  },
  {
    id: "coffee-pour-over",
    mode: "coffee",
    category: "COFFEE",
    nameZh: "手冲咖啡",
    nameEn: "Pour Over Coffee",
    intro: "用细嘴壶在滤杯上分次注水萃取的黑咖啡，风味干净、层次清晰，突出产地与烘焙特征，常搭配浅度烘焙。",
    description: "V6 标准为 15 g 咖啡粉配 240 ml 热水，总冲煮时间约 2 分半至 3 分钟。注水节奏和研磨度会显著改变萃取率，属 V6 编辑标准化配方，用于统一检索与比较。",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/4/4d/Caf%C3%A9_coado.jpg",
    posterUrl: "https://upload.wikimedia.org/wikipedia/commons/4/4d/Caf%C3%A9_coado.jpg",
    tags: [
      "手冲过滤",
      "手冲",
      "黑咖啡",
      "热饮",
      "无乳配方",
      "轻盈",
      "经典"
    ],
    scene: [
      "经典"
    ],
    recommendationScore: 95,
    attributes: {
      "coffeeType": "手冲咖啡",
      "milk": "无奶",
      "sweetBitter": "微甜偏苦",
      "temperature": "热饮",
      "caffeine": "较高咖啡因"
    },
    ingredients: [
      {
        "nameZh": "浅度烘焙咖啡豆",
        "nameEn": "Light roast coffee beans",
        "amount": 15,
        "unit": "g",
        "role": "中细研磨"
      },
      {
        "nameZh": "热过滤水",
        "nameEn": "Hot filtered water",
        "amount": 240,
        "unit": "ml",
        "role": "92–96°C"
      }
    ],
    steps: [
      "将滤纸放入滤杯并用热水冲洗预热。",
      "称取 15 g 咖啡豆，中细研磨后倒入滤杯并轻摇平整。",
      "注入约 40 ml、92–96°C 热水闷蒸约 30 秒。",
      "分两至三段缓慢注水至总水量 240 ml，保持液面平稳。",
      "待滤液滴尽后移走滤杯，立即饮用。"
    ],
    radar: [
      {
        "key": "ACIDITY",
        "label": "酸度",
        "score": 7.0
      },
      {
        "key": "BITTERNESS",
        "label": "苦度",
        "score": 5.0
      },
      {
        "key": "SWEETNESS",
        "label": "甜感",
        "score": 5.0
      },
      {
        "key": "BODY",
        "label": "醇厚度",
        "score": 5.0
      },
      {
        "key": "ROAST",
        "label": "烘焙感",
        "score": 5.0
      },
      {
        "key": "REFRESHING",
        "label": "清爽度",
        "score": 8.0
      }
    ],
    similarIds: [
      "coffee-americano",
      "coffee-espresso"
    ],
    sourceInfo: {
      "sourceLevel": "B",
      "updatedAt": "2026-08-17",
      "reviewed": true
    }
  },
  {
    id: "coffee-oat-latte",
    mode: "coffee",
    category: "COFFEE",
    nameZh: "燕麦拿铁",
    nameEn: "Oat Milk Latte",
    intro: "以燕麦奶替代牛奶的奶咖，口感顺滑略带谷物甜香，适合乳糖不耐受与纯素人群，咖啡风味依然清晰。",
    description: "V6 标准为双份浓缩 36 克加燕麦奶 180 毫升，燕麦奶选可打发型以形成奶泡。",
    imageUrl: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Oat%20Milk%20Latte.jpg",
    posterUrl: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Oat%20Milk%20Latte.jpg",
    tags: [
      "奶咖",
      "热饮",
      "纯素",
      "奶油感",
      "顺滑",
      "无乳配方"
    ],
    scene: [
      "日常",
      "下午茶"
    ],
    recommendationScore: 93,
    attributes: {
      "coffeeType": "奶咖",
      "milk": "燕麦奶",
      "sweetBitter": "微甜低苦",
      "temperature": "热饮",
      "caffeine": "中等咖啡因"
    },
    ingredients: [
      {
        "nameZh": "双份浓缩咖啡液",
        "nameEn": "Double espresso liquid",
        "amount": 36,
        "unit": "g",
        "role": "由 18 克咖啡粉萃取"
      },
      {
        "nameZh": "燕麦奶",
        "nameEn": "Oat milk",
        "amount": 180,
        "unit": "ml",
        "role": "蒸热至 60-65°C"
      }
    ],
    steps: [
      "萃取 36 克双份浓缩咖啡液注入预热的大杯。",
      "将 180 毫升燕麦奶蒸热至 60-65°C，打出细密奶泡。",
      "把燕麦奶缓缓倒入浓缩中，与咖啡融合。",
      "收尾铺出薄奶泡层，按喜好做简单拉花。",
      "趁热饮用，燕麦奶冷却较快需尽快享用。"
    ],
    radar: [
      {
        "key": "ACIDITY",
        "label": "酸度",
        "score": 3.0
      },
      {
        "key": "BITTERNESS",
        "label": "苦度",
        "score": 4.0
      },
      {
        "key": "SWEETNESS",
        "label": "甜感",
        "score": 7.0
      },
      {
        "key": "BODY",
        "label": "醇厚度",
        "score": 6.0
      },
      {
        "key": "ROAST",
        "label": "烘焙感",
        "score": 5.0
      },
      {
        "key": "REFRESHING",
        "label": "清爽度",
        "score": 4.0
      }
    ],
    similarIds: [
      "coffee-latte",
      "coffee-flat-white",
      "coffee-cappuccino"
    ],
    sourceInfo: {
      "sourceLevel": "B",
      "updatedAt": "2026-08-17",
      "reviewed": true
    }
  },
  {
    id: "cocktail-negroni",
    mode: "cocktail",
    category: "COCKTAIL",
    nameZh: "内格罗尼",
    nameEn: "Negroni",
    intro: "金酒、金巴利与甜红味美思等量构成的开胃鸡尾酒，苦甜草本并重、酒体较强，是苦味鸡尾酒的代表。",
    description: "本条目按 IBA 官方等量结构标准化：各 30 ml 金酒、金巴利与甜红味美思，搅拌后滤入加冰古典杯，以橙皮装饰。三者等量是内格罗尼不变的骨架，基酒风格决定苦甜走向。 背景：1919年前后佛罗伦萨，内格罗尼伯爵要求调酒师把美国佬的苏打水换成金酒以增强酒劲，遂以伯爵姓氏命名。",
    imageUrl: "https://iba-world.com/wp-content/uploads/2024/07/iba-cocktail-the-unforgettables-negroni-6694911cc3b65.webp",
    posterUrl: "https://iba-world.com/wp-content/uploads/2024/07/iba-cocktail-the-unforgettables-negroni-6694911cc3b65.webp",
    tags: [
      "烈酒主导",
      "金酒基底",
      "苦感主导",
      "草本",
      "搅拌",
      "高强度",
      "经典",
      "开胃"
    ],
    scene: [
      "经典",
      "开胃"
    ],
    recommendationScore: 93,
    attributes: {
      "baseSpirit": "金酒",
      "cocktailType": "烈酒短饮",
      "flavor": "苦味明显",
      "abv": "较高＞20%～30%",
      "extra": "无明显非酒精成分"
    },
    ingredients: [
      {
        "nameZh": "金酒",
        "nameEn": "Gin",
        "amount": 30,
        "unit": "ml",
        "role": "IBA 等量配比"
      },
      {
        "nameZh": "金巴利",
        "nameEn": "Bitter Campari",
        "amount": 30,
        "unit": "ml",
        "role": "苦味核心"
      },
      {
        "nameZh": "甜红味美思",
        "nameEn": "Sweet Red Vermouth",
        "amount": 30,
        "unit": "ml",
        "role": "甜味平衡"
      },
      {
        "nameZh": "冰块",
        "nameEn": "Ice cubes",
        "amount": 80,
        "unit": "g",
        "role": "搅拌用"
      },
      {
        "nameZh": "橙皮",
        "nameEn": "Orange peel",
        "amount": 1,
        "unit": "piece",
        "role": "装饰用，挤油提香"
      }
    ],
    steps: [
      "古典杯加大块冰预冷。",
      "搅拌杯加冰，倒入金酒、金巴利与甜红味美思。",
      "搅拌约 20 秒至充分降温。",
      "滤入加冰古典杯。",
      "挤入橙皮油后投入橙皮装饰。"
    ],
    radar: [
      {
        "key": "SWEETNESS",
        "label": "甜度",
        "score": 3.0
      },
      {
        "key": "SOURNESS",
        "label": "酸度",
        "score": 1.0
      },
      {
        "key": "BITTERNESS",
        "label": "苦度",
        "score": 9.0
      },
      {
        "key": "ALCOHOL",
        "label": "酒精感",
        "score": 8.0
      },
      {
        "key": "BODY",
        "label": "酒体",
        "score": 6.0
      },
      {
        "key": "REFRESHING",
        "label": "清爽度",
        "score": 3.0
      }
    ],
    similarIds: [
      "cocktail-dry-martini",
      "cocktail-manhattan"
    ],
    sourceInfo: {
      "sourceLevel": "B",
      "updatedAt": "2026-08-17",
      "reviewed": true
    }
  },
  {
    id: "cocktail-mojito",
    mode: "cocktail",
    category: "COCKTAIL",
    nameZh: "莫吉托",
    nameEn: "Mojito",
    intro: "以白朗姆酒、青柠、薄荷与苏打水构成的古巴经典清凉长饮，薄荷辛香与青柠酸爽在气泡中格外清爽。",
    description: "配方采用 IBA 官方配比：白朗姆 45 ml、青柠汁 20 ml、薄荷叶 6 支与 2 茶匙细砂糖，捣压薄荷后加碎冰倒入朗姆，再以苏打水补足。薄荷用量与甜度可依杯型微调。 背景：古巴传统鸡尾酒，可追溯至16世纪的“德拉凯”（甘蔗酒+薄荷+青柠），因海明威长驻哈瓦那拉博德吉塔酒吧而闻名。",
    imageUrl: "https://iba-world.com/wp-content/uploads/2024/07/iba-cocktail-contemporary-classics-mojito-6695cdc755626.webp",
    posterUrl: "https://iba-world.com/wp-content/uploads/2024/07/iba-cocktail-contemporary-classics-mojito-6695cdc755626.webp",
    tags: [
      "长饮",
      "朗姆基底",
      "薄荷",
      "捣压",
      "夏季",
      "新手友好"
    ],
    scene: [
      "夏季",
      "新手友好"
    ],
    recommendationScore: 93,
    attributes: {
      "baseSpirit": "朗姆酒",
      "cocktailType": "酸甜短饮",
      "flavor": "酸味明显",
      "abv": "中度＞10%～20%",
      "extra": [
        "柠檬/青柠",
        "苏打/汤力"
      ]
    },
    ingredients: [
      {
        "nameZh": "白朗姆酒",
        "nameEn": "White Cuban Rum",
        "amount": 45,
        "unit": "ml",
        "role": "IBA 官方配比"
      },
      {
        "nameZh": "新鲜青柠汁",
        "nameEn": "Fresh Lime Juice",
        "amount": 20,
        "unit": "ml",
        "role": "酸度核心"
      },
      {
        "nameZh": "薄荷叶",
        "nameEn": "Mint sprigs",
        "amount": 6,
        "unit": "piece",
        "role": "轻压释放香气"
      },
      {
        "nameZh": "细砂糖",
        "nameEn": "White Cane Sugar",
        "amount": 10,
        "unit": "g",
        "role": "2 茶匙"
      },
      {
        "nameZh": "苏打水",
        "nameEn": "Soda Water",
        "amount": 60,
        "unit": "ml",
        "role": "加满顶部"
      },
      {
        "nameZh": "薄荷枝",
        "nameEn": "Mint sprig",
        "amount": 1,
        "unit": "piece",
        "role": "装饰用"
      },
      {
        "nameZh": "青柠角",
        "nameEn": "Lime wedge",
        "amount": 1,
        "unit": "piece",
        "role": "装饰用"
      }
    ],
    steps: [
      "高球杯中加入薄荷叶、细砂糖与青柠汁。",
      "用捣棒轻压薄荷叶释放香气。",
      "加入少许苏打水搅拌至糖溶解。",
      "加满碎冰，倒入白朗姆酒。",
      "补入苏打水，轻轻搅拌，以薄荷枝与青柠角装饰。"
    ],
    radar: [
      {
        "key": "SWEETNESS",
        "label": "甜度",
        "score": 4.0
      },
      {
        "key": "SOURNESS",
        "label": "酸度",
        "score": 5.0
      },
      {
        "key": "BITTERNESS",
        "label": "苦度",
        "score": 1.0
      },
      {
        "key": "ALCOHOL",
        "label": "酒精感",
        "score": 4.0
      },
      {
        "key": "BODY",
        "label": "酒体",
        "score": 2.0
      },
      {
        "key": "REFRESHING",
        "label": "清爽度",
        "score": 9.0
      }
    ],
    similarIds: [
      "cocktail-daiquiri"
    ],
    sourceInfo: {
      "sourceLevel": "B",
      "updatedAt": "2026-08-17",
      "reviewed": true
    }
  },
  {
    id: "cocktail-margarita",
    mode: "cocktail",
    category: "COCKTAIL",
    nameZh: "玛格丽特",
    nameEn: "Margarita",
    intro: "以龙舌兰、橙味利口酒与新鲜青柠汁组成的经典酸型鸡尾酒，酸度明亮，可选半圈盐边，是墨西哥风味的代表。",
    description: "本条目按 IBA 官方配比标准化：50 ml 银龙舌兰、20 ml 橙味利口酒与 15 ml 新鲜青柠汁摇和滤冰。盐边是可选装饰，不进入液体配比；橙味利口酒用君度或库拉索会带来不同甜度与酒精度。 背景：1930至40年代美墨边境地区流行，起源有多种传说（纪念名为玛格丽特的恋人等），龙舌兰+君度+青柠+盐边。",
    imageUrl: "https://iba-world.com/wp-content/uploads/2024/07/iba-cocktail-contemporary-classics-margarita-6695cdd7505e0.webp",
    posterUrl: "https://iba-world.com/wp-content/uploads/2024/07/iba-cocktail-contemporary-classics-margarita-6695cdd7505e0.webp",
    tags: [
      "酸型鸡尾酒",
      "龙舌兰基底",
      "柑橘",
      "盐边",
      "摇和",
      "经典"
    ],
    scene: [
      "经典",
      "夏季"
    ],
    recommendationScore: 93,
    attributes: {
      "baseSpirit": "龙舌兰/梅斯卡尔",
      "cocktailType": "酸甜短饮",
      "flavor": "酸味明显",
      "abv": "较高＞20%～30%",
      "extra": [
        "柠檬/青柠",
        "姜辣香料"
      ]
    },
    ingredients: [
      {
        "nameZh": "100% 龙舌兰酒",
        "nameEn": "Tequila 100% Agave",
        "amount": 50,
        "unit": "ml",
        "role": "IBA 官方配比"
      },
      {
        "nameZh": "橙味利口酒",
        "nameEn": "Triple Sec",
        "amount": 20,
        "unit": "ml",
        "role": "橙香与甜度"
      },
      {
        "nameZh": "新鲜青柠汁",
        "nameEn": "Freshly Squeezed Lime Juice",
        "amount": 15,
        "unit": "ml",
        "role": "酸度核心"
      },
      {
        "nameZh": "细海盐",
        "nameEn": "Salt",
        "amount": 1,
        "unit": "dash",
        "role": "可选，半圈盐边"
      },
      {
        "nameZh": "青柠片",
        "nameEn": "Lime slice",
        "amount": 1,
        "unit": "piece",
        "role": "装饰用"
      }
    ],
    steps: [
      "可选：以青柠润湿杯口，蘸取细盐作半圈盐边。",
      "摇酒壶加冰，倒入龙舌兰、橙味利口酒与青柠汁。",
      "摇和约 12 秒至充分降温。",
      "滤入冰镇鸡尾酒杯。",
      "以青柠片装饰。"
    ],
    radar: [
      {
        "key": "SWEETNESS",
        "label": "甜度",
        "score": 4.0
      },
      {
        "key": "SOURNESS",
        "label": "酸度",
        "score": 7.0
      },
      {
        "key": "BITTERNESS",
        "label": "苦度",
        "score": 1.0
      },
      {
        "key": "ALCOHOL",
        "label": "酒精感",
        "score": 6.0
      },
      {
        "key": "BODY",
        "label": "酒体",
        "score": 3.0
      },
      {
        "key": "REFRESHING",
        "label": "清爽度",
        "score": 6.0
      }
    ],
    similarIds: [
      "cocktail-daiquiri"
    ],
    sourceInfo: {
      "sourceLevel": "B",
      "updatedAt": "2026-08-17",
      "reviewed": true
    }
  },
  {
    id: "cocktail-manhattan",
    mode: "cocktail",
    category: "COCKTAIL",
    nameZh: "曼哈顿",
    nameEn: "Manhattan",
    intro: "以威士忌为基底，加入甜红味美思与苦精搅拌而成的经典鸡尾酒，甜苦平衡，酒体圆润，以樱桃装饰。",
    description: "曼哈顿是经典的威士忌马天尼家族鸡尾酒。本条目按 IBA 官方配比标准化：黑麦威士忌 50 ml、甜红味美思 20 ml 与安格斯图拉苦精 1 滴，冰面搅拌后滤入马天尼杯，以鸡尾酒樱桃装饰。 背景：1870年代纽约曼哈顿俱乐部为温斯顿·丘吉尔之母珍妮·杰罗姆的宴会调制（传说），黑麦威士忌+甜味美思+苦精，是最早的“现代鸡尾酒”之一。",
    imageUrl: "https://iba-world.com/wp-content/uploads/2024/07/iba-cocktail-the-unforgettables-manhattan-6694911627de7.webp",
    posterUrl: "https://iba-world.com/wp-content/uploads/2024/07/iba-cocktail-the-unforgettables-manhattan-6694911627de7.webp",
    tags: [
      "烈酒主导",
      "黑麦基底",
      "草本",
      "甜苦平衡",
      "搅拌",
      "经典",
      "餐后"
    ],
    scene: [
      "经典",
      "餐后"
    ],
    recommendationScore: 93,
    attributes: {
      "baseSpirit": "威士忌",
      "cocktailType": "烈酒短饮",
      "flavor": "甜苦平衡",
      "abv": "高度＞30%",
      "extra": "无明显非酒精成分"
    },
    ingredients: [
      {
        "nameZh": "黑麦威士忌",
        "nameEn": "Rye Whiskey",
        "amount": 50,
        "unit": "ml",
        "role": "IBA 官方配比"
      },
      {
        "nameZh": "甜红味美思",
        "nameEn": "Sweet Red Vermouth",
        "amount": 20,
        "unit": "ml",
        "role": "甜味美思"
      },
      {
        "nameZh": "安格斯图拉苦精",
        "nameEn": "Angostura Bitters",
        "amount": 1,
        "unit": "dash",
        "role": "官方用量"
      },
      {
        "nameZh": "鸡尾酒樱桃",
        "nameEn": "Cocktail cherry",
        "amount": 1,
        "unit": "piece",
        "role": "装饰用"
      }
    ],
    steps: [
      "将马天尼杯提前冰镇。",
      "搅拌杯加冰，倒入黑麦威士忌、甜红味美思与安格斯图拉苦精。",
      "搅拌约 20 秒至充分降温。",
      "滤入冰镇马天尼杯。",
      "以鸡尾酒樱桃装饰。"
    ],
    radar: [
      {
        "key": "SWEETNESS",
        "label": "甜度",
        "score": 4.0
      },
      {
        "key": "SOURNESS",
        "label": "酸度",
        "score": 1.0
      },
      {
        "key": "BITTERNESS",
        "label": "苦度",
        "score": 3.0
      },
      {
        "key": "ALCOHOL",
        "label": "酒精感",
        "score": 8.0
      },
      {
        "key": "BODY",
        "label": "酒体",
        "score": 6.0
      },
      {
        "key": "REFRESHING",
        "label": "清爽度",
        "score": 2.0
      }
    ],
    similarIds: [
      "cocktail-negroni",
      "cocktail-dry-martini"
    ],
    sourceInfo: {
      "sourceLevel": "B",
      "updatedAt": "2026-08-17",
      "reviewed": true
    }
  },
  {
    id: "cocktail-dry-martini",
    mode: "cocktail",
    category: "COCKTAIL",
    nameZh: "干马天尼",
    nameEn: "Dry Martini",
    intro: "以金酒为主、干味美思仅极少量辅助的极干型鸡尾酒，几乎纯烈的金酒风味与低甜度构成其标志性口感。",
    description: "本条目按 IBA 干马天尼配比标准化：60 ml 金酒兑 10 ml 干味美思，搅拌后滤杯。家庭版常以极少量味美思润杯即弃，风味更干。 背景：马天尼家族最经典版本，起源有马丁内斯演变说与纽约调酒师创制说等多种说法，金酒与极少量干味美思的组合，成为“鸡尾酒之王”。",
    imageUrl: "https://iba-world.com/wp-content/uploads/2024/07/iba-cocktail-the-unforgettables-dry-martini-6694910fb500c.webp",
    posterUrl: "https://iba-world.com/wp-content/uploads/2024/07/iba-cocktail-the-unforgettables-dry-martini-6694910fb500c.webp",
    tags: [
      "烈酒主导",
      "金酒基底",
      "偏干",
      "草本",
      "搅拌",
      "高强度",
      "经典"
    ],
    scene: [
      "经典"
    ],
    recommendationScore: 98,
    attributes: {
      "baseSpirit": "金酒",
      "cocktailType": "烈酒短饮",
      "flavor": "偏干不甜",
      "abv": "高度＞30%",
      "extra": "无明显非酒精成分"
    },
    ingredients: [
      {
        "nameZh": "伦敦干金酒",
        "nameEn": "Gin",
        "amount": 60,
        "unit": "ml",
        "role": "IBA 官方配比"
      },
      {
        "nameZh": "干味美思",
        "nameEn": "Dry Vermouth",
        "amount": 10,
        "unit": "ml",
        "role": "官方比例，仅少量"
      },
      {
        "nameZh": "冰块",
        "nameEn": "Ice cubes",
        "amount": 80,
        "unit": "g",
        "role": "搅拌用"
      },
      {
        "nameZh": "柠檬皮",
        "nameEn": "Lemon peel",
        "amount": 1,
        "unit": "piece",
        "role": "装饰用，挤油提香"
      }
    ],
    steps: [
      "将马天尼杯提前冰镇。",
      "搅拌杯加冰，倒入金酒与干味美思。",
      "搅拌约 20 秒至充分降温。",
      "滤入冰镇马天尼杯。",
      "挤入柠檬皮油提香，或按需求以青橄榄装饰。"
    ],
    radar: [
      {
        "key": "SWEETNESS",
        "label": "甜度",
        "score": 1.0
      },
      {
        "key": "SOURNESS",
        "label": "酸度",
        "score": 1.0
      },
      {
        "key": "BITTERNESS",
        "label": "苦度",
        "score": 4.0
      },
      {
        "key": "ALCOHOL",
        "label": "酒精感",
        "score": 9.0
      },
      {
        "key": "BODY",
        "label": "酒体",
        "score": 3.0
      },
      {
        "key": "REFRESHING",
        "label": "清爽度",
        "score": 3.0
      }
    ],
    similarIds: [
      "cocktail-negroni",
      "cocktail-manhattan"
    ],
    sourceInfo: {
      "sourceLevel": "B",
      "updatedAt": "2026-08-17",
      "reviewed": true
    }
  },
  {
    id: "cocktail-daiquiri",
    mode: "cocktail",
    category: "COCKTAIL",
    nameZh: "大吉利",
    nameEn: "Daiquiri",
    intro: "以白朗姆酒、青柠汁与糖浆构成的三元素经典酸型鸡尾酒，酸爽清爽、朗姆果香纯粹，是极简平衡的代表。",
    description: "配方采用 IBA 官方比例：60 ml 白朗姆、20 ml 新鲜青柠汁与 2 吧匙细砂糖，先搅拌至糖溶解再加冰摇和，滤入冰镇鸡尾酒杯，不加装饰。 背景：1898年美西战争期间，美国工程师詹宁斯·考克斯（Jennings Cox）在古巴圣地亚哥附近的大吉利村调制，以村名命名，朗姆+青柠+糖的经典组合。",
    imageUrl: "https://iba-world.com/wp-content/uploads/2024/07/iba-cocktail-the-unforgettables-daiquiri-6694910c5866e.webp",
    posterUrl: "https://iba-world.com/wp-content/uploads/2024/07/iba-cocktail-the-unforgettables-daiquiri-6694910c5866e.webp",
    tags: [
      "酸型鸡尾酒",
      "朗姆基底",
      "柑橘",
      "摇和",
      "经典"
    ],
    scene: [
      "经典",
      "夏季"
    ],
    recommendationScore: 93,
    attributes: {
      "baseSpirit": "朗姆酒",
      "cocktailType": "酸甜短饮",
      "flavor": "酸甜平衡",
      "abv": "较高＞20%～30%",
      "extra": [
        "柠檬/青柠"
      ]
    },
    ingredients: [
      {
        "nameZh": "白朗姆酒",
        "nameEn": "White Cuban Rum",
        "amount": 60,
        "unit": "ml",
        "role": "IBA 官方配比"
      },
      {
        "nameZh": "新鲜青柠汁",
        "nameEn": "Fresh Lime Juice",
        "amount": 20,
        "unit": "ml",
        "role": "酸度核心"
      },
      {
        "nameZh": "细砂糖",
        "nameEn": "Superfine Sugar",
        "amount": 10,
        "unit": "g",
        "role": "2 吧匙，先溶解"
      },
      {
        "nameZh": "冰块",
        "nameEn": "Ice cubes",
        "amount": 90,
        "unit": "g",
        "role": "摇和用"
      }
    ],
    steps: [
      "摇酒壶中加入白朗姆、青柠汁与细砂糖。",
      "搅拌至糖完全溶解。",
      "加冰摇和约 12 秒至充分降温。",
      "滤入冰镇鸡尾酒杯。"
    ],
    radar: [
      {
        "key": "SWEETNESS",
        "label": "甜度",
        "score": 4.0
      },
      {
        "key": "SOURNESS",
        "label": "酸度",
        "score": 6.0
      },
      {
        "key": "BITTERNESS",
        "label": "苦度",
        "score": 1.0
      },
      {
        "key": "ALCOHOL",
        "label": "酒精感",
        "score": 6.0
      },
      {
        "key": "BODY",
        "label": "酒体",
        "score": 3.0
      },
      {
        "key": "REFRESHING",
        "label": "清爽度",
        "score": 6.0
      }
    ],
    similarIds: [
      "cocktail-cosmopolitan",
      "cocktail-margarita"
    ],
    sourceInfo: {
      "sourceLevel": "B",
      "updatedAt": "2026-08-17",
      "reviewed": true
    }
  },
  {
    id: "cocktail-old-fashioned",
    mode: "cocktail",
    category: "COCKTAIL",
    nameZh: "老式鸡尾酒",
    nameEn: "Old Fashioned",
    intro: "以波本威士忌加方糖与苦精直调而成的经典鸡尾酒，苦甜平衡、酒体扎实，用橙皮提香，被视为威士忌风格鸡尾酒的基石。",
    description: "本条目按 IBA 官方配比标准化：波本或黑麦威士忌 45 ml、方糖 1 颗与安格斯图拉苦精数滴，捣压溶解方糖后加冰直调，以橙片与樱桃装饰。使用方糖而非糖浆是古典做法的经典标志。 背景：1880年代肯塔基州路易斯维尔潘德尼斯俱乐部，为纪念“威士忌老式调法”倡导者詹姆斯·E·佩珀上校而流行，被认为是最接近“鸡尾酒”一词原义的饮品。",
    imageUrl: "https://iba-world.com/wp-content/uploads/2024/07/iba-cocktail-the-unforgettables-old-fashioned-6694911fce360.webp",
    posterUrl: "https://iba-world.com/wp-content/uploads/2024/07/iba-cocktail-the-unforgettables-old-fashioned-6694911fce360.webp",
    tags: [
      "烈酒主导",
      "威士忌基底",
      "苦甜",
      "直调",
      "经典"
    ],
    scene: [
      "经典"
    ],
    recommendationScore: 93,
    attributes: {
      "baseSpirit": "威士忌",
      "cocktailType": "烈酒短饮",
      "flavor": "甜苦平衡",
      "abv": "高度＞30%",
      "extra": "无明显非酒精成分"
    },
    ingredients: [
      {
        "nameZh": "波本或黑麦威士忌",
        "nameEn": "Bourbon or Rye Whiskey",
        "amount": 45,
        "unit": "ml",
        "role": "IBA 官方配比"
      },
      {
        "nameZh": "方糖",
        "nameEn": "Sugar cube",
        "amount": 1,
        "unit": "piece",
        "role": "捣压溶解"
      },
      {
        "nameZh": "安格斯图拉苦精",
        "nameEn": "Angostura Bitters",
        "amount": 3,
        "unit": "dash",
        "role": "浸透方糖"
      },
      {
        "nameZh": "过滤水",
        "nameEn": "Plain water",
        "amount": 5,
        "unit": "ml",
        "role": "助溶方糖"
      },
      {
        "nameZh": "冰块",
        "nameEn": "Ice cubes",
        "amount": 90,
        "unit": "g",
        "role": "搅拌用"
      },
      {
        "nameZh": "橙片",
        "nameEn": "Orange slice",
        "amount": 1,
        "unit": "piece",
        "role": "装饰用"
      },
      {
        "nameZh": "鸡尾酒樱桃",
        "nameEn": "Cocktail cherry",
        "amount": 1,
        "unit": "piece",
        "role": "装饰用"
      }
    ],
    steps: [
      "古典杯底放入方糖，滴入安格斯图拉苦精与少量过滤水。",
      "用捣棒将方糖捣压至溶解。",
      "加满冰块，倒入威士忌。",
      "轻轻搅拌约 20 秒。",
      "以橙片与鸡尾酒樱桃装饰。"
    ],
    radar: [
      {
        "key": "SWEETNESS",
        "label": "甜度",
        "score": 4.0
      },
      {
        "key": "SOURNESS",
        "label": "酸度",
        "score": 1.0
      },
      {
        "key": "BITTERNESS",
        "label": "苦度",
        "score": 4.0
      },
      {
        "key": "ALCOHOL",
        "label": "酒精感",
        "score": 9.0
      },
      {
        "key": "BODY",
        "label": "酒体",
        "score": 6.0
      },
      {
        "key": "REFRESHING",
        "label": "清爽度",
        "score": 2.0
      }
    ],
    similarIds: [

    ],
    sourceInfo: {
      "sourceLevel": "B",
      "updatedAt": "2026-08-17",
      "reviewed": true
    }
  },
  {
    id: "cocktail-cosmopolitan",
    mode: "cocktail",
    category: "COCKTAIL",
    nameZh: "大都会",
    nameEn: "Cosmopolitan",
    intro: "伏特加、君度、蔓越莓汁与青柠汁摇和的粉红色经典鸡尾酒，酸甜清爽、果香突出。",
    description: "1980 年代在纽约定型，1990 年代末因《欲望都市》全球走红。IBA 配比：伏特加 40 毫升、君度 15 毫升、蔓越莓汁 30 毫升、新鲜青柠汁 15 毫升，摇和滤入大号鸡尾酒杯，柠檬卷皮装饰。",
    imageUrl: "https://iba-world.com/wp-content/uploads/2024/07/iba-cocktail-contemporary-classics-cosmopolitan-6695cdae389dc.webp",
    posterUrl: "https://iba-world.com/wp-content/uploads/2024/07/iba-cocktail-contemporary-classics-cosmopolitan-6695cdae389dc.webp",
    tags: [
      "酸型鸡尾酒",
      "伏特加基底",
      "果香",
      "柑橘",
      "摇和",
      "经典"
    ],
    scene: [
      "经典",
      "下午茶"
    ],
    recommendationScore: 95,
    attributes: {
      "baseSpirit": "伏特加",
      "cocktailType": "酸甜短饮",
      "flavor": "酸味明显",
      "abv": "中度＞10%～20%",
      "extra": [
        "其他水果",
        "其他水果"
      ]
    },
    ingredients: [
      {
        "nameZh": "柠檬风味伏特加",
        "nameEn": "Vodka Citron",
        "amount": 40,
        "unit": "ml",
        "role": "柠檬风味伏特加"
      },
      {
        "nameZh": "君度",
        "nameEn": "Cointreau",
        "amount": 15,
        "unit": "ml",
        "role": "橙味利口酒"
      },
      {
        "nameZh": "蔓越莓汁",
        "nameEn": "Cranberry Juice",
        "amount": 30,
        "unit": "ml",
        "role": "蔓越莓汁"
      },
      {
        "nameZh": "新鲜青柠汁",
        "nameEn": "Fresh Lime Juice",
        "amount": 15,
        "unit": "ml",
        "role": "新鲜青柠汁"
      },
      {
        "nameZh": "柠檬卷皮",
        "nameEn": "Lemon twist",
        "amount": 1,
        "unit": "piece",
        "role": "装饰"
      }
    ],
    steps: [
      "摇酒壶加冰。",
      "倒入伏特加、君度、蔓越莓汁与青柠汁。",
      "充分摇和。",
      "滤入大号冰镇鸡尾酒杯。",
      "柠檬卷皮装饰。"
    ],
    radar: [
      {
        "key": "ALCOHOL",
        "label": "酒精感",
        "score": 5.0
      },
      {
        "key": "BITTERNESS",
        "label": "苦度",
        "score": 1.0
      },
      {
        "key": "BODY",
        "label": "酒体",
        "score": 3.0
      },
      {
        "key": "REFRESHING",
        "label": "清爽度",
        "score": 7.0
      },
      {
        "key": "SOURNESS",
        "label": "酸度",
        "score": 5.0
      },
      {
        "key": "SWEETNESS",
        "label": "甜度",
        "score": 6.0
      }
    ],
    similarIds: [
      "cocktail-daiquiri"
    ],
    sourceInfo: {
      "sourceLevel": "B",
      "updatedAt": "2026-08-17",
      "reviewed": true
    }
  },
  {
    id: "cocktail-espresso-martini",
    mode: "cocktail",
    category: "COCKTAIL",
    nameZh: "浓缩咖啡马天尼",
    nameEn: "Espresso Martini",
    intro: "以伏特加、咖啡利口酒与浓缩咖啡摇制的咖啡风味鸡尾酒，杯面浮着绵密泡沫，兼具咖啡香与酒感。",
    description: "本条目按 IBA 官方配比标准化：50 ml 伏特加、30 ml 咖啡利口酒、10 ml 单糖浆与一杯浓缩咖啡，加冰用力摇和起泡后滤入马天尼杯，以咖啡豆装饰。使用新鲜浓缩咖啡可稳定获得泡沫层。 背景：1980年代伦敦调酒师迪克·布拉德塞尔（Dick Bradsell）为一位点“唤醒我”的模特创制，伏特加+咖啡利口酒+浓缩咖啡，原名伏特加浓缩咖啡。",
    imageUrl: "https://iba-world.com/wp-content/uploads/2024/07/iba-cocktail-new-era-espresso-martini-6695d3a172fd3.webp",
    posterUrl: "https://iba-world.com/wp-content/uploads/2024/07/iba-cocktail-new-era-espresso-martini-6695d3a172fd3.webp",
    tags: [
      "咖啡鸡尾酒",
      "伏特加基底",
      "咖啡风味",
      "泡沫质地",
      "摇和",
      "甜感明显",
      "餐后",
      "含咖啡因"
    ],
    scene: [
      "餐后"
    ],
    recommendationScore: 100,
    attributes: {
      "baseSpirit": "伏特加",
      "cocktailType": "咖啡/甜点型",
      "flavor": "甜味明显",
      "abv": "较高＞20%～30%",
      "extra": [
        "咖啡"
      ]
    },
    ingredients: [
      {
        "nameZh": "伏特加",
        "nameEn": "Vodka",
        "amount": 50,
        "unit": "ml",
        "role": "IBA 官方配比"
      },
      {
        "nameZh": "咖啡利口酒（甘露）",
        "nameEn": "Coffee Liqueur (Kahlúa)",
        "amount": 30,
        "unit": "ml",
        "role": "咖啡利口酒"
      },
      {
        "nameZh": "单糖浆",
        "nameEn": "Sugar Syrup",
        "amount": 10,
        "unit": "ml",
        "role": "平衡苦度"
      },
      {
        "nameZh": "浓缩咖啡液",
        "nameEn": "Strong Espresso",
        "amount": 30,
        "unit": "ml",
        "role": "一杯浓缩咖啡"
      },
      {
        "nameZh": "咖啡豆",
        "nameEn": "Coffee beans",
        "amount": 3,
        "unit": "piece",
        "role": "装饰用"
      }
    ],
    steps: [
      "将马天尼杯提前冰镇。",
      "摇酒壶加冰，倒入伏特加、咖啡利口酒、单糖浆与浓缩咖啡。",
      "用力摇和约 15 秒至充分降温并起泡。",
      "滤入冰镇马天尼杯。",
      "以三颗咖啡豆装饰。"
    ],
    radar: [
      {
        "key": "SWEETNESS",
        "label": "甜度",
        "score": 6.0
      },
      {
        "key": "SOURNESS",
        "label": "酸度",
        "score": 1.0
      },
      {
        "key": "BITTERNESS",
        "label": "苦度",
        "score": 3.0
      },
      {
        "key": "ALCOHOL",
        "label": "酒精感",
        "score": 7.0
      },
      {
        "key": "BODY",
        "label": "酒体",
        "score": 6.0
      },
      {
        "key": "REFRESHING",
        "label": "清爽度",
        "score": 2.0
      }
    ],
    similarIds: [

    ],
    sourceInfo: {
      "sourceLevel": "B",
      "updatedAt": "2026-08-17",
      "reviewed": true
    }
  },
  {
    id: "cocktail-tequila-paloma",
    mode: "cocktail",
    category: "COCKTAIL",
    nameZh: "帕洛玛",
    nameEn: "Paloma",
    intro: "以龙舌兰为基底、配粉红葡萄柚苏打与青柠的清爽长饮，葡萄柚的酸甜微苦与龙舌兰植物香相得益彰，是墨西哥国民调酒。",
    description: "配方采用 IBA 官方配比：100% 龙舌兰 50 ml、青柠汁 5 ml、少许盐，加冰后以粉红葡萄柚苏打补满。盐可增强果味，甜酸随苏打品牌浮动，酒精度为编辑估算值。 背景：1950年代墨西哥流行的国民调酒，龙舌兰+西柚苏打（Squirt）+青柠，“帕洛玛”意为鸽子。",
    imageUrl: "https://iba-world.com/wp-content/uploads/2024/07/iba-cocktail-new-era-paloma-6695d3b19cda4.webp",
    posterUrl: "https://iba-world.com/wp-content/uploads/2024/07/iba-cocktail-new-era-paloma-6695d3b19cda4.webp",
    tags: [
      "长饮",
      "龙舌兰基底",
      "葡萄柚",
      "气泡",
      "直调",
      "夏季"
    ],
    scene: [
      "夏季",
      "经典"
    ],
    recommendationScore: 93,
    attributes: {
      "baseSpirit": "龙舌兰/梅斯卡尔",
      "cocktailType": "高球长饮",
      "flavor": "酸味明显",
      "abv": "中度＞10%～20%",
      "extra": [
        "苏打/汤力",
        "柠檬/青柠"
      ]
    },
    ingredients: [
      {
        "nameZh": "100% 龙舌兰酒",
        "nameEn": "Tequila 100% Agave",
        "amount": 50,
        "unit": "ml",
        "role": "IBA 官方配比"
      },
      {
        "nameZh": "新鲜青柠汁",
        "nameEn": "Fresh Lime Juice",
        "amount": 5,
        "unit": "ml",
        "role": "现挤提香"
      },
      {
        "nameZh": "细盐",
        "nameEn": "Salt",
        "amount": 1,
        "unit": "dash",
        "role": "提升果味"
      },
      {
        "nameZh": "粉红葡萄柚苏打",
        "nameEn": "Pink Grapefruit Soda",
        "amount": 100,
        "unit": "ml",
        "role": "补满杯"
      },
      {
        "nameZh": "青柠片",
        "nameEn": "Lime slice",
        "amount": 1,
        "unit": "piece",
        "role": "装饰用"
      }
    ],
    steps: [
      "高球杯加满冰块。",
      "倒入龙舌兰，挤入青柠汁。",
      "撒入少许盐。",
      "补入粉红葡萄柚苏打。",
      "轻轻搅拌，以青柠片装饰。"
    ],
    radar: [
      {
        "key": "SWEETNESS",
        "label": "甜度",
        "score": 4.0
      },
      {
        "key": "SOURNESS",
        "label": "酸度",
        "score": 4.0
      },
      {
        "key": "BITTERNESS",
        "label": "苦度",
        "score": 2.0
      },
      {
        "key": "ALCOHOL",
        "label": "酒精感",
        "score": 4.0
      },
      {
        "key": "BODY",
        "label": "酒体",
        "score": 3.0
      },
      {
        "key": "REFRESHING",
        "label": "清爽度",
        "score": 8.0
      }
    ],
    similarIds: [
      "cocktail-moscow-mule"
    ],
    sourceInfo: {
      "sourceLevel": "B",
      "updatedAt": "2026-08-17",
      "reviewed": true
    }
  },
  {
    id: "cocktail-moscow-mule",
    mode: "cocktail",
    category: "COCKTAIL",
    nameZh: "莫斯科骡子",
    nameEn: "Moscow Mule",
    intro: "以伏特加、姜汁啤酒与新鲜青柠汁调制而成的经典骡子鸡尾酒，姜味辛辣与青柠酸香平衡，气泡充足，传统以铜杯盛装。",
    description: "IBA 标准以伏特加、姜汁啤酒与青柠汁调配，V6 采用此配比；相比姜汁威士忌，基底换成伏特加，姜味更干净、无威士忌木质调。 背景：1941年洛杉矶Cock 'n' Bull酒吧，伏特加厂商约翰·马丁与姜汁啤酒商联手推广伏特加而创，标志性铜杯盛装。",
    imageUrl: "https://iba-world.com/wp-content/uploads/2024/07/iba-cocktail-contemporary-classics-moscow-mule-6695cdc7d8cb2.webp",
    posterUrl: "https://iba-world.com/wp-content/uploads/2024/07/iba-cocktail-contemporary-classics-moscow-mule-6695cdc7d8cb2.webp",
    tags: [
      "长饮",
      "伏特加基底",
      "姜味",
      "直调",
      "铜杯",
      "经典"
    ],
    scene: [
      "经典",
      "夏季"
    ],
    recommendationScore: 91,
    attributes: {
      "baseSpirit": "伏特加",
      "cocktailType": "高球长饮",
      "flavor": "酸味明显",
      "abv": "中度＞10%～20%",
      "extra": [
        "姜辣香料",
        "柠檬/青柠"
      ]
    },
    ingredients: [
      {
        "nameZh": "伏特加",
        "nameEn": "Vodka",
        "amount": 45,
        "unit": "ml",
        "role": "IBA 官方配比"
      },
      {
        "nameZh": "姜汁啤酒",
        "nameEn": "Ginger Beer",
        "amount": 120,
        "unit": "ml",
        "role": "姜味与气泡"
      },
      {
        "nameZh": "新鲜青柠汁",
        "nameEn": "Fresh Lime Juice",
        "amount": 10,
        "unit": "ml",
        "role": "酸香平衡"
      },
      {
        "nameZh": "青柠片",
        "nameEn": "Lime slice",
        "amount": 1,
        "unit": "piece",
        "role": "装饰用"
      }
    ],
    steps: [
      "铜杯加满冰块。",
      "倒入伏特加与新鲜青柠汁。",
      "补入冷藏姜汁啤酒。",
      "轻轻搅拌混合。",
      "以青柠片装饰。"
    ],
    radar: [
      {
        "key": "SWEETNESS",
        "label": "甜度",
        "score": 3.0
      },
      {
        "key": "SOURNESS",
        "label": "酸度",
        "score": 5.0
      },
      {
        "key": "BITTERNESS",
        "label": "苦度",
        "score": 1.0
      },
      {
        "key": "ALCOHOL",
        "label": "酒精感",
        "score": 4.0
      },
      {
        "key": "BODY",
        "label": "酒体",
        "score": 3.0
      },
      {
        "key": "REFRESHING",
        "label": "清爽度",
        "score": 8.0
      }
    ],
    similarIds: [
      "cocktail-tequila-paloma"
    ],
    sourceInfo: {
      "sourceLevel": "B",
      "updatedAt": "2026-08-17",
      "reviewed": true
    }
  },
  {
    id: "cocktail-bloody-mary",
    mode: "cocktail",
    category: "COCKTAIL",
    nameZh: "血腥玛丽",
    nameEn: "Bloody Mary",
    intro: "以伏特加与番茄汁为主、加入柠檬汁与辣酱调味的咸鲜长饮，酸辣鲜香与浓稠质地结合，是经典佐餐鸡尾酒。",
    description: "本条目按 IBA 官方配比标准化：45 ml 伏特加、90 ml 番茄汁、15 ml 柠檬汁与适量辣酱、伍斯特酱、盐和胡椒。番茄汁的稠度与调味料的用量决定整体咸鲜与辣度，可按口味调整。 背景：1934年前后巴黎哈里酒吧（一说纽约圣瑞吉酒店由费迪南·佩蒂奥完善），以英国女王玛丽一世绰号“血腥玛丽”命名，伏特加+番茄汁+香料。",
    imageUrl: "https://iba-world.com/wp-content/uploads/2024/07/iba-cocktail-contemporary-classics-bloody-mary-6695cda72fe0f.webp",
    posterUrl: "https://iba-world.com/wp-content/uploads/2024/07/iba-cocktail-contemporary-classics-bloody-mary-6695cda72fe0f.webp",
    tags: [
      "咸鲜",
      "伏特加基底",
      "番茄",
      "辛辣",
      "直调",
      "早午餐"
    ],
    scene: [
      "早午餐",
      "经典"
    ],
    recommendationScore: 91,
    attributes: {
      "baseSpirit": "伏特加",
      "cocktailType": "酸甜短饮",
      "flavor": "辛辣刺激",
      "abv": "中度＞10%～20%",
      "extra": [
        "其他水果",
        "姜辣香料",
        "柠檬/青柠"
      ]
    },
    ingredients: [
      {
        "nameZh": "伏特加",
        "nameEn": "Vodka",
        "amount": 45,
        "unit": "ml",
        "role": "IBA 官方配比"
      },
      {
        "nameZh": "番茄汁",
        "nameEn": "Tomato Juice",
        "amount": 90,
        "unit": "ml",
        "role": "主体"
      },
      {
        "nameZh": "新鲜柠檬汁",
        "nameEn": "Fresh Lemon Juice",
        "amount": 15,
        "unit": "ml",
        "role": "提亮酸度"
      },
      {
        "nameZh": "伍斯特酱",
        "nameEn": "Worcestershire Sauce",
        "amount": 2,
        "unit": "dash",
        "role": "咸鲜风味"
      },
      {
        "nameZh": "塔巴斯科辣酱",
        "nameEn": "Tabasco",
        "amount": 1,
        "unit": "dash",
        "role": "可选，辣度"
      },
      {
        "nameZh": "芹菜盐",
        "nameEn": "Celery Salt",
        "amount": 1,
        "unit": "dash",
        "role": "可选，盐味"
      },
      {
        "nameZh": "芹菜杆",
        "nameEn": "Celery stick",
        "amount": 1,
        "unit": "piece",
        "role": "装饰用"
      },
      {
        "nameZh": "柠檬角",
        "nameEn": "Lemon wedge",
        "amount": 1,
        "unit": "piece",
        "role": "装饰用"
      }
    ],
    steps: [
      "高球杯加冰。",
      "倒入伏特加、番茄汁、柠檬汁、伍斯特酱与辣酱。",
      "撒入芹菜盐与黑胡椒。",
      "以吧勺轻轻提拉混合。",
      "以芹菜杆与柠檬角装饰。"
    ],
    radar: [
      {
        "key": "SWEETNESS",
        "label": "甜度",
        "score": 1.0
      },
      {
        "key": "SOURNESS",
        "label": "酸度",
        "score": 2.0
      },
      {
        "key": "BITTERNESS",
        "label": "苦度",
        "score": 1.0
      },
      {
        "key": "ALCOHOL",
        "label": "酒精感",
        "score": 4.0
      },
      {
        "key": "BODY",
        "label": "酒体",
        "score": 5.0
      },
      {
        "key": "REFRESHING",
        "label": "清爽度",
        "score": 3.0
      }
    ],
    similarIds: [
      "cocktail-moscow-mule"
    ],
    sourceInfo: {
      "sourceLevel": "B",
      "updatedAt": "2026-08-17",
      "reviewed": true
    }
  },
]

export const PROFILE: MockProfile = {
  id: 'mock-user',
  displayName: 'Mock 用户',
  avatarText: 'M',
  favorites: ['coffee-oat-latte', 'cocktail-mojito', 'coffee-cold-brew'],
  history: ['coffee-flat-white', 'cocktail-manhattan', 'coffee-espresso', 'cocktail-cosmopolitan'],
  coffeePreferences: ['牛奶', '微甜低苦'],
  cocktailPreferences: ['金酒', '酸甜平衡'],
}
