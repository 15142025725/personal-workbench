import { Search, Calendar } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function TopBar() {
  const [dateStr, setDateStr] = useState('')

  useEffect(() => {
    const now = new Date()
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    setDateStr(
      `${now.getMonth() + 1}月${now.getDate()}日 ${weekdays[now.getDay()]}`
    )
  }, [])

  return (
    <header className="h-14 border-b border-border bg-surface flex items-center justify-between px-6 gap-4">
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="搜索任务、笔记、知识..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-bg border border-border text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <Calendar size={16} />
        <span>{dateStr}</span>
      </div>
    </header>
  )
}
