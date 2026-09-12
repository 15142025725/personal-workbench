import { cn } from '../../lib/utils'
import type { SelectHTMLAttributes } from 'react'

interface Option {
  label: string
  value: string
}

export function Select({ className, options, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { options: Option[] }) {
  return (
    <select className={cn('input cursor-pointer', className)} {...props}>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}
