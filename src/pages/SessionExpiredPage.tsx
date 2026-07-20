import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { ROUTES } from '@/constants/routes'
import { APP_NAME } from '@/constants/app'

export const SessionExpiredPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-ink-950 p-6">
      <div className="w-full max-w-sm rounded-lg border border-ink-800 bg-ink-900 p-8 text-center shadow-floating">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
          <Clock className="h-6 w-6" />
        </div>
        <h1 className="text-lg font-semibold text-white">Session expired</h1>
        <p className="mt-2 text-sm text-ink-400">
          You were signed out of {APP_NAME} after 5 minutes of inactivity, to keep your account secure.
        </p>
        <Button fullWidth className="mt-6" onClick={() => navigate(ROUTES.LOGIN, { replace: true })}>
          Back to sign in
        </Button>
      </div>
    </div>
  )
}
