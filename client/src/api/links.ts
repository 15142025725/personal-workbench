import { apiGet, apiPost, apiPut, apiDelete } from './client'

export interface Link {
  id: number
  title: string
  url: string
  description: string
  category: string
  icon: string
  sort_order: number
  created_at: string
}

export const linksApi = {
  list: () => apiGet<Link[]>('/links'),
  create: (data: Partial<Link>) => apiPost<Link>('/links', data),
  update: (id: number, data: Partial<Link>) => apiPut<Link>(`/links/${id}`, data),
  remove: (id: number) => apiDelete(`/links/${id}`),
}
