import { Pencil, Trash2, ArrowRightCircle } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import type { Task } from '../../api/tasks'

const categoryLabels: Record<string, string> = {
  work: '工作',
  interview: '面试',
  personal: '个人',
  learning: '学习',
}

const categoryColors: Record<string, string> = {
  work: 'blue',
  interview: 'purple',
  personal: 'default',
  learning: 'success',
}

const priorityLabels: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低',
}

const priorityColors: Record<string, string> = {
  high: 'danger',
  medium: 'warning',
  low: 'default',
}

const nextStatus: Record<string, string> = {
  pending: 'in_progress',
  in_progress: 'completed',
  completed: 'pending',
}

const nextStatusLabel: Record<string, string> = {
  pending: '开始',
  in_progress: '完成',
  completed: '重置',
}

export function TaskCard({ task, onEdit, onDelete, onStatusChange }: {
  task: Task
  onEdit: () => void
  onDelete: () => void
  onStatusChange: (status: string) => void
}) {
  return (
    <div className="group bg-surface rounded-lg border border-border p-3.5 hover:shadow-card-hover transition-all">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium text-text-primary leading-snug flex-1">{task.title}</h4>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-1 rounded hover:bg-bg text-text-muted hover:text-text-primary">
            <Pencil size={14} />
          </button>
          <button onClick={onDelete} className="p-1 rounded hover:bg-bg text-text-muted hover:text-danger">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      {task.description && (
        <p className="text-xs text-text-muted mb-2 line-clamp-2">{task.description}</p>
      )}
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          <Badge color={categoryColors[task.category] as any}>{categoryLabels[task.category]}</Badge>
          <Badge color={priorityColors[task.priority] as any}>{priorityLabels[task.priority]}</Badge>
          {task.due_date && (
            <Badge>{task.due_date.slice(5)}</Badge>
          )}
        </div>
        <button
          onClick={() => onStatusChange(nextStatus[task.status])}
          className="flex items-center gap-1 text-xs text-accent hover:text-accent-dark transition-colors"
        >
          <ArrowRightCircle size={14} />
          {nextStatusLabel[task.status]}
        </button>
      </div>
    </div>
  )
}
