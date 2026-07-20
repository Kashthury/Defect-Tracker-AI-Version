import React from 'react'
import { cn } from '@/utils/cn'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label: string
}

export const Toggle: React.FC<ToggleProps> = ({ checked, onChange, disabled, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={cn(
      'inline-flex h-8 min-w-[112px] shrink-0 items-center justify-between gap-2 whitespace-nowrap rounded-full border px-2.5 text-xs font-semibold shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-brand-400/30 focus-visible:ring-offset-2',
      checked
        ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
        : 'border-ink-300 bg-ink-100 text-ink-600 hover:bg-ink-200',
      disabled && 'cursor-not-allowed opacity-40',
    )}
  >
    <span>{checked ? 'Active' : 'Inactive'}</span>
    <span className={cn('relative inline-block h-5 w-9 shrink-0 overflow-hidden rounded-full transition-colors', checked ? 'bg-emerald-600' : 'bg-ink-400')} aria-hidden="true">
      <span className={cn('absolute left-0.5 top-0.5 block h-4 w-4 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-4' : 'translate-x-0')} />
    </span>
  </button>
)
