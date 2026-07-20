import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_CLASSES = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, description, children, footer, size = 'md' }) => {
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-950/55 backdrop-blur-[3px]" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn('exec-modal-in relative flex max-h-[85vh] w-full flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-floating', SIZE_CLASSES[size])}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-ink-100 bg-gradient-to-r from-brand-50 to-white px-5 py-4">
          <div>
            <h2 id="modal-title" className="text-base font-bold text-ink-900">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-ink-500">{description}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-full p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-ink-100 bg-white/95 px-5 py-3 backdrop-blur-sm">{footer}</div>}
      </div>
    </div>
  )
}
