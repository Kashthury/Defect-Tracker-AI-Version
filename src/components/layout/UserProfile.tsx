import React, { useEffect, useRef, useState } from 'react'
import { ChevronDown, LogOut, ShieldCheck, User as UserIcon } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { initials } from '@/utils/format'

export const UserProfile: React.FC = () => {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  if (!user) return null

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-ink-100"
      >
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
          style={{ backgroundColor: user.avatarColor }}
        >
          {initials(user.fullName)}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-medium leading-tight text-ink-800">{user.fullName}</span>
          <span className="block text-xs leading-tight text-ink-500">{user.designation}</span>
        </span>
        <ChevronDown className="h-4 w-4 text-ink-400" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-lg border border-ink-100 bg-white shadow-floating">
          <div className="border-b border-ink-100 px-4 py-3">
            <p className="text-sm font-semibold text-ink-900">{user.fullName}</p>
            <p className="text-xs text-ink-500">{user.email}</p>
          </div>
          <div className="px-4 py-2.5">
            <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
              <ShieldCheck className="h-3 w-3" /> Roles
            </p>
            <div className="flex flex-wrap gap-1">
              {user.roles.map((r) => (
                <span key={r.id} className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-600">
                  {r.name}
                </span>
              ))}
            </div>
          </div>
          <button
            className="flex w-full items-center gap-2 border-t border-ink-100 px-4 py-2.5 text-sm text-ink-600 hover:bg-ink-50"
            onClick={() => {}}
          >
            <UserIcon className="h-4 w-4" /> View profile
          </button>
          <button
            className="flex w-full items-center gap-2 border-t border-ink-100 px-4 py-2.5 text-sm font-medium text-signal-critical hover:bg-red-50"
            onClick={() => logout()}
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  )
}
