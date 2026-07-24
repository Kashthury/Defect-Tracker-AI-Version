import React, { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, CalendarDays, ExternalLink, Eye, PackageOpen, PlayCircle, Plus, X } from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { Filter } from '@/components/common/Filter'
import { Loader } from '@/components/common/Loader'
import { Pagination } from '@/components/common/Pagination'
import { Search } from '@/components/common/Search'
import { PageHeader } from '@/components/layout/PageHeader'
import { ProjectModuleGate } from '@/components/projects/ProjectSelectionGate'
import { ProjectSelector } from '@/components/projects/ProjectSelector'
import { PRIV } from '@/constants/privileges'
import { ROUTES } from '@/constants/routes'
import { useConfirm } from '@/context/ConfirmContext'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/hooks/useAuth'
import { usePagination } from '@/hooks/usePagination'
import { useProjectScope } from '@/hooks/useProjectScope'
import { useProject } from '@/hooks/useProject'
import { useRelease } from '@/hooks/useRelease'
import { releaseService } from '@/services/releaseService'
import { releaseTypeService } from '@/services/releaseTypeService'
import { ReleaseRecord, ReleaseStatus } from '@/types/release'
import { formatDate } from '@/utils/format'
import { cn } from '@/utils/cn'
import {
  RELEASE_STATUS_OPTIONS,
  releaseStatusLabel,
  releaseStatusTone,
  toSelectedRelease,
} from '@/utils/release'
import { useNavigate } from 'react-router-dom'

