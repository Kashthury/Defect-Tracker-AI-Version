import React from 'react'
import { cn } from '@/utils/cn'

interface MetricCardProps {
  label: string
  value: string
  icon: React.ReactNode
  tint: string
  accent: string
  trend?: string
  onClick?: () => void
  isActive?: boolean
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, icon, tint, accent, trend, onClick, isActive }) => {
  const Comp: any = onClick ? 'button' : 'div'
  return (
    <Comp
      onClick={onClick}
      type={onClick ? 'button' : undefined}
      className={cn(
        'flex min-w-0 flex-1 items-center gap-3 rounded-xl border bg-white p-4 text-left shadow-panel transition-all duration-150',
        onClick && 'hover:-translate-y-0.5 hover:shadow-floating',
        isActive ? 'border-brand-400 ring-2 ring-brand-400/30' : 'border-ink-200',
      )}
    >
      <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg', tint)} style={{ color: accent }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-ink-500">{label}</p>
        <p className="text-xl font-bold text-ink-900">{value}</p>
        {trend && <p className="text-[11px] text-ink-400">{trend}</p>}
      </div>
    </Comp>
  )
}
