import React from 'react'
import { cn } from '@/utils/cn'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
  actions?: React.ReactNode
  padded?: boolean
}

export const Card: React.FC<CardProps> = ({ title, subtitle, actions, padded = true, className, children, ...rest }) => {
  return (
    <div className={cn('rounded-2xl border border-ink-200 bg-white shadow-panel transition-shadow duration-200 hover:shadow-floating/40', className)} {...rest}>
      {(title || actions) && (
        <div className="flex items-start justify-between gap-3 rounded-t-2xl border-b border-ink-100 bg-gradient-to-r from-ink-50/70 to-white px-5 py-4">
          <div>
            {title && <h3 className="text-[15px] font-semibold text-ink-900">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-xs text-ink-500">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className={padded ? 'p-5' : undefined}>{children}</div>
    </div>
  )
}
