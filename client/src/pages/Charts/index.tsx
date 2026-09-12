import { useState, useEffect } from 'react'
import { chartsApi } from '../../api/dashboard'
import { LineChartCard, BarChartCard, PieChartCard, AreaChartCard } from '../../components/charts/ChartCards'
import { EmptyState } from '../../components/ui/EmptyState'

const categoryLabels: Record<string, string> = {
  work: '工作',
  interview: '面试',
  personal: '个人',
  learning: '学习',
  general: '通用',
}

const statusLabels: Record<string, string> = {
  pending: '待面',
  scheduled: '已约',
  completed: '已面',
  passed: '通过',
  failed: '未通过',
}

export default function Charts() {
  const [trend, setTrend] = useState<any[]>([])
  const [dist, setDist] = useState<any>(null)
  const [interview, setInterview] = useState<any>(null)
  const [notesTrend, setNotesTrend] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [t, d, i, n] = await Promise.all([
          chartsApi.tasksTrend(7),
          chartsApi.taskDistribution(),
          chartsApi.interviewProgress(),
          chartsApi.notesTrend(7),
        ])
        setTrend(t)
        setDist(d)
        setInterview(i)
        setNotesTrend(n)
      } catch { } finally { setLoading(false) }
    }
    load()
  }, [])

  if (loading) {
    return <div className="text-center py-12 text-text-muted text-sm">加载中...</div>
  }

  const hasData = trend.length > 0 || dist?.byCategory?.length > 0

  if (!hasData) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold">数据看板</h1>
        <EmptyState
          title="暂无数据"
          description="添加任务、笔记、面试记录后，数据看板将自动生成图表"
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">数据看板</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LineChartCard
          title="任务趋势（近7天）"
          data={trend}
          lines={[{ key: 'created', label: '新增' }, { key: 'completed', label: '完成' }]}
        />
        <PieChartCard
          title="任务分类分布"
          data={(dist?.byCategory || []).map((c: any) => ({ name: categoryLabels[c.category] || c.category, value: c.count }))}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BarChartCard
          title="面试进度统计"
          data={(interview?.byStatus || []).map((s: any) => ({ name: statusLabels[s.status] || s.status, count: s.count }))}
        />
        <AreaChartCard
          title="笔记/知识增长趋势（近7天）"
          data={notesTrend}
          areas={[{ key: 'notes', label: '笔记' }, { key: 'knowledge', label: '知识' }]}
        />
      </div>
    </div>
  )
}
