import React, { useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useAuth } from '@/hooks/useAuth'
import { useInactivityTimeout } from '@/hooks/useInactivityTimeout'
import { ROUTES } from '@/constants/routes'

export const MainLayout: React.FC = () => {
  const { isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const handleTimeout = useCallback(() => {
    logout('You were signed out after 5 minutes of inactivity.')
    navigate(ROUTES.SESSION_EXPIRED, { replace: true })
  }, [logout, navigate])

  useInactivityTimeout(isAuthenticated, handleTimeout)

  useEffect(() => {
    setIsSidebarOpen(false)
  }, [location.pathname])

  return (
    <div className="flex h-screen w-full overflow-hidden overscroll-none bg-gradient-to-br from-slate-50 via-sky-50/40 to-slate-100">
      {isSidebarOpen && <button type="button" className="fixed inset-0 z-40 bg-ink-950/50 md:hidden" onClick={() => setIsSidebarOpen(false)} aria-label="Close navigation" />}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
