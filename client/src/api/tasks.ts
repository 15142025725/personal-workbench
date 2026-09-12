import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from './client'

export interface Task {
  id: number
  title: string
  description: string
  category: string
  status: string
  priority: string
  due_date: string | null
  created_at: string
  updated_at: string
}

export const tasksApi = {
  list: () => apiGet<Task[]>('/tasks'),
  create: (data: Partial<Task>) => apiPost<Task>('/tasks', data),
  update: (id: number, data: Partial<Task>) => apiPut<Task>(`/tasks/${id}`, data),
  updateStatus: (id: number, status: string) => apiPatch<Task>(`/tasks/${id}/status`, { status }),
  remove: (id: number) => apiDelete(`/tasks/${id}`),
}
