import React from 'react'
import { Bell, Menu } from 'lucide-react'
import { UserProfile } from './UserProfile'

interface HeaderProps {
  onMenuClick?: () => void
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="relative z-40 flex h-14 shrink-0 items-center justify-between overflow-visible border-b border-ink-100 bg-white/90 px-6 shadow-sm backdrop-blur-sm">
      <div className="flex flex-1 items-center">
        <button type="button" onClick={onMenuClick} className="rounded-xl p-2 text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-800 md:hidden" aria-label="Open navigation">
          <Menu className="h-5 w-5" />
        </button>
      </div>
      <div className="flex items-center gap-3">
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
