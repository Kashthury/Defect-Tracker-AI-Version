import React, { useCallback, useEffect, useState } from 'react'
import { CalendarDays, Edit, ExternalLink, Eye, Plus, Trash2, X } from 'lucide-react'
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
  const { selectedRelease, setSelectedRelease, clearSelectedRelease } = useRelease()
  const [status, setStatus] = useState('All')
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

  const editRelease = (release: ReleaseRecord) => {
    setSelectedRelease(toSelectedRelease(release))
    navigate(releasePath(ROUTES.PROJECT_RELEASE_EDIT, release.id))
  }

  const openTestCaseExecution = (release: ReleaseRecord) => {
    if (release.status !== 'ACTIVE') return
    setSelectedRelease(toSelectedRelease(release))
    navigate(releasePath(ROUTES.PROJECT_TEST_CASE_EXECUTION))
  }

  const handleStatusChange = async (release: ReleaseRecord, nextStatus: ReleaseStatus) => {
    if (!projectId || nextStatus === release.status) return
    const confirmed = await confirm({
      title: 'Change Release Status',
      message: `Change ${release.name} from ${releaseStatusLabel(release.status)} to ${releaseStatusLabel(nextStatus)}?`,
      confirmText: 'Change Status',
    })
    if (!confirmed) return
    const result = await releaseService.updateReleaseStatus(projectId, release.id, nextStatus)
    if (result.success) {
      toast.success(result.message)
      if (selectedRelease?.releaseId === release.id) setSelectedRelease(toSelectedRelease(result.data))
      reload()
    } else toast.error(result.message)
  }

  const handleDelete = async (release: ReleaseRecord) => {
    if (!projectId) return
    const confirmed = await confirm({
      title: 'Delete Release',
      message: `Delete ${release.name}? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'danger',
    })
    if (!confirmed) return
    const result = await releaseService.deleteRelease(projectId, release.id)
    if (result.success) {
      if (selectedRelease?.releaseId === release.id) clearSelectedRelease()
      toast.success(result.message)
      reload()
    } else toast.error(result.message)
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
                  'cursor-pointer overflow-hidden rounded-lg border bg-white shadow-panel transition-colors',
                  isActive
                    ? 'border-brand-400 ring-1 ring-brand-400/30 hover:border-brand-500'
                    : 'border-ink-200 hover:border-brand-300',
                )}
              >
                <div className={cn('border-b px-4 py-4', isActive ? 'border-brand-200 bg-brand-500/5' : 'border-ink-100')}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-semibold text-ink-900" title={release.name}>{release.name}</h3>
                        <Badge tone={releaseStatusTone(release.status)} dot>{releaseStatusLabel(release.status)}</Badge>
                      </div>
                      <p className="mt-1 font-mono text-xs text-ink-500">Version {release.version}</p>
                    </div>
                    <Badge tone="neutral">{release.releaseTypeName}</Badge>
                  </div>
                  <p className="mt-3 line-clamp-2 min-h-10 text-xs leading-5 text-ink-500">{release.description || 'No description provided.'}</p>
                </div>

                <div className="px-4 py-4 text-xs">
                  <div><p className="text-ink-400">Release Date</p><p className="mt-1 flex items-center gap-1.5 font-medium text-ink-700"><CalendarDays className="h-3.5 w-3.5 text-ink-400" />{formatDate(release.releaseDate)}</p></div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-1 border-t border-ink-100 px-3 py-2" onClick={(event) => event.stopPropagation()}>
                  <button type="button" title="View release" onClick={() => openRelease(release)} className="rounded p-1.5 text-ink-400 hover:bg-ink-100 hover:text-brand-600"><Eye className="h-4 w-4" /></button>
                  {isActive && <button type="button" title="Open Test Case Execution" onClick={() => openTestCaseExecution(release)} className="rounded p-1.5 text-brand-600 hover:bg-brand-500/10"><ExternalLink className="h-4 w-4" /></button>}
                  {canManageReleases && hasPrivilege(PRIV.RELEASE_UPDATE) && release.status !== 'COMPLETED' && <button type="button" title="Edit release" onClick={() => editRelease(release)} className="rounded p-1.5 text-ink-400 hover:bg-ink-100 hover:text-brand-600"><Edit className="h-4 w-4" /></button>}
                  {canManageReleases && hasPrivilege(PRIV.RELEASE_STATUS_CHANGE) && release.status !== 'COMPLETED' && (
                    <select aria-label={`Change ${release.name} status`} value={release.status} onChange={(event) => handleStatusChange(release, event.target.value as ReleaseStatus)} className="h-8 rounded border border-ink-200 bg-white px-2 text-xs text-ink-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40">
                      {RELEASE_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  )}
                  {canManageReleases && hasPrivilege(PRIV.RELEASE_DELETE) && release.status === 'ON_HOLD' && <button type="button" title="Delete release" onClick={() => handleDelete(release)} className="rounded p-1.5 text-ink-400 hover:bg-red-50 hover:text-signal-critical"><Trash2 className="h-4 w-4" /></button>}
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
