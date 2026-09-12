import { apiGet } from './client'
import type { Task } from './tasks'
import type { Note } from './notes'
import type { Link } from './links'
import type { Company } from './interviews'

export interface DashboardData {
  pendingTasks: Task[]
  upcomingInterview: Company | null
  recentNotes: Note[]
  pinnedLinks: Link[]
  stats: {
    tasks: { total: number; pending: number; in_progress: number; completed: number }
    interviews: { total: number; pending: number; scheduled: number; completed: number; passed: number; failed: number }
    notes: number
    knowledge: number
  }
}

export const dashboardApi = {
  get: () => apiGet<DashboardData>('/dashboard'),
}

export const chartsApi = {
  tasksTrend: (days = 7) => apiGet<{ date: string; completed: number; created: number }[]>(`/charts/tasks-trend?days=${days}`),
  taskDistribution: () => apiGet<{ byCategory: { category: string; count: number }[]; byStatus: { status: string; count: number }[]; byPriority: { priority: string; count: number }[] }>('/charts/task-distribution'),
  interviewProgress: () => apiGet<{ byStatus: { status: string; count: number }[]; questionsByCategory: { category: string; count: number }[] }>('/charts/interview-progress'),
  notesTrend: (days = 7) => apiGet<{ date: string; notes: number; knowledge: number }[]>(`/charts/notes-trend?days=${days}`),
}
