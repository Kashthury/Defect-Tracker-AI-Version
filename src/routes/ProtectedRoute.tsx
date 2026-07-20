import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/constants/routes'
import { Loader } from '@/components/common/Loader'
import { ShieldAlert } from 'lucide-react'

interface ProtectedRouteProps {
  privilege?: string
  children: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ privilege, children }) => {
  const { isAuthenticated, isInitializing, hasPrivilege } = useAuth()
  const location = useLocation()

  if (isInitializing) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader label={'Restoring your session\u2026'} size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location.pathname }} replace />
  }

  if (!hasPrivilege(privilege)) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-signal-critical">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h2 className="text-base font-semibold text-ink-900">You don&apos;t have access to this page</h2>
        <p className="max-w-sm text-sm text-ink-500">
          Your current role doesn&apos;t include the privilege required to view this module. Contact your
          administrator if you believe this is a mistake.
        </p>
      </div>
    )
  }

  return <>{children}</>
}
