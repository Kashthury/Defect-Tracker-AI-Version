import React, { useEffect, useRef } from 'react'
import { AlertTriangle } from 'lucide-react'

interface FormErrorAlertProps {
  message?: string | null
  title?: string
}

/**
 * Standard server-side form error summary. New errors are brought into view,
 * focused for keyboard users, and announced by assistive technology.
 */
export const FormErrorAlert: React.FC<FormErrorAlertProps> = ({
  message,
  title = 'Unable to save your changes',
}) => {
  const alertRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!message) return
    const alert = alertRef.current
    alert?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    alert?.focus({ preventScroll: true })
  }, [message])

  if (!message) return null

  return (
    <div
      ref={alertRef}
      role="alert"
      aria-live="assertive"
      tabIndex={-1}
      className="mb-6 flex scroll-mt-4 gap-3 rounded-xl border border-red-200 bg-red-50 p-4 outline-none focus:ring-2 focus:ring-signal-critical/30"
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-signal-critical" aria-hidden="true" />
      <div>
        <p className="text-sm font-semibold text-signal-critical">{title}</p>
        <p className="mt-1 text-sm leading-5 text-red-700">{message}</p>
        <p className="mt-2 text-xs text-red-600">Review the highlighted information and try again.</p>
      </div>
    </div>
  )
}
