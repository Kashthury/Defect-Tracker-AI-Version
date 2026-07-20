import React from 'react'
import { Loader2 } from 'lucide-react'

interface LoaderProps {
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

const SIZES = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-9 w-9' }

export const Loader: React.FC<LoaderProps> = ({ label, size = 'md' }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-2 text-ink-400">
      <Loader2 className={`${SIZES[size]} animate-spin text-brand-500`} />
      {label && <span className="text-xs font-medium">{label}</span>}
    </div>
  )
}

/** Additive: a shimmering skeleton block for cards, table rows, and form fields. */
export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`animate-pulse rounded-lg bg-gradient-to-r from-ink-100 via-ink-50 to-ink-100 ${className ?? 'h-4 w-full'}`} />
)

/** Additive: a row of skeleton blocks sized like a typical data table row. */
export const SkeletonTableRows: React.FC<{ rows?: number; columns?: number }> = ({ rows = 6, columns = 5 }) => (
  <div className="flex flex-col gap-3 p-4">
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="flex items-center gap-4">
        {Array.from({ length: columns }).map((__, c) => (
          <Skeleton key={c} className="h-4 flex-1" />
        ))}
      </div>
    ))}
  </div>
)

/** Additive: a skeleton placeholder shaped like a summary/stat card. */
export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`rounded-2xl border border-ink-100 bg-white p-4 shadow-panel ${className ?? ''}`}>
    <Skeleton className="h-9 w-9 rounded-xl" />
    <Skeleton className="mt-3 h-6 w-16" />
    <Skeleton className="mt-2 h-3 w-24" />
  </div>
)
