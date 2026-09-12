import { Router } from 'express'
import db from '../db/index.js'

const router = Router()

router.get('/', async (_req, res, next) => {
  try {
    const tasks = await db.findAll('tasks')
    tasks.sort((a: any, b: any) => b.created_at.localeCompare(a.created_at))
    res.json(tasks)
  } catch (e) { next(e) }
})

router.post('/', async (req, res, next) => {
  try {
    const { title, description = '', category = 'work', priority = 'medium', due_date = null } = req.body
    if (!title) return res.status(400).json({ error: 'title is required' })
    const task = await db.insert('tasks', { title, description, category, priority, due_date, status: 'pending' })
    res.status(201).json(task)
  } catch (e) { next(e) }
})

router.put('/:id', async (req, res, next) => {
  try {
    const { title, description, category, priority, due_date, status } = req.body
    const id = parseInt(req.params.id)
    const existing = await db.findById('tasks', id)
    if (!existing) return res.status(404).json({ error: 'task not found' })
    const updated = await db.update('tasks', id, {
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

router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body
    const id = parseInt(req.params.id)
    const valid = ['pending', 'in_progress', 'completed']
    if (!valid.includes(status)) return res.status(400).json({ error: 'invalid status' })
    const updated = await db.update('tasks', id, { status })
    if (!updated) return res.status(404).json({ error: 'task not found' })
    res.json(updated)
  } catch (e) { next(e) }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const ok = await db.delete('tasks', parseInt(req.params.id))
    if (!ok) return res.status(404).json({ error: 'task not found' })
    res.status(204).send()
  } catch (e) { next(e) }
})

export default router
