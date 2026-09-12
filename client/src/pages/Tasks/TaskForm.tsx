import { useState, useEffect } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Input, Textarea } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import type { Task } from '../../api/tasks'

const categoryOptions = [
  { label: '工作', value: 'work' },
  { label: '面试', value: 'interview' },
  { label: '个人', value: 'personal' },
  { label: '学习', value: 'learning' },
]

const priorityOptions = [
  { label: '高', value: 'high' },
  { label: '中', value: 'medium' },
  { label: '低', value: 'low' },
]

export function TaskForm({ open, onClose, onSubmit, editing }: {
  open: boolean
  onClose: () => void
  onSubmit: (data: Partial<Task>) => void
  editing?: Task | null
}) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'work',
    priority: 'medium',
    due_date: '',
  })

  useEffect(() => {
    if (editing) {
      setForm({
        title: editing.title,
        description: editing.description,
        category: editing.category,
        priority: editing.priority,
        due_date: editing.due_date?.slice(0, 10) || '',
      })
    } else {
      setForm({ title: '', description: '', category: 'work', priority: 'medium', due_date: '' })
    }
  }, [editing, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    onSubmit({
      ...form,
      due_date: form.due_date || null,
    })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? '编辑任务' : '新建任务'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">任务标题</label>
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="输入任务标题..."
            autoFocus
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">描述</label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="任务详细描述..."
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">分类</label>
            <Select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              options={categoryOptions}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">优先级</label>
            <Select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              options={priorityOptions}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">截止日期</label>
            <Input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>取消</Button>
          <Button type="submit">{editing ? '保存' : '创建'}</Button>
        </div>
      </form>
    </Modal>
  )
}
