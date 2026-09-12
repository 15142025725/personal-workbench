// Vercel Serverless Function - API Handler
// 使用 @vercel/node 运行时，Express 兼容
import express from 'express'
import cors from 'cors'
import serverless from 'serverless-http'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = supabaseUrl && serviceKey
  ? createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
  : null

const app = express()
app.use(cors())
app.use(express.json())

// 工具函数
function formatRow(row, table) {
  if (!row) return row
  if (row.tags && typeof row.tags !== 'string') row.tags = JSON.stringify(row.tags)
  if (table === 'notes' && typeof row.pinned === 'boolean') row.pinned = row.pinned ? 1 : 0
  if (row.created_at) row.created_at = String(row.created_at).replace('T', ' ').slice(0, 19)
  if (row.updated_at) row.updated_at = String(row.updated_at).replace('T', ' ').slice(0, 19)
  if (row.due_date && row.due_date !== null) row.due_date = String(row.due_date)
  if (row.interview_date && row.interview_date !== null) row.interview_date = String(row.interview_date)
  return row
}

function prepareData(data, table) {
  const out = { ...data }
  if (table === 'notes' && out.pinned !== undefined) out.pinned = !!out.pinned
  return out
}

async function findAll(table) {
  const { data, error } = await supabase.from(table).select('*')
  if (error) throw error
  return (data || []).map((r) => formatRow(r, table))
}

async function findById(table, id) {
  const { data, error } = await supabase.from(table).select('*').eq('id', id).single()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return formatRow(data, table)
}

async function insert(table, row) {
  const data = prepareData(row, table)
  const { data: result, error } = await supabase.from(table).insert(data).select().single()
  if (error) throw error
  return formatRow(result, table)
}

async function update(table, id, patch) {
  const data = prepareData(patch, table)
  const { data: result, error } = await supabase.from(table).update(data).eq('id', id).select().single()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return formatRow(result, table)
}

async function del(table, id) {
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) {
    if (error.code === 'PGRST116') return false
    throw error
  }
  return true
}

function now() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19)
}

// Health
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', database: supabase ? 'supabase' : 'local' })
})

// ========== Tasks ==========
app.get('/api/tasks', async (_req, res, next) => {
  try {
    const tasks = await findAll('tasks')
    tasks.sort((a, b) => b.created_at.localeCompare(a.created_at))
    res.json(tasks)
  } catch (e) { next(e) }
})

app.post('/api/tasks', async (req, res, next) => {
  try {
    const { title, description = '', category = 'work', priority = 'medium', due_date = null } = req.body
    if (!title) return res.status(400).json({ error: 'title is required' })
    const task = await insert('tasks', { title, description, category, priority, due_date, status: 'pending' })
    res.status(201).json(task)
  } catch (e) { next(e) }
})

app.put('/api/tasks/:id', async (req, res, next) => {
  try {
    const { title, description, category, priority, due_date, status } = req.body
    const id = parseInt(req.params.id)
    const existing = await findById('tasks', id)
    if (!existing) return res.status(404).json({ error: 'task not found' })
    const updated = await update('tasks', id, {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(category !== undefined && { category }),
      ...(priority !== undefined && { priority }),
      ...(due_date !== undefined && { due_date }),
      ...(status !== undefined && { status }),
    })
    res.json(updated)
  } catch (e) { next(e) }
})

app.patch('/api/tasks/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body
    const id = parseInt(req.params.id)
    const valid = ['pending', 'in_progress', 'completed']
    if (!valid.includes(status)) return res.status(400).json({ error: 'invalid status' })
    const updated = await update('tasks', id, { status })
    if (!updated) return res.status(404).json({ error: 'task not found' })
    res.json(updated)
  } catch (e) { next(e) }
})

app.delete('/api/tasks/:id', async (req, res, next) => {
  try {
    const ok = await del('tasks', parseInt(req.params.id))
    if (!ok) return res.status(404).json({ error: 'task not found' })
    res.status(204).send()
  } catch (e) { next(e) }
})

// ========== Notes ==========
app.get('/api/notes', async (req, res, next) => {
  try {
    const { search } = req.query
    let notes = await findAll('notes')
    if (search) {
      const s = String(search).toLowerCase()
      notes = notes.filter((n) => n.title.toLowerCase().includes(s) || n.content.toLowerCase().includes(s))
    }
    notes.sort((a, b) => (b.pinned - a.pinned) || b.updated_at.localeCompare(a.updated_at))
    res.json(notes)
  } catch (e) { next(e) }
})

