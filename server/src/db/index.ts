import { sb } from './supabase.js'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = resolve(__dirname, '../../../data')
mkdirSync(dataDir, { recursive: true })

const dbPath = resolve(dataDir, 'workbench.json')

interface DBData {
  tasks: any[]
  notes: any[]
  interview_companies: any[]
  interview_questions: any[]
  quick_links: any[]
  knowledge_items: any[]
  _meta: { nextId: Record<string, number> }
}

const defaultData: DBData = {
  tasks: [],
  notes: [],
  interview_companies: [],
  interview_questions: [],
  quick_links: [],
  knowledge_items: [],
  _meta: { nextId: {} },
}

function loadLocal(): DBData {
  if (!existsSync(dbPath)) return structuredClone(defaultData)
  try {
    return { ...structuredClone(defaultData), ...JSON.parse(readFileSync(dbPath, 'utf-8')) }
  } catch {
    return structuredClone(defaultData)
  }
}

function saveLocal(data: DBData) {
  writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8')
}

let localData = loadLocal()

function nextIdLocal(table: string): number {
  localData._meta.nextId[table] = (localData._meta.nextId[table] || 0) + 1
  return localData._meta.nextId[table]
}

function nowLocal() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19)
}

const useSupabase = sb.isAvailable()

if (useSupabase) {
  console.log('Using Supabase database')
} else {
  console.log('Using local JSON database')
}

export const db = {
  useSupabase,

  async findAll(table: string): Promise<any[]> {
    if (useSupabase) return sb.findAll(table)
    return [...(localData[table as keyof DBData] as any[])]
  },

  async findById(table: string, id: number): Promise<any> {
    if (useSupabase) return sb.findById(table, id)
    return (localData[table as keyof DBData] as any[]).find((r) => r.id === id) || null
  },

  async insert(table: string, row: Record<string, any>): Promise<any> {
    if (useSupabase) return sb.insert(table, row)
    const id = nextIdLocal(table)
    const record = {
      id,
      created_at: nowLocal(),
      updated_at: nowLocal(),
      ...row,
    }
    localData[table as keyof DBData] = [...(localData[table as keyof DBData] as any[]), record]
    saveLocal(localData)
    return record
  },

  async update(table: string, id: number, patch: Record<string, any>): Promise<any> {
    if (useSupabase) return sb.update(table, id, patch)
    const tableData = localData[table as keyof DBData] as any[]
    const idx = tableData.findIndex((r) => r.id === id)
    if (idx === -1) return null
    tableData[idx] = { ...tableData[idx], ...patch, updated_at: nowLocal() }
    saveLocal(localData)
    return tableData[idx]
  },

  async delete(table: string, id: number): Promise<boolean> {
    if (useSupabase) return sb.delete(table, id)
    const tableData = localData[table as keyof DBData] as any[]
    const idx = tableData.findIndex((r) => r.id === id)
    if (idx === -1) return false
    tableData.splice(idx, 1)
    saveLocal(localData)
    return true
  },

  async count(table: string): Promise<number> {
    if (useSupabase) return sb.count(table)
    return (localData[table as keyof DBData] as any[]).length
  },
}

export default db
