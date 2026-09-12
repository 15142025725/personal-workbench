import { useState, useEffect } from 'react'
import { Plus, LayoutGrid, List as ListIcon } from 'lucide-react'
import { tasksApi, type Task } from '../../api/tasks'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { EmptyState } from '../../components/ui/EmptyState'
import { TaskCard } from './TaskCard'
import { TaskForm } from './TaskForm'
import { cn } from '../../lib/utils'

const statusColumns = [
  { key: 'pending', label: '待办' },
  { key: 'in_progress', label: '进行中' },
  { key: 'completed', label: '已完成' },
]

const categoryFilters = [
  { key: 'all', label: '全部' },
  { key: 'work', label: '工作' },
  { key: 'interview', label: '面试' },
  { key: 'personal', label: '个人' },
  { key: 'learning', label: '学习' },
]

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [filter, setFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const load = async () => {
    try {
      setTasks(await tasksApi.list())
    } catch { } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = tasks.filter((t) => filter === 'all' || t.category === filter)

  const handleSubmit = async (data: Partial<Task>) => {
    if (editing) {
      await tasksApi.update(editing.id, data)
    } else {
      await tasksApi.create(data)
    }
    setEditing(null)
    load()
  }

  const handleStatusChange = async (id: number, status: string) => {
    await tasksApi.updateStatus(id, status)
    load()
  }

  const handleDelete = async () => {
    if (deleteId) {
      await tasksApi.remove(deleteId)
      setDeleteId(null)
      load()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">待办管理</h1>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5 bg-bg rounded-lg p-0.5">
            <button
              onClick={() => setView('kanban')}
              className={cn('p-1.5 rounded-md', view === 'kanban' ? 'bg-surface shadow-sm' : 'text-text-muted')}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setView('list')}
              className={cn('p-1.5 rounded-md', view === 'list' ? 'bg-surface shadow-sm' : 'text-text-muted')}
            >
              <ListIcon size={16} />
            </button>
          </div>
          <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true) }}>
            <Plus size={16} className="mr-1" />新建
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        {categoryFilters.map((c) => (
          <button
            key={c.key}
            onClick={() => setFilter(c.key)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium transition-all',
              filter === c.key
                ? 'bg-accent text-white'
                : 'bg-bg text-text-secondary hover:bg-border/30'
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-text-muted text-sm">加载中...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Plus size={32} />}
          title="暂无任务"
          description="点击右上角新建按钮创建第一个任务"
        />
      ) : view === 'kanban' ? (
        <div className="grid grid-cols-3 gap-4">
          {statusColumns.map((col) => (
            <div key={col.key} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-text-secondary">{col.label}</span>
                <span className="text-xs text-text-muted">{filtered.filter((t) => t.status === col.key).length}</span>
              </div>
              <div className="space-y-2 min-h-[100px]">
                {filtered.filter((t) => t.status === col.key).map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={() => { setEditing(task); setFormOpen(true) }}
                    onDelete={() => setDeleteId(task.id)}
                    onStatusChange={(status) => handleStatusChange(task.id, status)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={() => { setEditing(task); setFormOpen(true) }}
              onDelete={() => setDeleteId(task.id)}
              onStatusChange={(status) => handleStatusChange(task.id, status)}
            />
          ))}
        </div>
      )}

      <TaskForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null) }}
        onSubmit={handleSubmit}
        editing={editing}
      />
      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="删除任务"
        message="确认删除此任务？此操作不可撤销。"
      />
    </div>
  )
}
