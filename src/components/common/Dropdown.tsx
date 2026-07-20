import React, { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'
import { SelectOption } from '@/types/common'

interface DropdownProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string
  error?: string
  required?: boolean
  options: SelectOption[]
  placeholder?: string
}

export const Dropdown = forwardRef<HTMLSelectElement, DropdownProps>(
  ({ label, error, required, options, placeholder = 'Select...', className, id, ...rest }, ref) => {
    const selectId = id || rest.name
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-ink-700">
            {label}
            {required && <span className="text-signal-critical ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'h-9 w-full appearance-none rounded-xl border bg-white px-3 pr-9 text-sm text-ink-900',
              'transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400',
              error ? 'border-signal-critical focus:border-signal-critical' : 'border-ink-200 focus:border-brand-400',
              className,
            )}
            aria-invalid={!!error}
            {...rest}
          >
            <option value="" disabled hidden>
              {placeholder}
            </option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        </div>
        {error && <span className="text-xs text-signal-critical">{error}</span>}
      </div>
    )
  },
)
Dropdown.displayName = 'Dropdown'
