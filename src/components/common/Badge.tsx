import React from 'react'
import { cn } from '@/utils/cn'
import { BadgeTone } from '@/types/common'

interface BadgeProps {
  children: React.ReactNode
  tone?: BadgeTone
  dot?: boolean
}

const TONE_CLASSES: Record<BadgeTone, string> = {
  critical: 'bg-red-50 text-signal-critical ring-1 ring-inset ring-red-200',
  high: 'bg-orange-50 text-signal-high ring-1 ring-inset ring-orange-200',
  medium: 'bg-amber-50 text-signal-medium ring-1 ring-inset ring-amber-200',
  low: 'bg-emerald-50 text-signal-low ring-1 ring-inset ring-emerald-200',
  info: 'bg-blue-50 text-signal-info ring-1 ring-inset ring-blue-200',
  success: 'bg-emerald-50 text-signal-low ring-1 ring-inset ring-emerald-200',
  neutral: 'bg-ink-100 text-ink-600 ring-1 ring-inset ring-ink-200',
}

const DOT_CLASSES: Record<BadgeTone, string> = {
  critical: 'bg-signal-critical',
  high: 'bg-signal-high',
  medium: 'bg-signal-medium',
  low: 'bg-signal-low',
  info: 'bg-signal-info',
  success: 'bg-signal-low',
  neutral: 'bg-ink-400',
}

export const Badge: React.FC<BadgeProps> = ({ children, tone = 'neutral', dot = false }) => {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap shadow-sm transition-transform hover:scale-[1.03]', TONE_CLASSES[tone])}>
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full status-dot', DOT_CLASSES[tone])} />}
      {children}
    </span>
  )
}

export function severityTone(severity: string): BadgeTone {
  switch (severity) {
    case 'Critical': return 'critical'
    case 'High': return 'high'
    case 'Medium': return 'medium'
    case 'Low': return 'low'
    default: return 'neutral'
  }
}

export function statusTone(status: string): BadgeTone {
  switch (status) {
    case 'Closed': return 'success'
    case 'Fixed': return 'info'
    case 'Reopened': return 'critical'
    case 'In Progress': return 'medium'
    case 'Retest': return 'info'
    case 'New': return 'neutral'
    case 'Assigned': return 'neutral'
    default: return 'neutral'
  }
}
