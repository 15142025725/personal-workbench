import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { useUIStore } from '../../store/useUIStore'
import { cn } from '../../lib/utils'

export default function Layout() {
  const { sidebarCollapsed } = useUIStore()

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      <div
        className={cn(
          'transition-all duration-300',
          sidebarCollapsed ? 'ml-16' : 'ml-60'
        )}
      >
        <TopBar />
        <main className="p-6 max-w-[1200px] mx-auto animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
