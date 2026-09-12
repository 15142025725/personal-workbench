import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Building2, FileQuestion } from 'lucide-react'
import { interviewsApi, type Company, type Question } from '../../api/interviews'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Input, Textarea } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { cn } from '../../lib/utils'

const statusLabels: Record<string, string> = {
  pending: '待面',
  scheduled: '已约',
  completed: '已面',
  passed: '通过',
  failed: '未通过',
}

const statusColors: Record<string, string> = {
  pending: 'default',
  scheduled: 'blue',
  completed: 'purple',
  passed: 'success',
  failed: 'danger',
}

const statusOptions = [
  { label: '待面', value: 'pending' },
  { label: '已约', value: 'scheduled' },
  { label: '已面', value: 'completed' },
  { label: '通过', value: 'passed' },
  { label: '未通过', value: 'failed' },
]

const qCategoryOptions = [
  { label: '通用', value: 'general' },
  { label: '行为面', value: 'behavioral' },
  { label: '技术面', value: 'technical' },
  { label: '案例面', value: 'case' },
]

const qDifficultyOptions = [
  { label: '简单', value: 'easy' },
  { label: '中等', value: 'medium' },
  { label: '困难', value: 'hard' },
]

export default function Interview() {
  const [tab, setTab] = useState<'companies' | 'questions'>('companies')
  const [companies, setCompanies] = useState<Company[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [companyModal, setCompanyModal] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [questionModal, setQuestionModal] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [deleteId, setDeleteId] = useState<{ type: 'company' | 'question'; id: number } | null>(null)
  const [companyForm, setCompanyForm] = useState({
    name: '', position: '', industry: '', status: 'pending', interview_date: '', hr_contact: '', notes: ''
  })
  const [questionForm, setQuestionForm] = useState({
    company_id: '', question: '', answer: '', category: 'general', difficulty: 'medium'
  })

  const load = async () => {
    try {
      const [c, q] = await Promise.all([
        interviewsApi.companies.list(),
        interviewsApi.questions.list()
      ])
      setCompanies(c)
      setQuestions(q)
    } catch { } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openCompanyCreate = () => {
    setEditingCompany(null)
    setCompanyForm({ name: '', position: '', industry: '', status: 'pending', interview_date: '', hr_contact: '', notes: '' })
    setCompanyModal(true)
  }

  const openCompanyEdit = (c: Company) => {
    setEditingCompany(c)
    setCompanyForm({
      name: c.name, position: c.position, industry: c.industry, status: c.status,
      interview_date: c.interview_date?.slice(0, 10) || '', hr_contact: c.hr_contact, notes: c.notes
    })
    setCompanyModal(true)
  }

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = { ...companyForm, interview_date: companyForm.interview_date || null }
    if (editingCompany) {
      await interviewsApi.companies.update(editingCompany.id, data)
    } else {
      await interviewsApi.companies.create(data)
    }
    setCompanyModal(false)
    load()
  }

  const openQuestionCreate = () => {
    setEditingQuestion(null)
    setQuestionForm({ company_id: '', question: '', answer: '', category: 'general', difficulty: 'medium' })
    setQuestionModal(true)
  }

  const openQuestionEdit = (q: Question) => {
    setEditingQuestion(q)
    setQuestionForm({
      company_id: q.company_id ? String(q.company_id) : '',
      question: q.question, answer: q.answer, category: q.category, difficulty: q.difficulty
    })
    setQuestionModal(true)
  }

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      ...questionForm,
      company_id: questionForm.company_id ? parseInt(questionForm.company_id) : null
    }
    if (editingQuestion) {
      await interviewsApi.questions.update(editingQuestion.id, data)
    } else {
      await interviewsApi.questions.create(data)
    }
    setQuestionModal(false)
    load()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    if (deleteId.type === 'company') {
      await interviewsApi.companies.remove(deleteId.id)
    } else {
      await interviewsApi.questions.remove(deleteId.id)
    }
    setDeleteId(null)
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">面试准备中心</h1>
        <Button size="sm" onClick={tab === 'companies' ? openCompanyCreate : openQuestionCreate}>
          <Plus size={16} className="mr-1" />{tab === 'companies' ? '添加公司' : '添加题目'}
        </Button>
      </div>

      <div className="flex gap-0.5 bg-bg rounded-lg p-0.5 w-fit">
        <button
          onClick={() => setTab('companies')}
          className={cn('flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium', tab === 'companies' ? 'bg-surface shadow-sm text-text-primary' : 'text-text-muted')}
        >
          <Building2 size={16} />公司列表 ({companies.length})
        </button>
        <button
          onClick={() => setTab('questions')}
          className={cn('flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium', tab === 'questions' ? 'bg-surface shadow-sm text-text-primary' : 'text-text-muted')}
        >
          <FileQuestion size={16} />题库 ({questions.length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-text-muted text-sm">加载中...</div>
      ) : tab === 'companies' ? (
        companies.length === 0 ? (
          <EmptyState icon={<Building2 size={32} />} title="暂无公司" description="添加面试公司开始追踪进度" action={<Button size="sm" onClick={openCompanyCreate}>添加公司</Button>} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {companies.map((c) => (
              <div key={c.id} className="group card hover:shadow-card-hover transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-base font-semibold">{c.name}</h3>
                    {c.position && <p className="text-sm text-text-secondary">{c.position}</p>}
                  </div>
                  <Badge color={statusColors[c.status] as any}>{statusLabels[c.status]}</Badge>
                </div>
                {c.interview_date && (
                  <p className="text-xs text-text-muted mb-2">面试时间: {c.interview_date.slice(0, 10)}</p>
                )}
                {c.industry && <p className="text-xs text-text-muted">行业: {c.industry}</p>}
                {c.notes && <p className="text-xs text-text-secondary mt-2 line-clamp-2">{c.notes}</p>}
                <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openCompanyEdit(c)} className="p-1 rounded hover:bg-bg text-text-muted hover:text-text-primary"><Pencil size={14} /></button>
                  <button onClick={() => setDeleteId({ type: 'company', id: c.id })} className="p-1 rounded hover:bg-bg text-text-muted hover:text-danger"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : questions.length === 0 ? (
        <EmptyState icon={<FileQuestion size={32} />} title="暂无题目" description="添加面试题目和参考答案" action={<Button size="sm" onClick={openQuestionCreate}>添加题目</Button>} />
      ) : (
        <div className="space-y-2">
          {questions.map((q) => {
            const company = companies.find((c) => c.id === q.company_id)
            return (
              <div key={q.id} className="group card hover:shadow-card-hover transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {company && <Badge color="blue">{company.name}</Badge>}
                      <Badge color="purple">{qCategoryOptions.find(o => o.value === q.category)?.label}</Badge>
                      <Badge>{qDifficultyOptions.find(o => o.value === q.difficulty)?.label}</Badge>
                    </div>
                    <p className="text-sm font-medium mb-1">{q.question}</p>
                    {q.answer && <p className="text-xs text-text-muted whitespace-pre-wrap">{q.answer}</p>}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openQuestionEdit(q)} className="p-1 rounded hover:bg-bg text-text-muted hover:text-text-primary"><Pencil size={14} /></button>
                    <button onClick={() => setDeleteId({ type: 'question', id: q.id })} className="p-1 rounded hover:bg-bg text-text-muted hover:text-danger"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={companyModal} onClose={() => setCompanyModal(false)} title={editingCompany ? '编辑公司' : '添加公司'}>
        <form onSubmit={handleCompanySubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">公司名称</label>
            <Input value={companyForm.name} onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })} placeholder="公司名" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">岗位</label>
              <Input value={companyForm.position} onChange={(e) => setCompanyForm({ ...companyForm, position: e.target.value })} placeholder="如：区域策略运营" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">行业</label>
              <Input value={companyForm.industry} onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })} placeholder="如：本地生活" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">状态</label>
              <Select value={companyForm.status} onChange={(e) => setCompanyForm({ ...companyForm, status: e.target.value })} options={statusOptions} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">面试日期</label>
              <Input type="date" value={companyForm.interview_date} onChange={(e) => setCompanyForm({ ...companyForm, interview_date: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">HR联系方式</label>
            <Input value={companyForm.hr_contact} onChange={(e) => setCompanyForm({ ...companyForm, hr_contact: e.target.value })} placeholder="微信/电话" />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">备注</label>
            <Textarea value={companyForm.notes} onChange={(e) => setCompanyForm({ ...companyForm, notes: e.target.value })} placeholder="面经、注意事项等..." />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setCompanyModal(false)}>取消</Button>
            <Button type="submit">{editingCompany ? '保存' : '添加'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={questionModal} onClose={() => setQuestionModal(false)} title={editingQuestion ? '编辑题目' : '添加题目'}>
        <form onSubmit={handleQuestionSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">关联公司</label>
            <Select
              value={questionForm.company_id}
              onChange={(e) => setQuestionForm({ ...questionForm, company_id: e.target.value })}
              options={[{ label: '通用题目', value: '' }, ...companies.map((c) => ({ label: c.name, value: String(c.id) }))]}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">问题</label>
            <Textarea value={questionForm.question} onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })} placeholder="面试问题..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">参考答案</label>
            <Textarea value={questionForm.answer} onChange={(e) => setQuestionForm({ ...questionForm, answer: e.target.value })} placeholder="答案或要点..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">分类</label>
              <Select value={questionForm.category} onChange={(e) => setQuestionForm({ ...questionForm, category: e.target.value })} options={qCategoryOptions} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">难度</label>
              <Select value={questionForm.difficulty} onChange={(e) => setQuestionForm({ ...questionForm, difficulty: e.target.value })} options={qDifficultyOptions} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setQuestionModal(false)}>取消</Button>
            <Button type="submit">{editingQuestion ? '保存' : '添加'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="确认删除"
        message="确认删除此条目？此操作不可撤销。"
      />
    </div>
  )
}
