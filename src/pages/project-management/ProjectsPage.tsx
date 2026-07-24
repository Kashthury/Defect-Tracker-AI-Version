import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CalendarDays, Edit, Eye, FolderKanban, Plus, Search as SearchIcon, Trash2, Users, X } from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Dropdown } from '@/components/common/Dropdown'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { Filter } from '@/components/common/Filter'
import { Input } from '@/components/common/Input'
import { Loader } from '@/components/common/Loader'
import { Modal } from '@/components/common/Modal'
import { Pagination } from '@/components/common/Pagination'
import { PageHeader } from '@/components/layout/PageHeader'
import { PRIV } from '@/constants/privileges'
import { ROUTES } from '@/constants/routes'
import { useConfirm } from '@/context/ConfirmContext'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/hooks/useAuth'
import { usePagination } from '@/hooks/usePagination'
import { useProject } from '@/hooks/useProject'
import { projectService } from '@/services/projectService'
import { Project, ProjectCompletionCheck, ProjectStatus } from '@/types/project'
import { formatDate } from '@/utils/format'
import { cn } from '@/utils/cn'

const STATUS_OPTIONS = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'On Hold', value: 'ON_HOLD' },
  { label: 'Completed', value: 'COMPLETED' },
]

const statusLabel = (status: ProjectStatus) => STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status
const statusTone = (status: ProjectStatus) => status === 'ACTIVE' ? 'success' : status === 'ON_HOLD' ? 'medium' : 'neutral'
const nextCalendarDate = (date: string) => {
  const value = new Date(`${date}T00:00:00`)
  value.setDate(value.getDate() + 1)
  return value.toISOString().slice(0, 10)
}
const projectCardTheme = (status: ProjectStatus) => status === 'ACTIVE'
  ? { accent: 'bg-emerald-500', header: 'from-emerald-50 via-white to-white', icon: 'bg-emerald-100 text-emerald-700', border: 'hover:border-emerald-300' }
  : status === 'ON_HOLD'
    ? { accent: 'bg-amber-400', header: 'from-amber-50 via-white to-white', icon: 'bg-amber-100 text-amber-700', border: 'hover:border-amber-300' }
    : { accent: 'bg-slate-400', header: 'from-slate-100 via-white to-white', icon: 'bg-slate-200 text-slate-600', border: 'hover:border-slate-400' }

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate()
  const { hasPrivilege } = useAuth()
  const { selectedProject, setSelectedProject, clearSelectedProject, refreshProjects } = useProject()
  const toast = useToast()
  const confirm = useConfirm()
  const [searchText, setSearchText] = useState('')
  const [status, setStatus] = useState('All')
  const [managerId, setManagerId] = useState('All')
  const [startDateFrom, setStartDateFrom] = useState('')
  const [endDateTo, setEndDateTo] = useState('')
  const [managerOptions, setManagerOptions] = useState<{ label: string; value: string }[]>([])
  const [completionTarget, setCompletionTarget] = useState<Project | null>(null)
  const [completionCheck, setCompletionCheck] = useState<ProjectCompletionCheck | null>(null)
  const [completionError, setCompletionError] = useState<string | undefined>()
  const [isCompleting, setIsCompleting] = useState(false)
  const [extensionTarget, setExtensionTarget] = useState<Project | null>(null)
  const [extensionEndDate, setExtensionEndDate] = useState('')
  const [extensionError, setExtensionError] = useState<string | undefined>()
  const [isExtending, setIsExtending] = useState(false)
  const [statusChangingId, setStatusChangingId] = useState<string | null>(null)

  useEffect(() => {
    projectService.getProjectManagerOptions().then((result) => {
      if (result.success) {
        setManagerOptions(result.data.map((manager) => ({ label: manager.name, value: manager.id })))
      }
    })
  }, [])

  const fetcher = useCallback(
    (request: Parameters<typeof projectService.getProjects>[0]) => projectService.getProjects(request),
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
  } = usePagination<Project>({
    fetcher,
    initialPageSize: 10,
    initialSortBy: 'name',
    filters: { status, managerId, startDateFrom, endDateTo },
  })

  const openProject = (project: Project) => {
    setSelectedProject({ projectId: project.id, projectName: project.name, status: project.status })
    navigate(ROUTES.PROJECT_MANAGEMENT_HUB.replace(':projectId', project.id))
  }

  const refreshAfterStatusChange = async (projectId: string) => {
    const [details] = await Promise.all([projectService.getProjectById(projectId), refreshProjects()])
    if (details.success && selectedProject?.projectId === projectId && details.data.status === 'ACTIVE') {
      setSelectedProject({ projectId: details.data.id, projectName: details.data.name, status: details.data.status })
    }
    window.dispatchEvent(new CustomEvent('project:data-changed', { detail: { projectId } }))
    reload()
  }

  const runStatusChange = async (project: Project, nextStatus: ProjectStatus, retryAfterExtension = false) => {
    setStatusChangingId(project.id)
    const result = await projectService.updateProjectStatus(project.id, nextStatus)
    setStatusChangingId(null)
    if (result.success) {
      toast.success(result.message)
      setExtensionTarget(null)
      await refreshAfterStatusChange(project.id)
      return true
    }
    const endDatePassed = nextStatus === 'ACTIVE'
      && /end date|ended|expired|past/i.test(result.message)
    if (endDatePassed && !retryAfterExtension) {
      setExtensionTarget(project)
      setExtensionEndDate('')
      setExtensionError(result.message)
      return false
    }
    toast.error(result.message)
    return false
  }

  const handleStatusChange = async (project: Project, nextStatus: ProjectStatus) => {
    if (nextStatus === project.status) return
    if (project.status === 'COMPLETED') return
    if (nextStatus === 'COMPLETED') {
      setStatusChangingId(project.id)
      const result = await projectService.checkProjectCompletion(project.id)
      setStatusChangingId(null)
      if (!result.success) {
        toast.error(result.message)
        return
      }
      setCompletionTarget(project)
      setCompletionCheck(result.data)
      setCompletionError(undefined)
      return
    }
    const confirmed = await confirm({
      title: 'Change Project Status',
      message: nextStatus === 'ON_HOLD'
        ? `Place ${project.name} on hold? Existing employee capacity will remain reserved while the Project is on hold.`
        : `Change ${project.name} from ${statusLabel(project.status)} to ${statusLabel(nextStatus)}?`,
      confirmText: `Set ${statusLabel(nextStatus)}`,
      variant: 'primary',
    })
    if (!confirmed) return
    await runStatusChange(project, nextStatus)
  }

  const completeProject = async () => {
    if (!completionTarget || !completionCheck?.canComplete || isCompleting) return
    setIsCompleting(true)
    const result = await projectService.updateProjectStatus(completionTarget.id, 'COMPLETED')
    setIsCompleting(false)
    if (!result.success) {
      setCompletionError(result.message)
      return
    }
    toast.success(result.message)
    setCompletionTarget(null)
    setCompletionCheck(null)
    if (selectedProject?.projectId === completionTarget.id) clearSelectedProject()
    await refreshAfterStatusChange(completionTarget.id)
  }

  const extendProjectEndDate = async () => {
    if (!extensionTarget || isExtending) return
    if (!extensionEndDate) {
      setExtensionError('New End Date is required.')
      return
    }
    if (extensionEndDate <= extensionTarget.endDate) {
      setExtensionError('New End Date must be later than the current Project End Date.')
      return
    }
    setIsExtending(true)
    const result = await projectService.extendProjectEndDate(extensionTarget.id, extensionEndDate)
    setIsExtending(false)
    if (!result.success) {
      setExtensionError(result.message)
      return
    }
    toast.success(result.message)
    const updatedProject = { ...extensionTarget, endDate: extensionEndDate }
    await refreshAfterStatusChange(extensionTarget.id)
    setExtensionError(undefined)
    await runStatusChange(updatedProject, 'ACTIVE', true)
  }

  const handleDelete = async (project: Project) => {
    const confirmed = await confirm({
      title: 'Delete Project',
      message: `Are you sure you want to delete ${project.name}? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'danger',
    })
    if (!confirmed) return
    const result = await projectService.deleteProject(project.id)
    if (result.success) {
      toast.success(result.message)
      if (selectedProject?.projectId === project.id) clearSelectedProject()
      await refreshProjects()
      reload()
    } else toast.error(result.message)
  }

  const clearFilters = () => {
    setSearchText('')
    setSearch('')
    setStatus('All')
    setManagerId('All')
    setStartDateFrom('')
    setEndDateTo('')
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Projects"
        description="Manage projects, clients, managers, allocations, and project workspaces."
        actions={
          hasPrivilege(PRIV.PROJECT_CREATE) ? (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate(ROUTES.PROJECT_CREATE)}>
              Create Project
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-3 rounded-lg border border-ink-200 bg-white p-4 shadow-panel">
        <div className="grid gap-3 lg:grid-cols-[minmax(240px,1.4fr)_minmax(150px,0.7fr)_minmax(180px,0.9fr)_160px_160px]">
          <Input
            label="Search"
            value={searchText}
            placeholder="Project, client, or manager..."
            leftIcon={<SearchIcon className="h-4 w-4" />}
            onChange={(event) => setSearchText(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && setSearch(searchText)}
          />
          <div className="pt-[26px]"><Filter label="Status" value={status} options={STATUS_OPTIONS} onChange={setStatus} /></div>
          <div className="pt-[26px]"><Filter label="Project Manager" value={managerId} options={managerOptions} onChange={setManagerId} /></div>
          <Input label="Project From" type="date" value={startDateFrom} onChange={(event) => setStartDateFrom(event.target.value)} />
          <Input label="Project To" type="date" value={endDateTo} onChange={(event) => setEndDateTo(event.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" leftIcon={<SearchIcon className="h-4 w-4" />} onClick={() => setSearch(searchText)}>Search</Button>
          <Button variant="filterClear" size="sm" leftIcon={<X className="h-4 w-4" />} onClick={clearFilters} disabled={!searchText && !search && status === 'All' && managerId === 'All' && !startDateFrom && !endDateTo}>Clear Filters</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center"><Loader label="Loading projects..." /></div>
      ) : error ? (
        <div className="py-10"><ErrorMessage message={error} onRetry={reload} /></div>
      ) : !page || page.content.length === 0 ? (
        <div className="rounded-lg border border-ink-200 bg-white py-12 shadow-panel"><EmptyState title="No projects found" description="Try adjusting your search or filters." /></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {page.content.map((project) => {
            const theme = projectCardTheme(project.status)
            return (
            <article
              key={project.id}
              onClick={() => openProject(project)}
              className={cn('group cursor-pointer overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-panel transition-all duration-200 hover:-translate-y-0.5 hover:shadow-floating/50', theme.border)}
            >
              <div className={cn('h-1.5', theme.accent)} />
              <div className={cn('flex items-start justify-between gap-3 border-b border-ink-100 bg-gradient-to-r px-4 py-4', theme.header)}>
                <div className="flex min-w-0 gap-3">
                  <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', theme.icon)}><FolderKanban className="h-5 w-5" /></div>
                  <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge tone={statusTone(project.status)}>{statusLabel(project.status)}</Badge>
                  </div>
                  <h3 className="mt-2 truncate text-base font-semibold text-ink-900" title={project.name}>{project.name}</h3>
                  <p className="mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-ink-500">{project.description || 'No description provided.'}</p>
                  </div>
                </div>
                <div onClick={(event) => event.stopPropagation()}>
                  {hasPrivilege(PRIV.PROJECT_STATUS_CHANGE) && <Dropdown aria-label={`Change ${project.name} status`} disabled={project.status === 'COMPLETED' || statusChangingId === project.id} value={project.status} options={project.status === 'COMPLETED' ? STATUS_OPTIONS.filter((option) => option.value === 'COMPLETED') : STATUS_OPTIONS} onChange={(event) => void handleStatusChange(project, event.target.value as ProjectStatus)} className="min-w-[132px] border-brand-200 bg-brand-50 font-semibold text-brand-700" />}
                </div>
              </div>

              <div className="grid gap-3 bg-gradient-to-b from-white to-ink-50/40 px-4 py-4 text-xs sm:grid-cols-2">
                <div><p className="text-ink-400">Client</p><p className="mt-1 truncate font-medium text-ink-700" title={project.clientName}>{project.clientName}</p></div>
                <div><p className="text-ink-400">Project Manager</p><p className="mt-1 truncate font-medium text-ink-700" title={project.managerName}>{project.managerName}</p></div>
                <div><p className="text-ink-400">Start Date</p><p className="mt-1 flex items-center gap-1.5 text-ink-700"><CalendarDays className="h-3.5 w-3.5 text-ink-400" />{formatDate(project.startDate)}</p></div>
                <div><p className="text-ink-400">End Date</p><p className="mt-1 flex items-center gap-1.5 text-ink-700"><CalendarDays className="h-3.5 w-3.5 text-ink-400" />{formatDate(project.endDate)}</p></div>
                <div><p className="text-ink-400">Team Count</p><p className="mt-1 flex items-center gap-1.5 font-medium text-ink-700"><Users className="h-3.5 w-3.5 text-ink-400" />{project.teamCount}</p></div>
                <div><p className="text-ink-400">Current Release</p><p className="mt-1 truncate font-medium text-ink-700">{project.currentRelease || 'Not scheduled'}</p></div>
              </div>

              <div className="flex items-center justify-end gap-1 border-t border-ink-100 bg-white px-3 py-2" onClick={(event) => event.stopPropagation()}>
                <button type="button" onClick={() => openProject(project)} className="rounded p-1.5 text-ink-400 hover:bg-ink-100 hover:text-brand-600" title="View project"><Eye className="h-4 w-4" /></button>
                {hasPrivilege(PRIV.PROJECT_UPDATE) && project.status !== 'COMPLETED' && <button type="button" onClick={() => navigate(ROUTES.PROJECT_EDIT.replace(':projectId', project.id))} className="rounded p-1.5 text-ink-400 hover:bg-ink-100 hover:text-brand-600" title="Edit project"><Edit className="h-4 w-4" /></button>}
                {hasPrivilege(PRIV.PROJECT_DELETE) && project.status !== 'COMPLETED' && <button type="button" onClick={() => handleDelete(project)} className="rounded p-1.5 text-ink-400 hover:bg-red-50 hover:text-signal-critical" title="Delete project"><Trash2 className="h-4 w-4" /></button>}
              </div>
            </article>
          )})}
        </div>
      )}

      <Pagination page={page} onPageChange={setPageNumber} onPageSizeChange={setPageSize} />

      <Modal
        isOpen={Boolean(completionTarget)}
        onClose={() => { if (!isCompleting) { setCompletionTarget(null); setCompletionCheck(null) } }}
        title={completionCheck?.canComplete ? 'Confirm Project Completion' : 'Project Cannot Be Completed'}
        description={completionTarget ? completionTarget.name : undefined}
        size="md"
        footer={completionCheck?.canComplete
          ? <><Button variant="ghost" onClick={() => setCompletionTarget(null)} disabled={isCompleting}>Cancel</Button><Button variant="danger" onClick={completeProject} isLoading={isCompleting}>Complete Project</Button></>
          : <Button variant="secondary" onClick={() => { setCompletionTarget(null); setCompletionCheck(null) }}>Close</Button>}
      >
        <div className="space-y-4">
          {completionCheck?.canComplete ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" /><div><p className="font-semibold text-red-900">This action is normally irreversible.</p><p className="mt-1 text-sm text-red-800">Completing this Project will release employee allocation capacity. Confirm only when all Project work is finished.</p></div></div>
            </div>
          ) : completionCheck && (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3"><p className="text-2xl font-bold text-amber-900">{completionCheck.incompleteReleaseCount}</p><p className="text-xs text-amber-800">Incomplete releases</p></div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3"><p className="text-2xl font-bold text-amber-900">{completionCheck.pendingTestCaseCount}</p><p className="text-xs text-amber-800">Pending test cases</p></div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3"><p className="text-2xl font-bold text-amber-900">{completionCheck.unresolvedDefectCount}</p><p className="text-xs text-amber-800">Unresolved defects</p></div>
              </div>
              {completionCheck.blockers.length > 0 && <ul className="list-disc space-y-1 pl-5 text-sm text-ink-700">{completionCheck.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}</ul>}
            </>
          )}
          {completionError && <ErrorMessage message={completionError} />}
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(extensionTarget)}
        onClose={() => !isExtending && setExtensionTarget(null)}
        title="Extend Project End Date"
        description={extensionTarget ? `${extensionTarget.name} must be extended before it can be activated.` : undefined}
        size="sm"
        footer={<><Button variant="ghost" onClick={() => setExtensionTarget(null)} disabled={isExtending}>Cancel</Button><Button onClick={extendProjectEndDate} isLoading={isExtending}>Extend and Activate</Button></>}
      >
        <div className="space-y-4">
          <Input label="New End Date" type="date" required min={extensionTarget ? nextCalendarDate(extensionTarget.endDate) : undefined} value={extensionEndDate} error={extensionError} onChange={(event) => { setExtensionEndDate(event.target.value); setExtensionError(undefined) }} />
          <p className="text-sm text-ink-600">Current end date: {extensionTarget ? formatDate(extensionTarget.endDate) : '—'}. The Project will be activated only after the extension succeeds.</p>
        </div>
      </Modal>
    </div>
  )
}