app.post('/api/notes', async (req, res, next) => {
  try {
    const { title, content = '', tags = [] } = req.body
    if (!title) return res.status(400).json({ error: 'title is required' })
    const note = await insert('notes', { title, content, tags: JSON.stringify(tags), pinned: 0 })
    res.status(201).json(note)
  } catch (e) { next(e) }
})

app.put('/api/notes/:id', async (req, res, next) => {
  try {
    const { title, content, tags } = req.body
    const id = parseInt(req.params.id)
    const existing = await findById('notes', id)
    if (!existing) return res.status(404).json({ error: 'note not found' })
    const updated = await update('notes', id, {
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(tags !== undefined && { tags: JSON.stringify(tags) }),
    })
    res.json(updated)
  } catch (e) { next(e) }
})

app.patch('/api/notes/:id/pin', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    const note = await findById('notes', id)
    if (!note) return res.status(404).json({ error: 'note not found' })
    const updated = await update('notes', id, { pinned: note.pinned ? 0 : 1 })
    res.json(updated)
  } catch (e) { next(e) }
})

app.delete('/api/notes/:id', async (req, res, next) => {
  try {
    const ok = await del('notes', parseInt(req.params.id))
    if (!ok) return res.status(404).json({ error: 'note not found' })
    res.status(204).send()
  } catch (e) { next(e) }
})

// ========== Interviews ==========
app.get('/api/interviews/companies', async (_req, res, next) => {
  try {
    const companies = await findAll('interview_companies')
    companies.sort((a, b) => b.created_at.localeCompare(a.created_at))
    res.json(companies)
  } catch (e) { next(e) }
})

app.post('/api/interviews/companies', async (req, res, next) => {
  try {
    const { name, position = '', industry = '', status = 'pending', interview_date = null, hr_contact = '', notes = '' } = req.body
    if (!name) return res.status(400).json({ error: 'name is required' })
    const company = await insert('interview_companies', { name, position, industry, status, interview_date, hr_contact, notes })
    res.status(201).json(company)
  } catch (e) { next(e) }
})

app.put('/api/interviews/companies/:id', async (req, res, next) => {
  try {
    const { name, position, industry, status, interview_date, hr_contact, notes } = req.body
    const id = parseInt(req.params.id)
    const existing = await findById('interview_companies', id)
    if (!existing) return res.status(404).json({ error: 'company not found' })
    const updated = await update('interview_companies', id, {
      ...(name !== undefined && { name }),
      ...(position !== undefined && { position }),
      ...(industry !== undefined && { industry }),
      ...(status !== undefined && { status }),
      ...(interview_date !== undefined && { interview_date }),
      ...(hr_contact !== undefined && { hr_contact }),
      ...(notes !== undefined && { notes }),
    })
    res.json(updated)
  } catch (e) { next(e) }
})

app.delete('/api/interviews/companies/:id', async (req, res, next) => {
  try {
    const ok = await del('interview_companies', parseInt(req.params.id))
    if (!ok) return res.status(404).json({ error: 'company not found' })
    res.status(204).send()
  } catch (e) { next(e) }
})

app.get('/api/interviews/questions', async (req, res, next) => {
  try {
    const { company_id, category } = req.query
    let questions = await findAll('interview_questions')
    if (company_id) questions = questions.filter((q) => q.company_id === parseInt(String(company_id)))
    if (category) questions = questions.filter((q) => q.category === category)
    questions.sort((a, b) => b.created_at.localeCompare(a.created_at))
    res.json(questions)
  } catch (e) { next(e) }
})

app.post('/api/interviews/questions', async (req, res, next) => {
  try {
    const { company_id = null, question, answer = '', category = 'general', difficulty = 'medium' } = req.body
    if (!question) return res.status(400).json({ error: 'question is required' })
    const q = await insert('interview_questions', { company_id, question, answer, category, difficulty })
    res.status(201).json(q)
  } catch (e) { next(e) }
})

