/**
 * 知识百科页（pkgExplore/encyclopedia）。
 * 消费者向咖啡/鸡尾酒知识入口。分类与文章内容均由 BFF GET /knowledge 提供。
 */
import { store } from '../../stores/index'
import { service } from '../../services/index'
import { applyPageTheme } from '../../lib/theme'

interface KnowledgeCategory {
  id: string
  title: string
  desc: string
  mode: 'coffee' | 'cocktail'
}

interface KnowledgeArticle {
  title: string
  lead: string
  points: string[]
}

Page({
  data: {
    categories: [] as KnowledgeCategory[],
    articles: {} as Record<string, KnowledgeArticle>,
    mode: 'coffee' as 'coffee' | 'cocktail',
    article: null as KnowledgeArticle | null,
  },

  onShow() {
    const mode = store.get().mode
    this.setData({ mode })
    service.getKnowledge().then((data) => this.setData({
      categories: data.categories as KnowledgeCategory[],
      articles: data.articles as Record<string, KnowledgeArticle>,
    }))
    applyPageTheme(this as any)
  },

  onCategoryTap(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string
    const article = this.data.articles[id]
    if (article) this.setData({ article })
  },

  onCloseArticle() {
    this.setData({ article: null })
  },
})
