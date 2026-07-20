import React, { useMemo } from 'react'
import { Check, Minus } from 'lucide-react'
import { PrivilegeDefinition } from '@/types/privilege'
import { PRIVILEGE_MODULES } from '@/mock/privilegeCatalog'
import { EmptyState } from '@/components/common/EmptyState'
import { cn } from '@/utils/cn'

type Accent = 'brand' | 'danger'

interface PrivilegeTreeProps {
  /** Full set of privileges to display (already limited to assignable/active ones). */
  privileges: PrivilegeDefinition[]
  /** Currently selected privilege codes. */
  selectedCodes: string[]
  onChange?: (codes: string[]) => void
  /** Free-text filter applied to name / code / action. */
  searchTerm?: string
  /** Render checkboxes disabled (view only). */
  readOnly?: boolean
  /**
   * Codes that are forced-checked and locked (e.g. privileges inherited from a
   * role shown in an override context). Rendered checked + disabled.
   */
  lockedCodes?: string[]
  accent?: Accent
  /** Optional class for the scroll container. */
  className?: string
}

interface Group {
  module: string
  items: PrivilegeDefinition[]
}

const ACCENT_ON: Record<Accent, string> = {
  brand: 'border-brand-600 bg-brand-600 text-white',
  danger: 'border-signal-critical bg-signal-critical text-white',
}

/** A styled checkbox mirroring the app's form controls (native input kept for a11y). */
const CheckBox: React.FC<{
  checked: boolean
  indeterminate?: boolean
  disabled?: boolean
  accent: Accent
  onChange?: () => void
  label: React.ReactNode
  hint?: React.ReactNode
}> = ({ checked, indeterminate = false, disabled = false, accent, onChange, label, hint }) => (
  <label
    className={cn(
      'flex items-start gap-2.5 rounded-md px-2 py-1.5 transition-colors',
      disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:bg-ink-50',
    )}
  >
    <span
      className={cn(
        'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
        checked || indeterminate ? ACCENT_ON[accent] : 'border-ink-300 bg-white',
      )}
    >
      {indeterminate ? (
        <Minus className="h-3 w-3" strokeWidth={3} />
      ) : checked ? (
        <Check className="h-3 w-3" strokeWidth={3} />
      ) : null}
    </span>
    <input
      type="checkbox"
      className="sr-only"
      checked={checked}
      disabled={disabled}
      onChange={() => onChange?.()}
    />
    <span className="flex flex-col">
      <span className="text-sm font-medium text-ink-800">{label}</span>
      {hint && <span className="text-xs text-ink-400">{hint}</span>}
    </span>
  </label>
)

export const PrivilegeTree: React.FC<PrivilegeTreeProps> = ({
  privileges,
  selectedCodes,
  onChange,
  searchTerm = '',
  readOnly = false,
  lockedCodes = [],
  accent = 'brand',
  className,
}) => {
  const selectedSet = useMemo(() => new Set(selectedCodes), [selectedCodes])
  const lockedSet = useMemo(() => new Set(lockedCodes), [lockedCodes])

  const groups = useMemo<Group[]>(() => {
    const term = searchTerm.trim().toLowerCase()
    const filtered = term
      ? privileges.filter(
          (p) =>
            p.name.toLowerCase().includes(term) ||
            p.code.toLowerCase().includes(term) ||
            p.action.toLowerCase().includes(term),
        )
      : privileges

    const byModule = new Map<string, PrivilegeDefinition[]>()
    for (const p of filtered) {
      const list = byModule.get(p.module) ?? []
      list.push(p)
      byModule.set(p.module, list)
    }

    // Preserve the canonical module order, then append any unknown modules.
    const ordered: string[] = [
      ...PRIVILEGE_MODULES.filter((m) => byModule.has(m)),
      ...Array.from(byModule.keys()).filter((m) => !PRIVILEGE_MODULES.includes(m as never)),
    ]
    return ordered.map((module) => ({ module, items: byModule.get(module)! }))
  }, [privileges, searchTerm])

  const emit = (codes: string[]) => {
    if (readOnly) return
    onChange?.(codes)
  }

  const toggleCode = (code: string) => {
    if (lockedSet.has(code)) return
    const next = new Set(selectedSet)
    if (next.has(code)) next.delete(code)
    else next.add(code)
    emit(Array.from(next))
  }

  const toggleModule = (items: PrivilegeDefinition[], allSelected: boolean) => {
    const next = new Set(selectedSet)
    for (const p of items) {
      if (lockedSet.has(p.code)) continue
      if (allSelected) next.delete(p.code)
      else next.add(p.code)
    }
    emit(Array.from(next))
  }

  if (groups.length === 0) {
    return (
      <EmptyState
        title="No privileges match"
        description="Try a different search term."
      />
    )
  }

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {groups.map(({ module, items }) => {
        const selectableItems = items.filter((p) => !lockedSet.has(p.code))
        const selectedCount = items.filter((p) => selectedSet.has(p.code)).length
        const allSelected = items.length > 0 && selectedCount === items.length
        const someSelected = selectedCount > 0 && !allSelected

        return (
          <div key={module} className="overflow-hidden rounded-lg border border-ink-100 bg-white">
            <div className="flex items-center justify-between border-b border-ink-100 bg-ink-50/60 px-3 py-2">
              <CheckBox
                accent={accent}
                checked={allSelected}
                indeterminate={someSelected}
                disabled={readOnly || selectableItems.length === 0}
                onChange={() => toggleModule(items, allSelected)}
                label={<span className="font-semibold text-ink-900">{module}</span>}
              />
              <span className="mr-1 text-xs font-medium text-ink-400">
                {selectedCount}/{items.length}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-0.5 p-2 sm:grid-cols-2">
              {items.map((p) => {
                const locked = lockedSet.has(p.code)
                return (
                  <CheckBox
                    key={p.code}
                    accent={accent}
                    checked={locked || selectedSet.has(p.code)}
                    disabled={readOnly || locked}
                    onChange={() => toggleCode(p.code)}
                    label={p.name}
                    hint={
                      <span className="font-mono text-[11px] text-ink-400">
                        {p.code}
                        {locked && ' · from role'}
                      </span>
                    }
                  />
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