app.put('/api/interviews/questions/:id', async (req, res, next) => {
  try {
    const { company_id, question, answer, category, difficulty } = req.body
    const id = parseInt(req.params.id)
    const existing = await findById('interview_questions', id)
    if (!existing) return res.status(404).json({ error: 'question not found' })
    const updated = await update('interview_questions', id, {
      ...(company_id !== undefined && { company_id }),
      ...(question !== undefined && { question }),
      ...(answer !== undefined && { answer }),
      ...(category !== undefined && { category }),
      ...(difficulty !== undefined && { difficulty }),
    })
    res.json(updated)
  } catch (e) { next(e) }
})

app.delete('/api/interviews/questions/:id', async (req, res, next) => {
  try {
    const ok = await del('interview_questions', parseInt(req.params.id))
    if (!ok) return res.status(404).json({ error: 'question not found' })
    res.status(204).send()
  } catch (e) { next(e) }
})

// ========== Quick Links ==========
app.get('/api/links', async (_req, res, next) => {
  try {
    const links = await findAll('quick_links')
    links.sort((a, b) => (a.sort_order - b.sort_order) || b.created_at.localeCompare(a.created_at))
    res.json(links)
  } catch (e) { next(e) }
})

app.post('/api/links', async (req, res, next) => {
  try {
    const { title, url, description = '', category = 'work', icon = '', sort_order = 0 } = req.body
    if (!title || !url) return res.status(400).json({ error: 'title and url are required' })
    const link = await insert('quick_links', { title, url, description, category, icon, sort_order })
    res.status(201).json(link)
  } catch (e) { next(e) }
})

app.put('/api/links/:id', async (req, res, next) => {
  try {
    const { title, url, description, category, icon, sort_order } = req.body
    const id = parseInt(req.params.id)
    const existing = await findById('quick_links', id)
    if (!existing) return res.status(404).json({ error: 'link not found' })
    const updated = await update('quick_links', id, {
      ...(title !== undefined && { title }),
      ...(url !== undefined && { url }),
      ...(description !== undefined && { description }),
      ...(category !== undefined && { category }),
      ...(icon !== undefined && { icon }),
      ...(sort_order !== undefined && { sort_order }),
    })
    res.json(updated)
  } catch (e) { next(e) }
})

app.delete('/api/links/:id', async (req, res, next) => {
  try {
    const ok = await del('quick_links', parseInt(req.params.id))
    if (!ok) return res.status(404).json({ error: 'link not found' })
    res.status(204).send()
  } catch (e) { next(e) }
})

// ========== Knowledge ==========
app.get('/api/knowledge', async (req, res, next) => {
  try {
    const { search, category } = req.query
    let items = await findAll('knowledge_items')
    if (search) {
      const s = String(search).toLowerCase()
      items = items.filter((i) => i.title.toLowerCase().includes(s) || i.content.toLowerCase().includes(s))
    }
    if (category) items = items.filter((i) => i.category === category)
    items.sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    res.json(items)
  } catch (e) { next(e) }
})

app.post('/api/knowledge', async (req, res, next) => {
  try {
    const { title, content = '', source = '', tags = [], category = 'general' } = req.body
    if (!title) return res.status(400).json({ error: 'title is required' })
    const item = await insert('knowledge_items', { title, content, source, tags: JSON.stringify(tags), category })
    res.status(201).json(item)
  } catch (e) { next(e) }
})

app.put('/api/knowledge/:id', async (req, res, next) => {
  try {
    const { title, content, source, tags, category } = req.body
    const id = parseInt(req.params.id)
    const existing = await findById('knowledge_items', id)
    if (!existing) return res.status(404).json({ error: 'item not found' })
    const updated = await update('knowledge_items', id, {
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(source !== undefined && { source }),
      ...(tags !== undefined && { tags: JSON.stringify(tags) }),
      ...(category !== undefined && { category }),
    })
    res.json(updated)
  } catch (e) { next(e) }
})

app.delete('/api/knowledge/:id', async (req, res, next) => {
  try {
    const ok = await del('knowledge_items', parseInt(req.params.id))
    if (!ok) return res.status(404).json({ error: 'item not found' })
    res.status(204).send()
  } catch (e) { next(e) }
})

