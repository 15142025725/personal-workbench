import { apiGet, apiPost, apiPut, apiDelete } from './client'

export interface KnowledgeItem {
  id: number
  title: string
  content: string
  source: string
  tags: string
  category: string
  created_at: string
  updated_at: string
}

export const knowledgeApi = {
  list: (params?: { search?: string; category?: string }) => {
    const query = new URLSearchParams()
    if (params?.search) query.set('search', params.search)
    if (params?.category) query.set('category', params.category)
    const q = query.toString()
    return apiGet<KnowledgeItem[]>(`/knowledge${q ? `?${q}` : ''}`)
  },
  create: (data: Partial<KnowledgeItem> & { tags?: string[] }) => apiPost<KnowledgeItem>('/knowledge', data),
  update: (id: number, data: Partial<KnowledgeItem> & { tags?: string[] }) => apiPut<KnowledgeItem>(`/knowledge/${id}`, data),
  remove: (id: number) => apiDelete(`/knowledge/${id}`),
}
