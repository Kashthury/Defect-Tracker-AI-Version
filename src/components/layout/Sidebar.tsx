import React, { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, Bug, X } from 'lucide-react'
import { createMenuConfig, MenuItem } from '@/constants/menuConfig'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/utils/cn'
import { APP_NAME } from '@/constants/app'
import { useProject } from '@/hooks/useProject'
import { getProjectAwareMenuPath } from '@/utils/projectRouting'

/** Recursively strips menu items the current user has no privilege for, dropping empty parents. */
function filterMenu(items: MenuItem[], hasPrivilege: (code?: string) => boolean): MenuItem[] {
  return items.reduce<MenuItem[]>((acc, item) => {
    if (item.children) {
      const children = filterMenu(item.children, hasPrivilege)
      if (children.length > 0) acc.push({ ...item, children })
      return acc
    }
    if (hasPrivilege(item.privilege)) acc.push(item)
    return acc
  }, [])
}

function containsPath(item: MenuItem, pathname: string, projectId?: string): boolean {
  const itemPath = item.path ? getProjectAwareMenuPath(item.path, projectId) : undefined
  if (itemPath && pathname.startsWith(itemPath)) return true
  return item.children?.some((child) => containsPath(child, pathname, projectId)) ?? false
}

interface MenuGroupProps {
  item: MenuItem
  depth: number
  projectId?: string
  onNavigate?: () => void
  openGroup: string | null
  onToggleGroup: (label: string) => void
}

const MenuGroup: React.FC<MenuGroupProps> = ({ item, depth, projectId, onNavigate, openGroup, onToggleGroup }) => {
  const open = openGroup === item.label
  const Icon = item.icon
  const itemPath = item.path ? getProjectAwareMenuPath(item.path, projectId) : undefined

  if (item.children) {
    return (
      <div>
        <div
          className={cn(
            'flex w-full items-center rounded-xl text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-all',
            depth > 0 && 'text-xs',
          )}
          style={{ paddingLeft: 12 + depth * 12 }}
        >
          {itemPath ? (
            <NavLink to={itemPath} onClick={onNavigate} className="flex min-w-0 flex-1 items-center gap-2.5 py-2 pr-2">
              {Icon && <Icon className="h-4 w-4 shrink-0" />}
              <span className="truncate" title={item.label}>{item.label}</span>
            </NavLink>
          ) : (
            <button type="button" onClick={() => onToggleGroup(item.label)} className="flex min-w-0 flex-1 items-center gap-2.5 py-2 pr-2 text-left">
              {Icon && <Icon className="h-4 w-4 shrink-0" />}
              <span className="truncate" title={item.label}>{item.label}</span>
            </button>
          )}
          <button type="button" onClick={() => onToggleGroup(item.label)} className="shrink-0 px-3 py-2" aria-label={`${open ? 'Collapse' : 'Expand'} ${item.label}`}>
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
          </button>
        </div>
        {open && (
          <div className="mt-0.5 flex flex-col gap-0.5">
            {item.children.map((child) => (
              <MenuGroup key={child.label} item={child} depth={depth + 1} projectId={projectId} onNavigate={onNavigate} openGroup={openGroup} onToggleGroup={onToggleGroup} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <NavLink
      to={itemPath!}
      end
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 rounded-xl py-2.5 pr-3 text-sm font-medium transition-all',
          depth > 0 && 'text-[13px]',
          isActive ? 'bg-white text-brand-700 shadow-lg shadow-black/10' : 'text-slate-300 hover:bg-white/10 hover:text-white',
        )
      }
      style={{ paddingLeft: 12 + depth * 12 }}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" />}
      <span className="truncate" title={item.label}>{item.label}</span>
    </NavLink>
  )
}

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { hasPrivilege } = useAuth()
  const { selectedProject } = useProject()
  const location = useLocation()
  const menu = useMemo(
    () => filterMenu(createMenuConfig(selectedProject), hasPrivilege),
    [hasPrivilege, selectedProject],
  )
  const [openGroup, setOpenGroup] = useState<string | null>(null)

  useEffect(() => {
    const activeGroup = menu.find((item) => item.children && containsPath(item, location.pathname, selectedProject?.projectId))
    if (activeGroup) setOpenGroup(activeGroup.label)
  }, [location.pathname, menu, selectedProject?.projectId])

  const toggleGroup = (label: string) => setOpenGroup((current) => current === label ? null : label)

  return (
    <aside className={cn(
      'fixed inset-y-0 left-0 z-50 flex h-full w-72 shrink-0 flex-col overflow-hidden overscroll-none bg-gradient-to-b from-[#123a5a] via-[#102f4a] to-[#0b2236] text-white shadow-2xl transition-transform md:static md:z-auto md:w-64 md:translate-x-0',
      isOpen ? 'translate-x-0' : '-translate-x-full',
    )}>
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-cyan-200 ring-1 ring-white/20">
          <Bug className="h-4.5 w-4.5" />
        </div>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold tracking-wide text-white">{APP_NAME}</span>
        <button type="button" onClick={onClose} className="rounded-md p-1.5 text-ink-400 hover:bg-white/10 hover:text-white md:hidden" aria-label="Close navigation">
          <X className="h-4 w-4" />
        </button>
      </div>
      <nav className="min-h-0 flex-1 space-y-1.5 overflow-y-auto overscroll-contain px-3 py-5">
        {menu.map((item) => (
          <MenuGroup key={item.label} item={item} depth={0} projectId={selectedProject?.projectId} onNavigate={onClose} openGroup={openGroup} onToggleGroup={toggleGroup} />
        ))}
      </nav>
      <div className="border-t border-white/10 px-4 py-3 text-[11px] text-ink-500">
        v1.0.0 &middot; Frontend scaffold
      </div>
    </aside>
  )
}
