import { apiGet, apiPost, apiPut, apiDelete } from './client'

export interface Company {
  id: number
  name: string
  position: string
  industry: string
  status: string
  interview_date: string | null
  hr_contact: string
  notes: string
  created_at: string
  updated_at: string
}

export interface Question {
  id: number
  company_id: number | null
  question: string
  answer: string
  category: string
  difficulty: string
  created_at: string
}

export const interviewsApi = {
  companies: {
    list: () => apiGet<Company[]>('/interviews/companies'),
    create: (data: Partial<Company>) => apiPost<Company>('/interviews/companies', data),
    update: (id: number, data: Partial<Company>) => apiPut<Company>(`/interviews/companies/${id}`, data),
    remove: (id: number) => apiDelete(`/interviews/companies/${id}`),
  },
  questions: {
    list: (params?: { company_id?: number; category?: string }) => {
      const query = new URLSearchParams()
      if (params?.company_id) query.set('company_id', String(params.company_id))
      if (params?.category) query.set('category', params.category)
      const q = query.toString()
      return apiGet<Question[]>(`/interviews/questions${q ? `?${q}` : ''}`)
    },
    create: (data: Partial<Question>) => apiPost<Question>('/interviews/questions', data),
    update: (id: number, data: Partial<Question>) => apiPut<Question>(`/interviews/questions/${id}`, data),
    remove: (id: number) => apiDelete(`/interviews/questions/${id}`),
  },
}
