import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'filterClear'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-gradient-to-r from-brand-600 to-brand-500 text-white hover:from-brand-700 hover:to-brand-600 disabled:from-ink-200 disabled:to-ink-200 disabled:text-ink-400 shadow-panel',
  secondary: 'border border-brand-200 bg-brand-50 text-brand-700 shadow-sm hover:border-brand-300 hover:bg-brand-100 disabled:border-ink-200 disabled:bg-ink-100 disabled:text-ink-400',
  outline: 'border border-ink-300 bg-white text-ink-700 shadow-sm hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700 disabled:border-ink-200 disabled:bg-ink-50 disabled:text-ink-300',
  filterClear: 'border border-brand-300 bg-brand-100 text-brand-700 shadow-sm hover:border-brand-400 hover:bg-brand-200 disabled:border-ink-200 disabled:bg-ink-100 disabled:text-ink-300',
  ghost: 'bg-transparent text-ink-600 hover:bg-ink-100 disabled:text-ink-300',
  danger: 'bg-gradient-to-r from-rose-600 to-red-600 text-white hover:from-rose-700 hover:to-red-700 disabled:from-ink-200 disabled:to-ink-200 disabled:text-ink-400',
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-9 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-11 px-5 text-sm gap-2 rounded-xl',
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className,
  children,
  ...rest
}) => {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-150 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-brand-400/30 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:active:scale-100 select-none',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth && 'w-full',
        className,
      )}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  )
}
