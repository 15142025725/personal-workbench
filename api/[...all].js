// Vercel Serverless Function - API Handler
// 使用 Vercel Node.js 运行时原生处理方式
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = supabaseUrl && serviceKey
  ? createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
  : null

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

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function json(res, status, data) {
  res.status(status).json(data)
}

// ========== Route Handlers ==========

// Health
async function handleHealth(req, res) {
  res.json({ status: 'ok', database: supabase ? 'supabase' : 'local' })
}

// Tasks
async function handleTasksGet(req, res) {
  const tasks = await findAll('tasks')
  tasks.sort((a, b) => b.created_at.localeCompare(a.created_at))
  res.json(tasks)
}

async function handleTasksPost(req, res) {
  const { title, description = '', category = 'work', priority = 'medium', due_date = null } = req.body
  if (!title) return res.status(400).json({ error: 'title is required' })
  const task = await insert('tasks', { title, description, category, priority, due_date, status: 'pending' })
  res.status(201).json(task)
}

async function handleTasksPut(req, res) {
  const id = parseInt(req.query.id)
  const { title, description, category, priority, due_date, status } = req.body
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
}

async function handleTasksStatusPatch(req, res) {
  const id = parseInt(req.query.id)
  const { status } = req.body
  const valid = ['pending', 'in_progress', 'completed']
  if (!valid.includes(status)) return res.status(400).json({ error: 'invalid status' })
  const updated = await update('tasks', id, { status })
  if (!updated) return res.status(404).json({ error: 'task not found' })
  res.json(updated)
}

async function handleTasksDelete(req, res) {
  const id = parseInt(req.query.id)
  const ok = await del('tasks', id)
  if (!ok) return res.status(404).json({ error: 'task not found' })
  res.status(204).send()
}

// Notes
async function handleNotesGet(req, res) {
  const { search } = req.query
  let notes = await findAll('notes')
  if (search) {
    const s = String(search).toLowerCase()
    notes = notes.filter((n) => n.title.toLowerCase().includes(s) || n.content.toLowerCase().includes(s))
  }
  notes.sort((a, b) => (b.pinned - a.pinned) || b.updated_at.localeCompare(a.updated_at))
  res.json(notes)
}

async function handleNotesPost(req, res) {
  const { title, content = '', tags = [] } = req.body
  if (!title) return res.status(400).json({ error: 'title is required' })
  const note = await insert('notes', { title, content, tags: JSON.stringify(tags), pinned: 0 })
  res.status(201).json(note)
}

async function handleNotesPut(req, res) {
  const id = parseInt(req.query.id)
  const { title, content, tags } = req.body
  const existing = await findById('notes', id)
  if (!existing) return res.status(404).json({ error: 'note not found' })
  const updated = await update('notes', id, {
    ...(title !== undefined && { title }),
    ...(content !== undefined && { content }),
    ...(tags !== undefined && { tags: JSON.stringify(tags) }),
  })
  res.json(updated)
}

async function handleNotesPinPatch(req, res) {
  const id = parseInt(req.query.id)
  const note = await findById('notes', id)
  if (!note) return res.status(404).json({ error: 'note not found' })
  const updated = await update('notes', id, { pinned: note.pinned ? 0 : 1 })
  res.json(updated)
}

async function handleNotesDelete(req, res) {
  const id = parseInt(req.query.id)
  const ok = await del('notes', id)
  if (!ok) return res.status(404).json({ error: 'note not found' })
  res.status(204).send()
}

// Interviews - Companies
async function handleCompaniesGet(req, res) {
  const companies = await findAll('interview_companies')
  companies.sort((a, b) => b.created_at.localeCompare(a.created_at))
  res.json(companies)
}

async function handleCompaniesPost(req, res) {
  const { name, position = '', industry = '', status = 'pending', interview_date = null, hr_contact = '', notes = '' } = req.body
  if (!name) return res.status(400).json({ error: 'name is required' })
  const company = await insert('interview_companies', { name, position, industry, status, interview_date, hr_contact, notes })
  res.status(201).json(company)
}

async function handleCompaniesPut(req, res) {
  const id = parseInt(req.query.id)
  const { name, position, industry, status, interview_date, hr_contact, notes } = req.body
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
}

async function handleCompaniesDelete(req, res) {
  const id = parseInt(req.query.id)
  const ok = await del('interview_companies', id)
  if (!ok) return res.status(404).json({ error: 'company not found' })
  res.status(204).send()
}

// Interviews - Questions
async function handleQuestionsGet(req, res) {
  const { company_id, category } = req.query
  let questions = await findAll('interview_questions')
  if (company_id) questions = questions.filter((q) => q.company_id === parseInt(String(company_id)))
  if (category) questions = questions.filter((q) => q.category === category)
  questions.sort((a, b) => b.created_at.localeCompare(a.created_at))
  res.json(questions)
}

