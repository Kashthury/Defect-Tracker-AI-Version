import React, { forwardRef } from 'react'
import { cn } from '@/utils/cn'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  required?: boolean
  hint?: string
  leftIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, required, hint, leftIcon, className, id, ...rest }, ref) => {
    const inputId = id || rest.name
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-ink-700">
            {label}
            {required && <span className="text-signal-critical ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">{leftIcon}</span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'h-9 w-full rounded-xl border bg-white px-3 text-sm text-ink-900 placeholder:text-ink-400',
              'transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-400/40',
              error ? 'border-signal-critical focus:border-signal-critical' : 'border-ink-200 focus:border-brand-400',
              !!leftIcon && 'pl-9',
              className,
            )}
            aria-invalid={!!error}
            {...rest}
          />
        </div>
        {error ? (
          <span className="text-xs text-signal-critical">{error}</span>
        ) : hint ? (
          <span className="text-xs text-ink-400">{hint}</span>
        ) : null}
      </div>
    )
  },
)
Input.displayName = 'Input'
