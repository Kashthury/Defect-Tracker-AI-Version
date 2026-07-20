import React from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  /** Optional icon shown in a gradient badge next to the title. Backward-compatible: omit for the plain look. */
  icon?: React.ReactNode
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, actions, icon }) => {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-500 text-white shadow-panel">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-[22px] font-bold leading-tight text-ink-900">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-ink-500">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
