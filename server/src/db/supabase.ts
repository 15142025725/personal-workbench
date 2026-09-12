import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.warn('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set, using local JSON storage')
}

export const supabase = supabaseUrl && serviceKey
  ? createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
  : null

// 表名映射
const tableMap: Record<string, string> = {
  tasks: 'tasks',
  notes: 'notes',
  interview_companies: 'interview_companies',
  interview_questions: 'interview_questions',
  quick_links: 'quick_links',
  knowledge_items: 'knowledge_items',
}

// 统一数据格式转换（Supabase camelCase/snake_case 适配）
function formatRow(row: any, table: string): any {
  if (!row) return row
  // Supabase 返回的是 snake_case，但我们前端用的字段名也是 snake_case，直接返回
  // tags 在 Supabase 是 JSONB，需要确保是字符串格式（和本地 JSON 存储一致）
  if (row.tags && typeof row.tags !== 'string') {
    row.tags = JSON.stringify(row.tags)
  }
  // pinned 在 Supabase 是 boolean，本地是 0/1
  if (table === 'notes' && typeof row.pinned === 'boolean') {
    row.pinned = row.pinned ? 1 : 0
  }
  // 日期时间格式统一
  if (row.created_at) row.created_at = String(row.created_at).replace('T', ' ').slice(0, 19)
  if (row.updated_at) row.updated_at = String(row.updated_at).replace('T', ' ').slice(0, 19)
  if (row.due_date && row.due_date !== null) row.due_date = String(row.due_date)
  if (row.interview_date && row.interview_date !== null) row.interview_date = String(row.interview_date)
  return row
}

function formatRows(rows: any[], table: string): any[] {
  return rows.map((r) => formatRow(r, table))
}

function prepareData(data: any, table: string): any {
  const out = { ...data }
  // tags 数组转 JSON
  if (out.tags && Array.isArray(out.tags)) {
    out.tags = out.tags
  }
  // pinned 0/1 转 boolean
  if (table === 'notes' && out.pinned !== undefined) {
    out.pinned = !!out.pinned
  }
  return out
}

export const sb = {
  async findAll(table: string): Promise<any[]> {
    if (!supabase) throw new Error('Supabase not configured')
    const { data, error } = await supabase.from(tableMap[table]).select('*')
    if (error) throw error
    return formatRows(data || [], table)
  },

  async findById(table: string, id: number): Promise<any> {
    if (!supabase) throw new Error('Supabase not configured')
    const { data, error } = await supabase.from(tableMap[table]).select('*').eq('id', id).single()
    if (error) {
      if (error.code === 'PGRST116') return null // no rows
      throw error
    }
    return formatRow(data, table)
  },

  async insert(table: string, row: any): Promise<any> {
    if (!supabase) throw new Error('Supabase not configured')
    const data = prepareData(row, table)
    const { data: result, error } = await supabase
      .from(tableMap[table])
      .insert(data)
      .select()
      .single()
    if (error) throw error
    return formatRow(result, table)
  },

  async update(table: string, id: number, patch: any): Promise<any> {
    if (!supabase) throw new Error('Supabase not configured')
    const data = prepareData(patch, table)
    const { data: result, error } = await supabase
      .from(tableMap[table])
      .update(data)
      .eq('id', id)
      .select()
      .single()
    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return formatRow(result, table)
  },

  async delete(table: string, id: number): Promise<boolean> {
    if (!supabase) throw new Error('Supabase not configured')
    const { error } = await supabase.from(tableMap[table]).delete().eq('id', id)
    if (error) {
      if (error.code === 'PGRST116') return false
      throw error
    }
    return true
  },

  async count(table: string): Promise<number> {
    if (!supabase) throw new Error('Supabase not configured')
    const { count, error } = await supabase.from(tableMap[table]).select('*', { count: 'exact', head: true })
    if (error) throw error
    return count || 0
  },

  isAvailable() {
    return supabase !== null
  },
}
