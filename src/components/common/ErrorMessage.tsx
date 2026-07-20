import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from './Button'

interface ErrorMessageProps {
  message: string
  onRetry?: () => void
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-signal-critical">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-ink-700">Something went wrong</h4>
        <p className="mt-1 max-w-sm text-xs text-ink-500">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}
