import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CheckSquare, Briefcase, FileText, BookOpen, Link2, ArrowRight, Clock, TrendingUp } from 'lucide-react'
import { dashboardApi, type DashboardData } from '../../api/dashboard'
import { Card, CardHeader } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'

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

function getFavicon(url: string) {
  try {
    const domain = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
  } catch { return '' }
}

function getCountdown(dateStr: string) {
  const target = new Date(dateStr)
  const now = new Date()
  const days = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (days < 0) return `已过去 ${Math.abs(days)} 天`
  if (days === 0) return '今天'
  return `还有 ${days} 天`
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardApi.get().then(setData).catch(() => { }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-12 text-text-muted text-sm">加载中...</div>
  if (!data) return <div className="text-center py-12 text-text-muted text-sm">加载失败</div>

  const { stats } = data
  const completionRate = stats.tasks.total > 0
    ? Math.round((stats.tasks.completed / stats.tasks.total) * 100)
    : 0

  const statCards = [
    { label: '待办任务', value: stats.tasks.pending + stats.tasks.in_progress, sub: `总 ${stats.tasks.total} · 完成率 ${completionRate}%`, icon: CheckSquare, color: 'text-accent', to: '/tasks' },
    { label: '面试公司', value: stats.interviews.total, sub: `待面 ${stats.interviews.pending} · 通过 ${stats.interviews.passed}`, icon: Briefcase, color: 'text-purple-600', to: '/interview' },
    { label: '笔记', value: stats.notes, icon: FileText, color: 'text-blue-600', to: '/notes' },
    { label: '知识条目', value: stats.knowledge, icon: BookOpen, color: 'text-success', to: '/knowledge' },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold mb-1">工作台概览</h1>
        <p className="text-sm text-text-secondary">欢迎回来，这是你今天的概览</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((s) => {
          const Icon = s.icon
          return (
            <Link key={s.label} to={s.to}>
              <Card hover>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-text-muted">{s.label}</p>
                    <p className="text-2xl font-bold mt-1">{s.value}</p>
                    {s.sub && <p className="text-xs text-text-muted mt-0.5">{s.sub}</p>}
                  </div>
                  <div className={`p-2 rounded-lg bg-bg ${s.color}`}>
                    <Icon size={18} />
                  </div>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader
              title="待办任务"
              action={<Link to="/tasks" className="flex items-center gap-1 text-xs text-accent hover:underline"><ArrowRight size={12} />全部</Link>}
            />
            {data.pendingTasks.length === 0 ? (
              <EmptyState icon={<CheckSquare size={28} />} title="暂无待办" description="所有任务已完成" />
            ) : (
              <div className="space-y-2">
                {data.pendingTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${task.priority === 'high' ? 'bg-danger' : task.priority === 'medium' ? 'bg-warning' : 'bg-text-muted'}`} />
                    <span className="text-sm flex-1 truncate">{task.title}</span>
                    <Badge color={categoryColors[task.category] as any}>{categoryLabels[task.category]}</Badge>
                    {task.due_date && <span className="text-xs text-text-muted flex items-center gap-1"><Clock size={12} />{task.due_date.slice(5)}</span>}
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader
              title="最近笔记"
              action={<Link to="/notes" className="flex items-center gap-1 text-xs text-accent hover:underline"><ArrowRight size={12} />全部</Link>}
            />
            {data.recentNotes.length === 0 ? (
              <EmptyState icon={<FileText size={28} />} title="暂无笔记" />
            ) : (
              <div className="space-y-2">
                {data.recentNotes.map((note) => (
                  <div key={note.id} className="py-2 border-b border-border last:border-0">
                    <p className="text-sm font-medium truncate">{note.title}</p>
                    <p className="text-xs text-text-muted truncate">{note.content || '空笔记'}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          {data.upcomingInterview ? (
            <Card>
              <CardHeader title="下一场面试" />
              <div className="text-center py-4">
                <div className="text-3xl font-bold text-accent mb-1">{getCountdown(data.upcomingInterview.interview_date)}</div>
                <p className="text-sm font-medium">{data.upcomingInterview.name}</p>
                {data.upcomingInterview.position && <p className="text-xs text-text-secondary mt-0.5">{data.upcomingInterview.position}</p>}
                <p className="text-xs text-text-muted mt-2">{data.upcomingInterview.interview_date.slice(0, 10)}</p>
              </div>
            </Card>
          ) : (
            <Card>
              <CardHeader title="面试进度" />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">总公司数</span>
                  <span className="font-medium">{stats.interviews.total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">已通过</span>
                  <span className="font-medium text-success">{stats.interviews.passed}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">待面/已约</span>
                  <span className="font-medium text-accent">{stats.interviews.pending + stats.interviews.scheduled}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">未通过</span>
                  <span className="font-medium text-danger">{stats.interviews.failed}</span>
                </div>
              </div>
            </Card>
          )}

          <Card>
            <CardHeader
              title="快捷入口"
              action={<Link to="/links" className="flex items-center gap-1 text-xs text-accent hover:underline"><ArrowRight size={12} />全部</Link>}
            />
            {data.pinnedLinks.length === 0 ? (
              <EmptyState icon={<Link2 size={28} />} title="暂无快捷链接" />
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {data.pinnedLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-bg transition-all"
                  >
                    <img src={getFavicon(link.url)} alt="" className="w-6 h-6 rounded" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                    <span className="text-xs text-center truncate w-full">{link.title}</span>
                  </a>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
