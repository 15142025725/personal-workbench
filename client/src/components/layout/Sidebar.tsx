import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  CheckSquare,
  FileText,
  Briefcase,
  BookOpen,
  Link2,
  BarChart3,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react'
import { useUIStore } from '../../store/useUIStore'
import { cn } from '../../lib/utils'

const navItems = [
  { to: '/', label: '首页概览', icon: LayoutDashboard },
  { to: '/tasks', label: '待办管理', icon: CheckSquare },
  { to: '/interview', label: '面试中心', icon: Briefcase },
  { to: '/notes', label: '笔记备忘', icon: FileText },
  { to: '/knowledge', label: '知识库', icon: BookOpen },
  { to: '/links', label: '快捷入口', icon: Link2 },
  { to: '/charts', label: '数据看板', icon: BarChart3 },
]

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-30 h-screen border-r border-border bg-surface transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-60'
      )}
    >
      <div className="flex h-14 items-center justify-between px-4 border-b border-border">
        {!sidebarCollapsed && (
          <span className="text-base font-bold text-text-primary">工作台</span>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-bg text-text-secondary"
        >
          {sidebarCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>
      <nav className="p-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-accent-light text-accent'
                    : 'text-text-secondary hover:bg-bg hover:text-text-primary'
                )
              }
            >
              <Icon size={18} className="shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}
