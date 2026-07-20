import React from 'react'
import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  title?: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Nothing here yet',
  description,
  icon,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-ink-100 to-ink-200 text-ink-500 shadow-sm">
        {icon ?? <Inbox className="h-5 w-5" />}
      </div>
      <h4 className="text-sm font-semibold text-ink-700">{title}</h4>
      {description && <p className="max-w-sm text-xs text-ink-500">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
