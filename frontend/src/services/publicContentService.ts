import { news } from '../content/publicSiteContent'
export const publicContentService = { listNews: () => news, getNews: (slug: string) => news.find(item => item.slug === slug) }