async function handleQuestionsPost(req, res) {
  const { company_id = null, question, answer = '', category = 'general', difficulty = 'medium' } = req.body
  if (!question) return res.status(400).json({ error: 'question is required' })
  const q = await insert('interview_questions', { company_id, question, answer, category, difficulty })
  res.status(201).json(q)
}

async function handleQuestionsPut(req, res) {
  const id = parseInt(req.query.id)
  const { company_id, question, answer, category, difficulty } = req.body
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
}

async function handleQuestionsDelete(req, res) {
  const id = parseInt(req.query.id)
  const ok = await del('interview_questions', id)
  if (!ok) return res.status(404).json({ error: 'question not found' })
  res.status(204).send()
}

// Links
async function handleLinksGet(req, res) {
  const links = await findAll('quick_links')
  links.sort((a, b) => (a.sort_order - b.sort_order) || b.created_at.localeCompare(a.created_at))
  res.json(links)
}

async function handleLinksPost(req, res) {
  const { title, url, description = '', category = 'work', icon = '', sort_order = 0 } = req.body
  if (!title || !url) return res.status(400).json({ error: 'title and url are required' })
  const link = await insert('quick_links', { title, url, description, category, icon, sort_order })
  res.status(201).json(link)
}

async function handleLinksPut(req, res) {
  const id = parseInt(req.query.id)
  const { title, url, description, category, icon, sort_order } = req.body
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
}

async function handleLinksDelete(req, res) {
  const id = parseInt(req.query.id)
  const ok = await del('quick_links', id)
  if (!ok) return res.status(404).json({ error: 'link not found' })
  res.status(204).send()
}

// Knowledge
async function handleKnowledgeGet(req, res) {
  const { search, category } = req.query
  let items = await findAll('knowledge_items')
  if (search) {
    const s = String(search).toLowerCase()
    items = items.filter((i) => i.title.toLowerCase().includes(s) || i.content.toLowerCase().includes(s))
  }
  if (category) items = items.filter((i) => i.category === category)
  items.sort((a, b) => b.updated_at.localeCompare(a.updated_at))
  res.json(items)
}

async function handleKnowledgePost(req, res) {
  const { title, content = '', source = '', tags = [], category = 'general' } = req.body
  if (!title) return res.status(400).json({ error: 'title is required' })
  const item = await insert('knowledge_items', { title, content, source, tags: JSON.stringify(tags), category })
  res.status(201).json(item)
}

async function handleKnowledgePut(req, res) {
  const id = parseInt(req.query.id)
  const { title, content, source, tags, category } = req.body
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
}

async function handleKnowledgeDelete(req, res) {
  const id = parseInt(req.query.id)
  const ok = await del('knowledge_items', id)
  if (!ok) return res.status(404).json({ error: 'item not found' })
  res.status(204).send()
}

// Dashboard
async function handleDashboardGet(req, res) {
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
}

// Charts
async function handleChartsTasksTrend(req, res) {
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
}

async function handleChartsTaskDistribution(req, res) {
  const tasks = await findAll('tasks')
  const categories = ['work', 'interview', 'personal', 'learning']
  const statuses = ['pending', 'in_progress', 'completed']
  const priorities = ['high', 'medium', 'low']
  const byCategory = categories.map((c) => ({ category: c, count: tasks.filter((t) => t.category === c).length })).filter((c) => c.count > 0)
  const byStatus = statuses.map((s) => ({ status: s, count: tasks.filter((t) => t.status === s).length })).filter((s) => s.count > 0)
  const byPriority = priorities.map((p) => ({ priority: p, count: tasks.filter((t) => t.priority === p).length })).filter((p) => p.count > 0)
  res.json({ byCategory, byStatus, byPriority })
}

async function handleChartsInterviewProgress(req, res) {
  const companies = await findAll('interview_companies')
  const questions = await findAll('interview_questions')
  const statuses = ['pending', 'scheduled', 'completed', 'passed', 'failed']
  const qCategories = ['general', 'behavioral', 'technical', 'case']
  const byStatus = statuses.map((s) => ({ status: s, count: companies.filter((c) => c.status === s).length })).filter((s) => s.count > 0)
  const questionsByCategory = qCategories.map((c) => ({ category: c, count: questions.filter((q) => q.category === c).length })).filter((c) => c.count > 0)
  res.json({ byStatus, questionsByCategory })
}

async function handleChartsNotesTrend(req, res) {
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
}

