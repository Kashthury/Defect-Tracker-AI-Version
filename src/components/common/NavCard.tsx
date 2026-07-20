import React from 'react'
import { ChevronRight, type LucideIcon } from 'lucide-react'
import { cn } from '@/utils/cn'

interface NavCardProps {
  title: string
  description?: string
  icon: LucideIcon
  onClick: () => void
  badge?: React.ReactNode
  disabled?: boolean
}

/** Clickable card used on hub/landing pages to surface a group of related destinations. */
export const NavCard: React.FC<NavCardProps> = ({ title, description, icon: Icon, onClick, badge, disabled = false }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'group flex items-start gap-4 rounded-lg border border-ink-200 bg-white p-5 text-left shadow-panel transition-all',
        disabled
          ? 'cursor-not-allowed opacity-60'
          : 'hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md',
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-500/15">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-ink-900">{title}</h3>
          {badge}
        </div>
        {description && <p className="mt-1 text-xs leading-relaxed text-ink-500">{description}</p>}
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-ink-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-500" />
    </button>
  )
}
