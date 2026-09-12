import { Router } from 'express'
import db from '../db/index.js'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const { search, category } = req.query
    let items = await db.findAll('knowledge_items')
    if (search) {
      const s = String(search).toLowerCase()
      items = items.filter((i: any) => i.title.toLowerCase().includes(s) || i.content.toLowerCase().includes(s))
    }
    if (category) items = items.filter((i: any) => i.category === category)
    items.sort((a: any, b: any) => b.updated_at.localeCompare(a.updated_at))
    res.json(items)
  } catch (e) { next(e) }
})

router.post('/', async (req, res, next) => {
  try {
    const { title, content = '', source = '', tags = [], category = 'general' } = req.body
    if (!title) return res.status(400).json({ error: 'title is required' })
    const item = await db.insert('knowledge_items', { title, content, source, tags: JSON.stringify(tags), category })
    res.status(201).json(item)
  } catch (e) { next(e) }
})

router.put('/:id', async (req, res, next) => {
  try {
    const { title, content, source, tags, category } = req.body
    const id = parseInt(req.params.id)
    const existing = await db.findById('knowledge_items', id)
    if (!existing) return res.status(404).json({ error: 'item not found' })
    const updated = await db.update('knowledge_items', id, {
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(source !== undefined && { source }),
      ...(tags !== undefined && { tags: JSON.stringify(tags) }),
      ...(category !== undefined && { category }),
    })
    res.json(updated)
  } catch (e) { next(e) }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const ok = await db.delete('knowledge_items', parseInt(req.params.id))
    if (!ok) return res.status(404).json({ error: 'item not found' })
    res.status(204).send()
  } catch (e) { next(e) }
})

export default router
