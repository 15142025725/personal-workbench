import { Router } from 'express'
import db from '../db/index.js'

const router = Router()

router.get('/tasks-trend', async (req, res, next) => {
  try {
    const days = parseInt(req.query.days as string) || 7
    const tasks = await db.findAll('tasks')
    const trend: { date: string; completed: number; created: number }[] = []

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      const completed = tasks.filter((t: any) => t.status === 'completed' && t.updated_at?.slice(0, 10) === dateStr).length
      const created = tasks.filter((t: any) => t.created_at?.slice(0, 10) === dateStr).length
      trend.push({ date: dateStr.slice(5), completed, created })
    }
    res.json(trend)
  } catch (e) { next(e) }
})

router.get('/task-distribution', async (_req, res, next) => {
  try {
    const tasks = await db.findAll('tasks')
    const categories = ['work', 'interview', 'personal', 'learning']
    const statuses = ['pending', 'in_progress', 'completed']
    const priorities = ['high', 'medium', 'low']

    const byCategory = categories.map((c) => ({ category: c, count: tasks.filter((t: any) => t.category === c).length })).filter((c) => c.count > 0)
    const byStatus = statuses.map((s) => ({ status: s, count: tasks.filter((t: any) => t.status === s).length })).filter((s) => s.count > 0)
    const byPriority = priorities.map((p) => ({ priority: p, count: tasks.filter((t: any) => t.priority === p).length })).filter((p) => p.count > 0)

    res.json({ byCategory, byStatus, byPriority })
  } catch (e) { next(e) }
})

router.get('/interview-progress', async (_req, res, next) => {
  try {
    const companies = await db.findAll('interview_companies')
    const questions = await db.findAll('interview_questions')
    const statuses = ['pending', 'scheduled', 'completed', 'passed', 'failed']
    const qCategories = ['general', 'behavioral', 'technical', 'case']

    const byStatus = statuses.map((s) => ({ status: s, count: companies.filter((c: any) => c.status === s).length })).filter((s) => s.count > 0)
    const questionsByCategory = qCategories.map((c) => ({ category: c, count: questions.filter((q: any) => q.category === c).length })).filter((c) => c.count > 0)

    res.json({ byStatus, questionsByCategory })
  } catch (e) { next(e) }
})

router.get('/notes-trend', async (req, res, next) => {
  try {
    const days = parseInt(req.query.days as string) || 7
    const notes = await db.findAll('notes')
    const knowledge = await db.findAll('knowledge_items')
    const trend: { date: string; notes: number; knowledge: number }[] = []

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      const n = notes.filter((item: any) => item.created_at?.slice(0, 10) === dateStr).length
      const k = knowledge.filter((item: any) => item.created_at?.slice(0, 10) === dateStr).length
      trend.push({ date: dateStr.slice(5), notes: n, knowledge: k })
    }
    res.json(trend)
  } catch (e) { next(e) }
})

export default router
