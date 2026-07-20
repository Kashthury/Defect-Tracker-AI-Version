import React from 'react'
import { AlertTriangle, BarChart3 } from 'lucide-react'
import { Loader } from '@/components/common/Loader'
import { cn } from '@/utils/cn'

interface ChartCardProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  className?: string
  height?: number
  isLoading?: boolean
  isEmpty?: boolean
  emptyLabel?: string
  error?: string | null
  children: React.ReactNode
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  actions,
  className,
  height = 300,
  isLoading,
  isEmpty,
  emptyLabel = 'No data available for the selected filters.',
  error,
  children,
}) => {
  return (
    <div className={cn('rounded-xl border border-ink-200 bg-white p-5 shadow-panel', className)}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-ink-500">{subtitle}</p>}
        </div>
        {actions}
      </div>
      <div style={{ minHeight: height }} className="flex items-center justify-center">
        {isLoading ? (
          <Loader label="Loading chart data..." />
        ) : error ? (
          <div className="flex flex-col items-center gap-2 text-center">
            <AlertTriangle className="h-6 w-6 text-signal-critical" />
            <p className="max-w-xs text-xs text-ink-500">{error}</p>
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center gap-2 text-center">
            <BarChart3 className="h-6 w-6 text-ink-300" />
            <p className="max-w-xs text-xs text-ink-500">{emptyLabel}</p>
          </div>
        ) : (
          <div className="w-full">{children}</div>
        )}
      </div>
    </div>
  )
}
