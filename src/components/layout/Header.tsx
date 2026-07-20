import React from 'react'
import { Bell, Bug, Menu, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { UserProfile } from './UserProfile'
import { Button } from '@/components/common/Button'
import { ROUTES } from '@/constants/routes'
import { PRIV } from '@/constants/privileges'
import { useAuth } from '@/hooks/useAuth'
import { useProjectScope } from '@/hooks/useProjectScope'

interface HeaderProps {
  onMenuClick?: () => void
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const navigate = useNavigate()
  const { projectId } = useProjectScope()
  const { hasPrivilege } = useAuth()

  const openCreate = (kind: 'testcase' | 'defect') => {
    if (!projectId) return
    const route = kind === 'testcase' ? ROUTES.PROJECT_TEST_CASES : ROUTES.PROJECT_DEFECTS
    navigate(`${route.replace(':projectId', projectId)}?create=${kind}`)
  }

  return (
    <header className="relative z-40 flex h-14 shrink-0 items-center justify-between overflow-visible border-b border-ink-100 bg-white/90 px-6 shadow-sm backdrop-blur-sm">
      <div className="flex flex-1 items-center">
        <button type="button" onClick={onMenuClick} className="rounded-xl p-2 text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-800 md:hidden" aria-label="Open navigation">
          <Menu className="h-5 w-5" />
        </button>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        {projectId && hasPrivilege(PRIV.TESTCASE_CREATE) && <Button size="sm" variant="outline" className="!border-emerald-300 !bg-emerald-50 !text-emerald-700 hover:!border-emerald-400 hover:!bg-emerald-100 hover:!text-emerald-800 focus-visible:!ring-emerald-400/30" leftIcon={<Plus className="h-4 w-4" />} onClick={() => openCreate('testcase')}><span className="hidden sm:inline">Add Test Case</span><span className="sm:hidden">Test Case</span></Button>}
        {projectId && hasPrivilege(PRIV.DEFECT_CREATE) && <Button size="sm" className="!bg-gradient-to-r !from-rose-600 !to-red-600 !text-white hover:!from-rose-700 hover:!to-red-700 focus-visible:!ring-rose-400/30" leftIcon={<Bug className="h-4 w-4" />} onClick={() => openCreate('defect')}><span className="hidden sm:inline">Add Defect</span><span className="sm:hidden">Defect</span></Button>}
        <button className="relative rounded-xl p-2 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700" aria-label="Notifications">
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-signal-critical shadow-[0_0_0_2px_white]" />
        </button>
        <div className="h-6 w-px bg-ink-100" />
        <UserProfile />
      </div>
    </header>
  )
}
