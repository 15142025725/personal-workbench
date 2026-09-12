import { Router } from 'express'
import db from '../db/index.js'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const { search } = req.query
    let notes = await db.findAll('notes')
    if (search) {
      const s = String(search).toLowerCase()
      notes = notes.filter((n: any) => n.title.toLowerCase().includes(s) || n.content.toLowerCase().includes(s))
    }
    notes.sort((a: any, b: any) => (b.pinned - a.pinned) || b.updated_at.localeCompare(a.updated_at))
    res.json(notes)
  } catch (e) { next(e) }
})

router.post('/', async (req, res, next) => {
  try {
    const { title, content = '', tags = [] } = req.body
    if (!title) return res.status(400).json({ error: 'title is required' })
    const note = await db.insert('notes', { title, content, tags: JSON.stringify(tags), pinned: 0 })
    res.status(201).json(note)
  } catch (e) { next(e) }
})

router.put('/:id', async (req, res, next) => {
  try {
    const { title, content, tags } = req.body
    const id = parseInt(req.params.id)
    const existing = await db.findById('notes', id)
    if (!existing) return res.status(404).json({ error: 'note not found' })
    const updated = await db.update('notes', id, {
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(tags !== undefined && { tags: JSON.stringify(tags) }),
    })
    res.json(updated)
  } catch (e) { next(e) }
})

router.patch('/:id/pin', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    const note = await db.findById('notes', id)
    if (!note) return res.status(404).json({ error: 'note not found' })
    const updated = await db.update('notes', id, { pinned: note.pinned ? 0 : 1 })
    res.json(updated)
  } catch (e) { next(e) }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const ok = await db.delete('notes', parseInt(req.params.id))
    if (!ok) return res.status(404).json({ error: 'note not found' })
    res.status(204).send()
  } catch (e) { next(e) }
})

export default router
