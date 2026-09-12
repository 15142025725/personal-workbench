import { Router } from 'express'
import db from '../db/index.js'

const router = Router()

router.get('/companies', async (_req, res, next) => {
  try {
    const companies = await db.findAll('interview_companies')
    companies.sort((a: any, b: any) => b.created_at.localeCompare(a.created_at))
    res.json(companies)
  } catch (e) { next(e) }
})

router.post('/companies', async (req, res, next) => {
  try {
    const { name, position = '', industry = '', status = 'pending', interview_date = null, hr_contact = '', notes = '' } = req.body
    if (!name) return res.status(400).json({ error: 'name is required' })
    const company = await db.insert('interview_companies', { name, position, industry, status, interview_date, hr_contact, notes })
    res.status(201).json(company)
  } catch (e) { next(e) }
})

router.put('/companies/:id', async (req, res, next) => {
  try {
    const { name, position, industry, status, interview_date, hr_contact, notes } = req.body
    const id = parseInt(req.params.id)
    const existing = await db.findById('interview_companies', id)
    if (!existing) return res.status(404).json({ error: 'company not found' })
    const updated = await db.update('interview_companies', id, {
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

router.delete('/companies/:id', async (req, res, next) => {
  try {
    const ok = await db.delete('interview_companies', parseInt(req.params.id))
    if (!ok) return res.status(404).json({ error: 'company not found' })
    res.status(204).send()
  } catch (e) { next(e) }
})

router.get('/questions', async (req, res, next) => {
  try {
    const { company_id, category } = req.query
    let questions = await db.findAll('interview_questions')
    if (company_id) questions = questions.filter((q: any) => q.company_id === parseInt(String(company_id)))
    if (category) questions = questions.filter((q: any) => q.category === category)
    questions.sort((a: any, b: any) => b.created_at.localeCompare(a.created_at))
    res.json(questions)
  } catch (e) { next(e) }
})

router.post('/questions', async (req, res, next) => {
  try {
    const { company_id = null, question, answer = '', category = 'general', difficulty = 'medium' } = req.body
    if (!question) return res.status(400).json({ error: 'question is required' })
    const q = await db.insert('interview_questions', { company_id, question, answer, category, difficulty })
    res.status(201).json(q)
  } catch (e) { next(e) }
})

router.put('/questions/:id', async (req, res, next) => {
  try {
    const { company_id, question, answer, category, difficulty } = req.body
    const id = parseInt(req.params.id)
    const existing = await db.findById('interview_questions', id)
    if (!existing) return res.status(404).json({ error: 'question not found' })
    const updated = await db.update('interview_questions', id, {
      ...(company_id !== undefined && { company_id }),
      ...(question !== undefined && { question }),
      ...(answer !== undefined && { answer }),
      ...(category !== undefined && { category }),
      ...(difficulty !== undefined && { difficulty }),
    })
    res.json(updated)
  } catch (e) { next(e) }
})

router.delete('/questions/:id', async (req, res, next) => {
  try {
    const ok = await db.delete('interview_questions', parseInt(req.params.id))
    if (!ok) return res.status(404).json({ error: 'question not found' })
    res.status(204).send()
  } catch (e) { next(e) }
})

export default router
