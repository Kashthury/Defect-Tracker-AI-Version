import React from 'react'
import { cn } from '@/utils/cn'

interface FormRowProps {
  columns?: 1 | 2 | 3
  children: React.ReactNode
  className?: string
}

/** Lays out a set of form fields in a responsive grid — used across every module's create/edit form. */
export const FormRow: React.FC<FormRowProps> = ({ columns = 2, children, className }) => {
  const gridCols = columns === 1 ? 'grid-cols-1' : columns === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'
  return <div className={cn('grid gap-4', gridCols, className)}>{children}</div>
}
