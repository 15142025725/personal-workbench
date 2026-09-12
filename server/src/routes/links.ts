import { Router } from 'express'
import db from '../db/index.js'

const router = Router()

router.get('/', async (_req, res, next) => {
  try {
    const links = await db.findAll('quick_links')
    links.sort((a: any, b: any) => (a.sort_order - b.sort_order) || b.created_at.localeCompare(a.created_at))
    res.json(links)
  } catch (e) { next(e) }
})

router.post('/', async (req, res, next) => {
  try {
    const { title, url, description = '', category = 'work', icon = '', sort_order = 0 } = req.body
    if (!title || !url) return res.status(400).json({ error: 'title and url are required' })
    const link = await db.insert('quick_links', { title, url, description, category, icon, sort_order })
    res.status(201).json(link)
  } catch (e) { next(e) }
})

router.put('/:id', async (req, res, next) => {
  try {
    const { title, url, description, category, icon, sort_order } = req.body
    const id = parseInt(req.params.id)
    const existing = await db.findById('quick_links', id)
    if (!existing) return res.status(404).json({ error: 'link not found' })
    const updated = await db.update('quick_links', id, {
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

router.delete('/:id', async (req, res, next) => {
  try {
    const ok = await db.delete('quick_links', parseInt(req.params.id))
    if (!ok) return res.status(404).json({ error: 'link not found' })
    res.status(204).send()
  } catch (e) { next(e) }
})

export default router