export const ReleasesPage: React.FC = () => {
  const navigate = useNavigate()
  const confirm = useConfirm()
  const toast = useToast()
  const { hasPrivilege } = useAuth()
  const { projectId, isProjectRoute } = useProjectScope()
  const { selectedProject } = useProject()
  const { selectedRelease, setSelectedRelease, clearSelectedRelease, refreshReleases } = useRelease()
  const [status, setStatus] = useState('All')
  const [actionError, setActionError] = useState<string | null>(null)
  const [releaseTypeId, setReleaseTypeId] = useState('All')
  const [releaseTypeOptions, setReleaseTypeOptions] = useState<{ label: string; value: string }[]>([])
  const canManageReleases = Boolean(
    selectedProject &&
      selectedProject.projectId === projectId &&
      selectedProject.status === 'ACTIVE',
  )

  useEffect(() => {
    clearSelectedRelease()
  }, [clearSelectedRelease, projectId])

  useEffect(() => {
    let active = true
    releaseTypeService.getReleaseTypes({ pageNumber: 0, pageSize: 100, sortBy: 'name' }).then((result) => {
      if (active && result.success) {
        setReleaseTypeOptions(result.data.content.map((item) => ({ label: item.name, value: item.id })))
      }
    })
    return () => {
      active = false
    }
  }, [])

  const fetcher = useCallback(
    (request: Parameters<typeof releaseService.getReleases>[0]) => releaseService.getReleases(request),
    [],
  )
  const {
    page,
    isLoading,
    error,
    search,
    setPageNumber,
    setPageSize,
    setSearch,
    reload,
  } = usePagination<ReleaseRecord>({
    fetcher,
    initialPageSize: 10,
    initialSortBy: 'releaseDate',
    initialSortDir: 'desc',
    filters: { projectId, status, releaseTypeId },
    enabled: Boolean(projectId),
  })

  const releasePath = (route: string, releaseId?: string) => {
    if (!projectId) return ROUTES.RELEASES
    return route
      .replace(':projectId', projectId)
      .replace(':releaseId', releaseId ?? '')
  }

  const openRelease = (release: ReleaseRecord) => {
    setSelectedRelease(toSelectedRelease(release))
    navigate(releasePath(ROUTES.PROJECT_RELEASE_DETAIL, release.id))
  }

  const openTestCaseExecution = (release: ReleaseRecord) => {
    if (release.status !== 'ACTIVE') return
    setSelectedRelease(toSelectedRelease(release))
    navigate(releasePath(ROUTES.PROJECT_TEST_CASE_EXECUTION))
  }

  const handleStatusChange = async (release: ReleaseRecord, nextStatus: ReleaseStatus) => {
    if (!projectId || nextStatus === release.status) return
    if (release.status === 'COMPLETED' || nextStatus === 'ACTIVE') return
    const confirmed = await confirm({
      title: 'Change Release Status',
      message: `Change ${release.name} from ${releaseStatusLabel(release.status)} to ${releaseStatusLabel(nextStatus)}?`,
      confirmText: 'Change Status',
    })
    if (!confirmed) return
    setActionError(null)
    const result = await releaseService.updateReleaseStatus(projectId, release.id, nextStatus)
    if (result.success) {
      toast.success(result.message)
      if (selectedRelease?.releaseId === release.id) setSelectedRelease(toSelectedRelease(result.data))
      refreshReleases()
      await reload()
    } else {
      setActionError(result.message)
      toast.error(result.message)
    }
  }

  const handleActivate = async (release: ReleaseRecord) => {
    if (!projectId || release.status !== 'ON_HOLD') return
    const confirmed = await confirm({
      title: 'Activate Release',
      message: `Activate ${release.name}? Only one Release can be ACTIVE for this Project.`,
      confirmText: 'Activate Release',
    })
    if (!confirmed) return
    setActionError(null)
    const result = await releaseService.updateReleaseStatus(projectId, release.id, 'ACTIVE')
    if (result.success) {
      setSelectedRelease(toSelectedRelease(result.data))
      refreshReleases()
      toast.success(result.message)
      await reload()
    } else {
      setActionError(result.message)
      toast.error(result.message)
    }
  }

  const clearFilters = () => {
    setSearch('')
    setStatus('All')
    setReleaseTypeId('All')
  }

  const listContent = (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Search value={search} onChange={setSearch} placeholder="Search by release name or version..." />
        <Filter label="Status" value={status} options={RELEASE_STATUS_OPTIONS} onChange={setStatus} />
        <Filter label="Release Type" value={releaseTypeId} options={releaseTypeOptions} onChange={setReleaseTypeId} />
        <Button variant="filterClear" size="sm" leftIcon={<X className="h-4 w-4" />} onClick={clearFilters} disabled={!search && status === 'All' && releaseTypeId === 'All'}>Clear Filters</Button>
      </div>
      {actionError && (
        <div role="alert" className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-signal-critical" aria-hidden="true" />
          <div><p className="text-sm font-semibold text-signal-critical">Release status was not changed</p><p className="mt-1 text-sm text-red-700">{actionError}</p></div>
        </div>
      )}
      {isLoading ? (
        <div className="flex h-56 items-center justify-center rounded-lg border border-ink-200 bg-white shadow-panel"><Loader label="Loading releases..." /></div>
      ) : error ? (
        <div className="rounded-lg border border-ink-200 bg-white py-10 shadow-panel"><ErrorMessage message={error} onRetry={reload} /></div>
      ) : !page || page.content.length === 0 ? (
        <div className="rounded-lg border border-ink-200 bg-white py-12 shadow-panel"><EmptyState title="No releases match your filters" description="Create a release or adjust the search and filters." /></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {page.content.map((release) => {
            const isActive = release.status === 'ACTIVE'
            return (
              <article
                key={release.id}
                role="button"
                tabIndex={0}
                onClick={() => openRelease(release)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    openRelease(release)
                  }
                }}
                className={cn(
                  'group cursor-pointer overflow-hidden rounded-2xl border bg-white shadow-panel transition-all duration-200 hover:-translate-y-0.5 hover:shadow-floating/50',
                  isActive
                    ? 'border-emerald-300 ring-1 ring-emerald-400/20 hover:border-emerald-400'
                    : release.status === 'ON_HOLD' ? 'border-amber-200 hover:border-amber-300' : 'border-slate-200 hover:border-slate-300',
                )}
              >
                <div className={cn('h-1.5', isActive ? 'bg-emerald-500' : release.status === 'ON_HOLD' ? 'bg-amber-400' : 'bg-slate-400')} />
                <div className={cn('border-b bg-gradient-to-r px-4 py-4', isActive ? 'border-emerald-100 from-emerald-50 via-white to-white' : release.status === 'ON_HOLD' ? 'border-amber-100 from-amber-50 via-white to-white' : 'border-slate-100 from-slate-100 via-white to-white')}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 gap-3">
                      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', isActive ? 'bg-emerald-100 text-emerald-700' : release.status === 'ON_HOLD' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600')}><PackageOpen className="h-5 w-5" /></div>
                      <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-base font-semibold text-ink-900" title={release.name}>{release.name}</h3>
                        <Badge tone={releaseStatusTone(release.status)} dot>{releaseStatusLabel(release.status)}</Badge>
                      </div>
                      <p className="mt-1 font-mono text-xs text-ink-500">Version {release.version}</p>
                      </div>
                    </div>
                    <Badge tone="neutral">{release.releaseTypeName}</Badge>
                  </div>
                  <p className="mt-3 line-clamp-2 min-h-10 text-xs leading-5 text-ink-500">{release.description || 'No description provided.'}</p>
                </div>

                <div className="bg-gradient-to-b from-white to-ink-50/40 px-4 py-4 text-xs">
                  <div className="rounded-xl bg-white p-3 ring-1 ring-ink-100"><p className="text-ink-400">Release Date</p><p className="mt-1 flex items-center gap-1.5 font-semibold text-ink-700"><CalendarDays className="h-3.5 w-3.5 text-brand-500" />{formatDate(release.releaseDate)}</p></div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-1 border-t border-ink-100 px-3 py-2" onClick={(event) => event.stopPropagation()}>
                  <button type="button" title="View release" onClick={() => openRelease(release)} className="rounded p-1.5 text-ink-400 hover:bg-ink-100 hover:text-brand-600"><Eye className="h-4 w-4" /></button>
                  {isActive && <button type="button" title="Open Test Case Execution" onClick={() => openTestCaseExecution(release)} className="rounded p-1.5 text-brand-600 hover:bg-brand-500/10"><ExternalLink className="h-4 w-4" /></button>}
                  {canManageReleases && hasPrivilege(PRIV.RELEASE_STATUS_CHANGE) && release.status === 'ON_HOLD' && <Button size="sm" leftIcon={<PlayCircle className="h-4 w-4" />} onClick={() => handleActivate(release)}>Activate</Button>}
                  {canManageReleases && hasPrivilege(PRIV.RELEASE_STATUS_CHANGE) && release.status !== 'COMPLETED' && (
                    <select aria-label={`Change ${release.name} status`} value={release.status} onChange={(event) => handleStatusChange(release, event.target.value as ReleaseStatus)} className="h-8 rounded border border-ink-200 bg-white px-2 text-xs text-ink-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40">
                      {RELEASE_STATUS_OPTIONS.filter((option) => release.status === 'ACTIVE' || option.value !== 'ACTIVE').map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
      <Pagination page={page} onPageChange={setPageNumber} onPageSizeChange={setPageSize} />
    </>
  )

  return (
    <div>
      <PageHeader
        title="Releases"
        description="Plan and manage releases for the selected project."
        actions={
          <>
            {!isProjectRoute && <ProjectSelector />}
            {canManageReleases && hasPrivilege(PRIV.RELEASE_CREATE) && <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate(releasePath(ROUTES.PROJECT_RELEASE_CREATE))}>Create Release</Button>}
          </>
        }
      />
      <ProjectModuleGate isProjectRoute={isProjectRoute}>{listContent}</ProjectModuleGate>
    </div>
  )
}
