import { Router } from 'express'
import db from '../db/index.js'

const router = Router()

router.get('/', async (_req, res, next) => {
  try {
    const today = new Date().toISOString().slice(0, 10)

    const allTasks = await db.findAll('tasks')
    const pendingTasks = allTasks
      .filter((t: any) => t.status !== 'completed')
      .sort((a: any, b: any) => {
        const pri = { high: 0, medium: 1, low: 2 }
        return pri[a.priority as keyof typeof pri] - pri[b.priority as keyof typeof pri]
      })
      .slice(0, 5)

    const allCompanies = await db.findAll('interview_companies')
    const upcomingInterviews = allCompanies
      .filter((c: any) => ['pending', 'scheduled'].includes(c.status) && c.interview_date && c.interview_date >= today)
      .sort((a: any, b: any) => a.interview_date.localeCompare(b.interview_date))

    const allNotes = await db.findAll('notes')
    const recentNotes = allNotes
      .sort((a: any, b: any) => b.updated_at.localeCompare(a.updated_at))
      .slice(0, 3)

    const allLinks = await db.findAll('quick_links')
    const pinnedLinks = allLinks
      .sort((a: any, b: any) => (a.sort_order - b.sort_order) || b.created_at.localeCompare(a.created_at))
      .slice(0, 6)

    const companies = allCompanies

    res.json({
      pendingTasks,
      upcomingInterview: upcomingInterviews[0] || null,
      recentNotes,
      pinnedLinks,
      stats: {
        tasks: {
          total: allTasks.length,
          pending: allTasks.filter((t: any) => t.status === 'pending').length,
          in_progress: allTasks.filter((t: any) => t.status === 'in_progress').length,
          completed: allTasks.filter((t: any) => t.status === 'completed').length,
        },
        interviews: {
          total: companies.length,
          pending: companies.filter((c: any) => c.status === 'pending').length,
          scheduled: companies.filter((c: any) => c.status === 'scheduled').length,
          completed: companies.filter((c: any) => c.status === 'completed').length,
          passed: companies.filter((c: any) => c.status === 'passed').length,
          failed: companies.filter((c: any) => c.status === 'failed').length,
        },
        notes: allNotes.length,
        knowledge: await db.count('knowledge_items'),
      },
    })
  } catch (e) { next(e) }
})

export default router
