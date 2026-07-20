import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Ban, Check, PlusCircle, Save, Search as SearchIcon, ShieldCheck, UserCog } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/common/Card'
import { Table, TableColumn } from '@/components/common/Table'
import { Pagination } from '@/components/common/Pagination'
import { Input } from '@/components/common/Input'
import { Button } from '@/components/common/Button'
import { Badge } from '@/components/common/Badge'
import { Loader } from '@/components/common/Loader'
import { EmptyState } from '@/components/common/EmptyState'
import { PrivilegeTree } from '@/components/permissions/PrivilegeTree'
import { usePagination } from '@/hooks/usePagination'
import { privilegeService } from '@/services/privilegeService'
import { OverrideEmployeeRow, PrivilegeDefinition, UserPermissionSummary } from '@/types/privilege'
import { initials } from '@/utils/format'
import { useToast } from '@/context/ToastContext'
import { ROUTES } from '@/constants/routes'

const Avatar: React.FC<{ name: string; color: string; size?: 'sm' | 'lg' }> = ({ name, color, size = 'sm' }) => (
  <span
    className={
      size === 'lg'
        ? 'flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold text-white'
        : 'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white'
    }
    style={{ backgroundColor: color }}
  >
    {initials(name)}
  </span>
)

/** Step 1 — pick an employee. */
const EmployeePicker: React.FC<{ onSelect: (row: OverrideEmployeeRow) => void }> = ({ onSelect }) => {
  const [searchText, setSearchText] = useState('')
  const fetcher = useCallback(
    (req: Parameters<typeof privilegeService.getOverrideEmployees>[0]) =>
      privilegeService.getOverrideEmployees(req),
    [],
  )
  const { page, isLoading, error, setPageNumber, setPageSize, setSearch, reload } =
    usePagination<OverrideEmployeeRow>({ fetcher, initialPageSize: 10 })

  const columns: TableColumn<OverrideEmployeeRow>[] = [
    {
      key: 'fullName',
      header: 'Employee',
      render: (e) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={e.fullName} color={e.avatarColor} />
          <span className="font-medium text-ink-900">{e.fullName}</span>
        </div>
      ),
    },
    { key: 'email', header: 'Email', render: (e) => <span className="text-ink-500">{e.email}</span> },
    { key: 'roleName', header: 'Role', render: (e) => <Badge tone="info">{e.roleName}</Badge> },
    {
      key: 'status',
      header: 'Status',
      render: (e) => (
        <Badge tone={e.status === 'ACTIVE' ? 'success' : 'neutral'} dot>
          {e.status === 'ACTIVE' ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ]

  return (
    <Card padded={false}>
      <div className="flex flex-col gap-2 border-b border-ink-100 px-5 py-4 sm:flex-row sm:items-center">
        <div className="w-full sm:w-80">
          <Input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setSearch(searchText)
            }}
            placeholder="Search by employee name..."
            leftIcon={<SearchIcon className="h-4 w-4" />}
          />
        </div>
        <Button variant="secondary" onClick={() => setSearch(searchText)} leftIcon={<SearchIcon className="h-4 w-4" />}>
          Search
        </Button>
      </div>
      <div className="p-0">
        <Table
          columns={columns}
          rows={page?.content ?? []}
          rowKey={(e) => e.id}
          isLoading={isLoading}
          error={error}
          onRetry={reload}
          onRowClick={onSelect}
          emptyTitle="No employees found"
          emptyDescription="Try a different search term."
        />
        <Pagination page={page} onPageChange={setPageNumber} onPageSizeChange={setPageSize} />
      </div>
    </Card>
  )
}

/** A compact list of privilege rows used in the effective-permission summary. */
const PrivilegeSummaryList: React.FC<{
  items: PrivilegeDefinition[]
  tone: 'role' | 'extra' | 'restricted' | 'final'
  emptyLabel: string
}> = ({ items, tone, emptyLabel }) => {
  if (items.length === 0) {
    return <p className="px-1 py-2 text-xs text-ink-400">{emptyLabel}</p>
  }
  const icon =
    tone === 'restricted' ? (
      <Ban className="h-3.5 w-3.5 text-signal-critical" />
    ) : (
      <Check className="h-3.5 w-3.5 text-signal-low" />
    )
  return (
    <ul className="flex flex-col gap-1">
      {items.map((p) => (
        <li key={p.code} className="flex items-center gap-2 rounded-md px-1 py-1 text-sm">
          {icon}
          <span className={tone === 'restricted' ? 'text-ink-500 line-through' : 'text-ink-800'}>{p.name}</span>
          <span className="ml-auto font-mono text-[11px] text-ink-400">{p.code}</span>
        </li>
      ))}
    </ul>
  )
}

const SummaryColumn: React.FC<{
  title: string
  count: number
  tone: 'role' | 'extra' | 'restricted' | 'final'
  children: React.ReactNode
}> = ({ title, count, tone, children }) => {
  const badgeTone = tone === 'restricted' ? 'critical' : tone === 'final' ? 'success' : tone === 'extra' ? 'info' : 'neutral'
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-ink-100 bg-ink-50/40 p-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-500">{title}</h4>
        <Badge tone={badgeTone}>{count}</Badge>
      </div>
      {children}
    </div>
  )
}

