import { cn } from '../../lib/utils'

const colors: Record<string, string> = {
  default: 'bg-bg text-text-secondary',
  accent: 'bg-accent-light text-accent',
  success: 'bg-green-50 text-success',
  warning: 'bg-amber-50 text-warning',
  danger: 'bg-red-50 text-danger',
  blue: 'bg-blue-50 text-blue-600',
  purple: 'bg-purple-50 text-purple-600',
}

export function Badge({ children, color = 'default', className }: {
  children: React.ReactNode
  color?: keyof typeof colors
  className?: string
}) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium', colors[color], className)}>
      {children}
    </span>
  )
}
