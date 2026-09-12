import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from './client'

export interface Note {
  id: number
  title: string
  content: string
  tags: string
  pinned: number
  created_at: string
  updated_at: string
}

export const notesApi = {
  list: (search?: string) => apiGet<Note[]>(`/notes${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  create: (data: { title: string; content?: string; tags?: string[] }) => apiPost<Note>('/notes', data),
  update: (id: number, data: Partial<Note> & { tags?: string[] }) => apiPut<Note>(`/notes/${id}`, data),
  togglePin: (id: number) => apiPatch<Note>(`/notes/${id}/pin`),
  remove: (id: number) => apiDelete(`/notes/${id}`),
}