// ========== Dashboard ==========
app.get('/api/dashboard', async (_req, res, next) => {
  try {
    const today = new Date().toISOString().slice(0, 10)

    const allTasks = await findAll('tasks')
    const pendingTasks = allTasks
      .filter((t) => t.status !== 'completed')
      .sort((a, b) => {
        const pri = { high: 0, medium: 1, low: 2 }
        return pri[a.priority] - pri[b.priority]
      })
      .slice(0, 5)

    const allCompanies = await findAll('interview_companies')
    const upcomingInterviews = allCompanies
      .filter((c) => ['pending', 'scheduled'].includes(c.status) && c.interview_date && c.interview_date >= today)
      .sort((a, b) => a.interview_date.localeCompare(b.interview_date))

    const allNotes = await findAll('notes')
    const recentNotes = allNotes
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
      .slice(0, 3)

    const allLinks = await findAll('quick_links')
    const pinnedLinks = allLinks
      .sort((a, b) => (a.sort_order - b.sort_order) || b.created_at.localeCompare(a.created_at))
      .slice(0, 6)

    const { count: knowledgeCount } = await supabase.from('knowledge_items').select('*', { count: 'exact', head: true })

    res.json({
      pendingTasks,
      upcomingInterview: upcomingInterviews[0] || null,
      recentNotes,
      pinnedLinks,
      stats: {
        tasks: {
          total: allTasks.length,
          pending: allTasks.filter((t) => t.status === 'pending').length,
          in_progress: allTasks.filter((t) => t.status === 'in_progress').length,
          completed: allTasks.filter((t) => t.status === 'completed').length,
        },
        interviews: {
          total: allCompanies.length,
          pending: allCompanies.filter((c) => c.status === 'pending').length,
          scheduled: allCompanies.filter((c) => c.status === 'scheduled').length,
          completed: allCompanies.filter((c) => c.status === 'completed').length,
          passed: allCompanies.filter((c) => c.status === 'passed').length,
          failed: allCompanies.filter((c) => c.status === 'failed').length,
        },
        notes: allNotes.length,
        knowledge: knowledgeCount || 0,
      },
    })
  } catch (e) { next(e) }
})

// ========== Charts ==========
app.get('/api/charts/tasks-trend', async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 7
    const tasks = await findAll('tasks')
    const trend = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      const completed = tasks.filter((t) => t.status === 'completed' && t.updated_at?.slice(0, 10) === dateStr).length
      const created = tasks.filter((t) => t.created_at?.slice(0, 10) === dateStr).length
      trend.push({ date: dateStr.slice(5), completed, created })
    }
    res.json(trend)
  } catch (e) { next(e) }
})

app.get('/api/charts/task-distribution', async (_req, res, next) => {
  try {
    const tasks = await findAll('tasks')
    const categories = ['work', 'interview', 'personal', 'learning']
    const statuses = ['pending', 'in_progress', 'completed']
    const priorities = ['high', 'medium', 'low']
    const byCategory = categories.map((c) => ({ category: c, count: tasks.filter((t) => t.category === c).length })).filter((c) => c.count > 0)
    const byStatus = statuses.map((s) => ({ status: s, count: tasks.filter((t) => t.status === s).length })).filter((s) => s.count > 0)
    const byPriority = priorities.map((p) => ({ priority: p, count: tasks.filter((t) => t.priority === p).length })).filter((p) => p.count > 0)
    res.json({ byCategory, byStatus, byPriority })
  } catch (e) { next(e) }
})

app.get('/api/charts/interview-progress', async (_req, res, next) => {
  try {
    const companies = await findAll('interview_companies')
    const questions = await findAll('interview_questions')
    const statuses = ['pending', 'scheduled', 'completed', 'passed', 'failed']
    const qCategories = ['general', 'behavioral', 'technical', 'case']
    const byStatus = statuses.map((s) => ({ status: s, count: companies.filter((c) => c.status === s).length })).filter((s) => s.count > 0)
    const questionsByCategory = qCategories.map((c) => ({ category: c, count: questions.filter((q) => q.category === c).length })).filter((c) => c.count > 0)
    res.json({ byStatus, questionsByCategory })
  } catch (e) { next(e) }
})

app.get('/api/charts/notes-trend', async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 7
    const notes = await findAll('notes')
    const knowledge = await findAll('knowledge_items')
    const trend = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      const n = notes.filter((item) => item.created_at?.slice(0, 10) === dateStr).length
      const k = knowledge.filter((item) => item.created_at?.slice(0, 10) === dateStr).length
      trend.push({ date: dateStr.slice(5), notes: n, knowledge: k })
    }
    res.json(trend)
  } catch (e) { next(e) }
})

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: err.message || 'Internal Server Error' })
})

export default serverless(app)
