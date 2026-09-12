import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import tasksRouter from './routes/tasks.js'
import notesRouter from './routes/notes.js'
import interviewsRouter from './routes/interviews.js'
import linksRouter from './routes/links.js'
import knowledgeRouter from './routes/knowledge.js'
import dashboardRouter from './routes/dashboard.js'
import chartsRouter from './routes/charts.js'
import { errorHandler } from './middleware/error.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const clientDistPath = resolve(__dirname, '../../client/dist')

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => res.json({ status: 'ok', database: process.env.SUPABASE_URL ? 'supabase' : 'local' }))
app.use('/api/tasks', tasksRouter)
app.use('/api/notes', notesRouter)
app.use('/api/interviews', interviewsRouter)
app.use('/api/links', linksRouter)
app.use('/api/knowledge', knowledgeRouter)
app.use('/api/dashboard', dashboardRouter)
app.use('/api/charts', chartsRouter)

app.use(express.static(clientDistPath))
app.get('*', (_req, res) => {
  res.sendFile(resolve(clientDistPath, 'index.html'))
})

app.use(errorHandler)

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