// ========== Router ==========
async function handleRequest(req, res) {
  // Set CORS headers
  for (const [k, v] of Object.entries(corsHeaders)) {
    res.setHeader(k, v)
  }

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  const url = req.url || ''
  const path = url.split('?')[0]
  const method = req.method

  try {
    // Parse body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      let body = ''
      for await (const chunk of req) {
        body += chunk
      }
      try {
        req.body = body ? JSON.parse(body) : {}
      } catch {
        req.body = {}
      }
    } else {
      req.body = {}
    }

    // Parse query
    const queryString = url.split('?')[1] || ''
    const params = new URLSearchParams(queryString)
    req.query = Object.fromEntries(params.entries())

    // Route matching
    // Health
    if (path === '/api/health' && method === 'GET') return await handleHealth(req, res)

    // Tasks
    if (path === '/api/tasks' && method === 'GET') return await handleTasksGet(req, res)
    if (path === '/api/tasks' && method === 'POST') return await handleTasksPost(req, res)
    if (path.match(/^\/api\/tasks\/\d+$/) && method === 'PUT') {
      req.query.id = path.split('/').pop()
      return await handleTasksPut(req, res)
    }
    if (path.match(/^\/api\/tasks\/\d+\/status$/) && method === 'PATCH') {
      req.query.id = path.split('/')[3]
      return await handleTasksStatusPatch(req, res)
    }
    if (path.match(/^\/api\/tasks\/\d+$/) && method === 'DELETE') {
      req.query.id = path.split('/').pop()
      return await handleTasksDelete(req, res)
    }

    // Notes
    if (path === '/api/notes' && method === 'GET') return await handleNotesGet(req, res)
    if (path === '/api/notes' && method === 'POST') return await handleNotesPost(req, res)
    if (path.match(/^\/api\/notes\/\d+$/) && method === 'PUT') {
      req.query.id = path.split('/').pop()
      return await handleNotesPut(req, res)
    }
    if (path.match(/^\/api\/notes\/\d+\/pin$/) && method === 'PATCH') {
      req.query.id = path.split('/')[3]
      return await handleNotesPinPatch(req, res)
    }
    if (path.match(/^\/api\/notes\/\d+$/) && method === 'DELETE') {
      req.query.id = path.split('/').pop()
      return await handleNotesDelete(req, res)
    }

    // Interviews - Companies
    if (path === '/api/interviews/companies' && method === 'GET') return await handleCompaniesGet(req, res)
    if (path === '/api/interviews/companies' && method === 'POST') return await handleCompaniesPost(req, res)
    if (path.match(/^\/api\/interviews\/companies\/\d+$/) && method === 'PUT') {
      req.query.id = path.split('/').pop()
      return await handleCompaniesPut(req, res)
    }
    if (path.match(/^\/api\/interviews\/companies\/\d+$/) && method === 'DELETE') {
      req.query.id = path.split('/').pop()
      return await handleCompaniesDelete(req, res)
    }

    // Interviews - Questions
    if (path === '/api/interviews/questions' && method === 'GET') return await handleQuestionsGet(req, res)
    if (path === '/api/interviews/questions' && method === 'POST') return await handleQuestionsPost(req, res)
    if (path.match(/^\/api\/interviews\/questions\/\d+$/) && method === 'PUT') {
      req.query.id = path.split('/').pop()
      return await handleQuestionsPut(req, res)
    }
    if (path.match(/^\/api\/interviews\/questions\/\d+$/) && method === 'DELETE') {
      req.query.id = path.split('/').pop()
      return await handleQuestionsDelete(req, res)
    }

    // Links
    if (path === '/api/links' && method === 'GET') return await handleLinksGet(req, res)
    if (path === '/api/links' && method === 'POST') return await handleLinksPost(req, res)
    if (path.match(/^\/api\/links\/\d+$/) && method === 'PUT') {
      req.query.id = path.split('/').pop()
      return await handleLinksPut(req, res)
    }
    if (path.match(/^\/api\/links\/\d+$/) && method === 'DELETE') {
      req.query.id = path.split('/').pop()
      return await handleLinksDelete(req, res)
    }

    // Knowledge
    if (path === '/api/knowledge' && method === 'GET') return await handleKnowledgeGet(req, res)
    if (path === '/api/knowledge' && method === 'POST') return await handleKnowledgePost(req, res)
    if (path.match(/^\/api\/knowledge\/\d+$/) && method === 'PUT') {
      req.query.id = path.split('/').pop()
      return await handleKnowledgePut(req, res)
    }
    if (path.match(/^\/api\/knowledge\/\d+$/) && method === 'DELETE') {
      req.query.id = path.split('/').pop()
      return await handleKnowledgeDelete(req, res)
    }

    // Dashboard
    if (path === '/api/dashboard' && method === 'GET') return await handleDashboardGet(req, res)

    // Charts
    if (path === '/api/charts/tasks-trend' && method === 'GET') return await handleChartsTasksTrend(req, res)
    if (path === '/api/charts/task-distribution' && method === 'GET') return await handleChartsTaskDistribution(req, res)
    if (path === '/api/charts/interview-progress' && method === 'GET') return await handleChartsInterviewProgress(req, res)
    if (path === '/api/charts/notes-trend' && method === 'GET') return await handleChartsNotesTrend(req, res)

    // 404
    res.status(404).json({ error: 'not found', path })
  } catch (err) {
    console.error('API Error:', err)
    res.status(500).json({ error: err.message || 'Internal Server Error' })
  }
}

module.exports = (req, res) => {
  handleRequest(req, res).catch((err) => {
    console.error('Unhandled error:', err)
    res.status(500).json({ error: err.message || 'Internal Server Error' })
  })
}