export const UserPermissionOverridePage: React.FC = () => {
  const navigate = useNavigate()
  const toast = useToast()

  const [privileges, setPrivileges] = useState<PrivilegeDefinition[]>([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)
  const [summary, setSummary] = useState<UserPermissionSummary | null>(null)
  const [isLoadingSummary, setIsLoadingSummary] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [extraCodes, setExtraCodes] = useState<string[]>([])
  const [restrictedCodes, setRestrictedCodes] = useState<string[]>([])
  const [initialExtra, setInitialExtra] = useState<string[]>([])
  const [initialRestricted, setInitialRestricted] = useState<string[]>([])
  const [extraSearch, setExtraSearch] = useState('')
  const [restrictedSearch, setRestrictedSearch] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await privilegeService.getAssignablePrivileges()
      if (!cancelled && res.success) setPrivileges(res.data)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const loadSummary = useCallback(async (employeeId: string) => {
    setIsLoadingSummary(true)
    try {
      const res = await privilegeService.getUserPermissions(employeeId)
      if (res.success) {
        setSummary(res.data)
        const extra = res.data.extraPrivileges.map((p) => p.code)
        const restricted = res.data.restrictedPrivileges.map((p) => p.code)
        setExtraCodes(extra)
        setRestrictedCodes(restricted)
        setInitialExtra(extra)
        setInitialRestricted(restricted)
      }
    } finally {
      setIsLoadingSummary(false)
    }
  }, [])

  const handleSelectEmployee = (row: OverrideEmployeeRow) => {
    setSelectedEmployeeId(row.id)
    setExtraSearch('')
    setRestrictedSearch('')
    loadSummary(row.id)
  }

  const handleBack = () => {
    setSelectedEmployeeId(null)
    setSummary(null)
  }

  const roleCodes = useMemo(() => summary?.rolePrivileges.map((p) => p.code) ?? [], [summary])
  const roleSet = useMemo(() => new Set(roleCodes), [roleCodes])
  const extraSet = useMemo(() => new Set(extraCodes), [extraCodes])
  const restrictedSet = useMemo(() => new Set(restrictedCodes), [restrictedCodes])

  // Extra candidates: active privileges the role does not already grant, and not currently restricted.
  const extraCandidates = useMemo(
    () => privileges.filter((p) => !roleSet.has(p.code) && !restrictedSet.has(p.code)),
    [privileges, roleSet, restrictedSet],
  )
  // Restricted candidates: any active privilege not currently being granted as extra.
  const restrictedCandidates = useMemo(
    () => privileges.filter((p) => !extraSet.has(p.code)),
    [privileges, extraSet],
  )

  // Live effective preview: (role + extra) - restricted, in catalogue order.
  const effectivePrivileges = useMemo(() => {
    const effective = new Set<string>([...roleCodes, ...extraCodes])
    restrictedCodes.forEach((c) => effective.delete(c))
    return privileges.filter((p) => effective.has(p.code))
  }, [privileges, roleCodes, extraCodes, restrictedCodes])

  const rolePrivileges = useMemo(
    () => privileges.filter((p) => roleSet.has(p.code)),
    [privileges, roleSet],
  )
  const extraPrivileges = useMemo(
    () => privileges.filter((p) => extraSet.has(p.code)),
    [privileges, extraSet],
  )
  const restrictedPrivileges = useMemo(
    () => privileges.filter((p) => restrictedSet.has(p.code)),
    [privileges, restrictedSet],
  )

  const isDirty = useMemo(() => {
    const sameSet = (a: string[], b: string[]) => {
      if (a.length !== b.length) return false
      const setB = new Set(b)
      return a.every((c) => setB.has(c))
    }
    return !sameSet(extraCodes, initialExtra) || !sameSet(restrictedCodes, initialRestricted)
  }, [extraCodes, restrictedCodes, initialExtra, initialRestricted])

  const handleSave = async () => {
    if (!selectedEmployeeId) return
    setIsSaving(true)
    try {
      const res = await privilegeService.updateUserPermissions({
        employeeId: selectedEmployeeId,
        extraPrivilegeCodes: extraCodes,
        restrictedPrivilegeCodes: restrictedCodes,
      })
      if (res.success) {
        setSummary(res.data)
        const extra = res.data.extraPrivileges.map((p) => p.code)
        const restricted = res.data.restrictedPrivileges.map((p) => p.code)
        setExtraCodes(extra)
        setRestrictedCodes(restricted)
        setInitialExtra(extra)
        setInitialRestricted(restricted)
        toast.success(res.message)
      } else {
        toast.error(res.message)
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <button type="button" onClick={() => navigate(ROUTES.PRIVILEGE)} className="flex w-fit items-center gap-2 text-sm font-medium text-ink-500 transition-colors hover:text-brand-600"><ArrowLeft className="h-4 w-4" /> Back to Privilege</button>
      <PageHeader
        title="User Permission Override"
        description="Grant extra privileges or restrict specific privileges for an individual employee — without creating a new role."
      />

      {!selectedEmployeeId ? (
        <EmployeePicker onSelect={handleSelectEmployee} />
      ) : isLoadingSummary || !summary ? (
        <Card padded>
          <div className="flex h-40 items-center justify-center">
            <Loader label="Loading user permissions..." />
          </div>
        </Card>
      ) : (
        <>
          <button
            onClick={handleBack}
            className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Employees
          </button>

          <Card padded>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar name={summary.employeeName} color={summary.avatarColor} size="lg" />
                <div>
                  <h3 className="text-base font-semibold text-ink-900">{summary.employeeName}</h3>
                  <p className="text-sm text-ink-500">{summary.employeeEmail}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-ink-400">Role</span>
                <Badge tone="info">{summary.roleName}</Badge>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card
              title="Current Role Privileges"
              subtitle="Inherited from the assigned role. Read-only here — manage these in Role Privilege Assignment."
              padded={false}
            >
              <div className="p-5">
                {rolePrivileges.length === 0 ? (
                  <EmptyState
                    icon={<ShieldCheck className="h-5 w-5" />}
                    title="No role privileges"
                    description="This role has no privileges assigned yet."
                  />
                ) : (
                  <PrivilegeTree
                    privileges={rolePrivileges}
                    selectedCodes={roleCodes}
                    lockedCodes={roleCodes}
                    readOnly
                    accent="brand"
                  />
                )}
              </div>
            </Card>

            <div className="flex flex-col gap-6">
              <Card
                title="Add Extra Privileges"
                subtitle="Grant privileges beyond the role for this employee only."
                padded={false}
              >
                <div className="border-b border-ink-100 px-5 py-3">
                  <Input
                    value={extraSearch}
                    onChange={(e) => setExtraSearch(e.target.value)}
                    placeholder="Search privileges..."
                    leftIcon={<SearchIcon className="h-4 w-4" />}
                  />
                </div>
                <div className="max-h-80 overflow-auto p-5">
                  {extraCandidates.length === 0 ? (
                    <EmptyState
                      icon={<PlusCircle className="h-5 w-5" />}
                      title="Nothing to add"
                      description="The role already grants every available privilege."
                    />
                  ) : (
                    <PrivilegeTree
                      privileges={extraCandidates}
                      selectedCodes={extraCodes}
                      onChange={setExtraCodes}
                      searchTerm={extraSearch}
                      accent="brand"
                    />
                  )}
                </div>
              </Card>

              <Card
                title="Add Restricted Privileges"
                subtitle="Deny specific privileges for this employee, even if the role grants them."
                padded={false}
              >
                <div className="border-b border-ink-100 px-5 py-3">
                  <Input
                    value={restrictedSearch}
                    onChange={(e) => setRestrictedSearch(e.target.value)}
                    placeholder="Search privileges..."
                    leftIcon={<SearchIcon className="h-4 w-4" />}
                  />
                </div>
                <div className="max-h-80 overflow-auto p-5">
                  <PrivilegeTree
                    privileges={restrictedCandidates}
                    selectedCodes={restrictedCodes}
                    onChange={setRestrictedCodes}
                    searchTerm={restrictedSearch}
                    accent="danger"
                  />
                </div>
              </Card>
            </div>
          </div>

          <Card
            title="Effective Permissions"
            subtitle="Final = (Role Privileges) + (Extra Privileges) - (Restricted Privileges)"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <SummaryColumn title="From Role" count={rolePrivileges.length} tone="role">
                <PrivilegeSummaryList items={rolePrivileges} tone="role" emptyLabel="No role privileges." />
              </SummaryColumn>
              <SummaryColumn title="Extra" count={extraPrivileges.length} tone="extra">
                <PrivilegeSummaryList items={extraPrivileges} tone="extra" emptyLabel="No extra privileges." />
              </SummaryColumn>
              <SummaryColumn title="Restricted" count={restrictedPrivileges.length} tone="restricted">
                <PrivilegeSummaryList
                  items={restrictedPrivileges}
                  tone="restricted"
                  emptyLabel="No restricted privileges."
                />
              </SummaryColumn>
              <SummaryColumn title="Final" count={effectivePrivileges.length} tone="final">
                <PrivilegeSummaryList items={effectivePrivileges} tone="final" emptyLabel="No effective privileges." />
              </SummaryColumn>
            </div>
          </Card>

          <div className="sticky bottom-0 z-10 flex items-center justify-between gap-3 rounded-lg border border-ink-200 bg-ink-50 p-4 shadow-sm">
            <span className="inline-flex items-center gap-1.5 text-sm text-ink-500">
              <UserCog className="h-4 w-4" />
              {isDirty ? 'You have unsaved permission changes.' : 'All permission changes saved.'}
            </span>
            <Button leftIcon={<Save className="h-4 w-4" />} isLoading={isSaving} disabled={!isDirty} onClick={handleSave}>
              Save
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
