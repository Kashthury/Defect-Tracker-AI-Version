import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { ROUTES } from '@/constants/routes'

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate()
  return (
    <div className="flex h-[80vh] flex-col items-center justify-center gap-3 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-ink-400">
        <Compass className="h-6 w-6" />
      </div>
      <h1 className="text-lg font-semibold text-ink-900">Page not found</h1>
      <p className="max-w-sm text-sm text-ink-500">The page you&apos;re looking for doesn&apos;t exist or may have moved.</p>
      <Button className="mt-2" onClick={() => navigate(ROUTES.DASHBOARD)}>
        Go to Dashboard
      </Button>
    </div>
  )
}
