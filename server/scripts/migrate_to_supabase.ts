import 'dotenv/config'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const supabaseUrl = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

// 读取本地 JSON 数据
const dataPath = resolve(__dirname, '../../data/workbench.json')
const localData = JSON.parse(readFileSync(dataPath, 'utf-8'))

async function migrate() {
  console.log('Starting migration...')

  // 1. 验证连接
  const { data: health, error: connErr } = await supabase.from('tasks').select('count', { count: 'exact', head: true })
  if (connErr) {
    console.error('Cannot connect to Supabase or tables do not exist:', connErr.message)
    console.error('Please run the SQL in server/src/db/schema_supabase.sql in Supabase SQL Editor first.')
    process.exit(1)
  }
  console.log('✓ Supabase connection OK')

  // 2. 清空现有数据（避免重复）
  const tables = ['interview_questions', 'interview_companies', 'knowledge_items', 'quick_links', 'notes', 'tasks']
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().neq('id', 0)
    if (error) console.warn(`Warning clearing ${table}:`, error.message)
  }
  console.log('✓ Cleared existing data')

  // 3. 迁移 tasks
  if (localData.tasks?.length) {
    const tasks = localData.tasks.map((t: any) => ({
      id: t.id,
      title: t.title,
      description: t.description || '',
      category: t.category || 'work',
      status: t.status || 'pending',
      priority: t.priority || 'medium',
      due_date: t.due_date || null,
      created_at: t.created_at,
      updated_at: t.updated_at,
    }))
    const { error } = await supabase.from('tasks').insert(tasks)
    if (error) throw error
    console.log(`✓ Migrated ${tasks.length} tasks`)
  }

  // 4. 迁移 notes
  if (localData.notes?.length) {
    const notes = localData.notes.map((n: any) => ({
      id: n.id,
      title: n.title,
      content: n.content || '',
      tags: JSON.parse(n.tags || '[]'),
      pinned: !!n.pinned,
      created_at: n.created_at,
      updated_at: n.updated_at,
    }))
    const { error } = await supabase.from('notes').insert(notes)
    if (error) throw error
    console.log(`✓ Migrated ${notes.length} notes`)
  }

  // 5. 迁移 interview_companies
  if (localData.interview_companies?.length) {
    const companies = localData.interview_companies.map((c: any) => ({
      id: c.id,
      name: c.name,
      position: c.position || '',
      industry: c.industry || '',
      status: c.status || 'pending',
      interview_date: c.interview_date || null,
      hr_contact: c.hr_contact || '',
      notes: c.notes || '',
      created_at: c.created_at,
      updated_at: c.updated_at,
    }))
    const { error } = await supabase.from('interview_companies').insert(companies)
    if (error) throw error
    console.log(`✓ Migrated ${companies.length} interview companies`)
  }

  // 6. 迁移 interview_questions
  if (localData.interview_questions?.length) {
    const questions = localData.interview_questions.map((q: any) => ({
      id: q.id,
      company_id: q.company_id || null,
      question: q.question,
      answer: q.answer || '',
      category: q.category || 'general',
      difficulty: q.difficulty || 'medium',
      created_at: q.created_at,
    }))
    const { error } = await supabase.from('interview_questions').insert(questions)
    if (error) throw error
    console.log(`✓ Migrated ${questions.length} interview questions`)
  }

  // 7. 迁移 quick_links
  if (localData.quick_links?.length) {
    const links = localData.quick_links.map((l: any) => ({
      id: l.id,
      title: l.title,
      url: l.url,
      description: l.description || '',
      category: l.category || 'work',
      icon: l.icon || '',
      sort_order: l.sort_order || 0,
      created_at: l.created_at,
    }))
    const { error } = await supabase.from('quick_links').insert(links)
    if (error) throw error
    console.log(`✓ Migrated ${links.length} quick links`)
  }

  // 8. 迁移 knowledge_items
  if (localData.knowledge_items?.length) {
    const items = localData.knowledge_items.map((k: any) => ({
      id: k.id,
      title: k.title,
      content: k.content || '',
      source: k.source || '',
      tags: JSON.parse(k.tags || '[]'),
      category: k.category || 'general',
      created_at: k.created_at,
      updated_at: k.updated_at,
    }))
    const { error } = await supabase.from('knowledge_items').insert(items)
    if (error) throw error
    console.log(`✓ Migrated ${items.length} knowledge items`)
  }

  console.log('\n🎉 Migration completed successfully!')
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message)
  process.exit(1)
})
