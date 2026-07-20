import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/utils/cn'

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastContextType {
  toast: {
    success: (message: string, duration?: number) => void
    error: (message: string, duration?: number) => void
    info: (message: string, duration?: number) => void
  }
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback((type: ToastType, message: string, duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, type, message, duration }])

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
  }, [removeToast])

  const toast = {
    success: (message: string, duration?: number) => addToast('success', message, duration),
    error: (message: string, duration?: number) => addToast('error', message, duration),
    info: (message: string, duration?: number) => addToast('info', message, duration),
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "flex items-start gap-3 rounded-md px-4 py-3 shadow-floating ring-1 ring-inset transition-all animate-in slide-in-from-right-8 fade-in",
              t.type === 'success' && "bg-green-50 text-green-800 ring-green-200",
              t.type === 'error' && "bg-red-50 text-red-800 ring-red-200",
              t.type === 'info' && "bg-blue-50 text-blue-800 ring-blue-200"
            )}
          >
            {t.type === 'success' && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />}
            {t.type === 'error' && <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />}
            {t.type === 'info' && <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />}
            
            <p className="flex-1 text-sm font-medium">{t.message}</p>
            
            <button
              onClick={() => removeToast(t.id)}
              className={cn(
                "rounded-md p-1 opacity-70 hover:opacity-100",
                t.type === 'success' && "hover:bg-green-100",
                t.type === 'error' && "hover:bg-red-100",
                t.type === 'info' && "hover:bg-blue-100"
              )}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context.toast
}
