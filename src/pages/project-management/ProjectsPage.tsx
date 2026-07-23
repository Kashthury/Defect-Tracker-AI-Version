import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Edit, Eye, Plus, Search as SearchIcon, Trash2, Users, X } from 'lucide-react'
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
import { Project, ProjectStatus } from '@/types/project'
import { formatDate } from '@/utils/format'

const STATUS_OPTIONS = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'On Hold', value: 'ON_HOLD' },
  { label: 'Completed', value: 'COMPLETED' },
]

const statusLabel = (status: ProjectStatus) => STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status
const statusTone = (status: ProjectStatus) => status === 'ACTIVE' ? 'success' : status === 'ON_HOLD' ? 'medium' : 'neutral'

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
  const [completionDate, setCompletionDate] = useState('')
  const [completionError, setCompletionError] = useState<string | undefined>()
  const [isCompleting, setIsCompleting] = useState(false)

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

  const handleStatusChange = async (project: Project, nextStatus: ProjectStatus) => {
    if (nextStatus === project.status) return
    if (nextStatus === 'COMPLETED') {
      setCompletionTarget(project)
      setCompletionDate(project.endDate)
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
    const result = await projectService.updateProjectStatus(project.id, nextStatus)
    if (result.success) {
      toast.success(result.message)
      await refreshProjects()
      if (selectedProject?.projectId === project.id) {
        setSelectedProject({ projectId: project.id, projectName: project.name, status: nextStatus })
      }
      reload()
    } else toast.error(result.message)
  }

  const completeProject = async () => {
    if (!completionTarget || !completionDate) {
      setCompletionError('Effective Completion Date is required.')
      return
    }
    if (completionDate < completionTarget.startDate) {
      setCompletionError('Effective Completion Date cannot be before Project Start Date.')
      return
    }
    setIsCompleting(true)
    const result = await projectService.updateProjectStatus(completionTarget.id, 'COMPLETED', completionDate)
    setIsCompleting(false)
    if (!result.success) {
      setCompletionError(result.message)
      return
    }
    toast.success(result.message)
    setCompletionTarget(null)
    await refreshProjects()
    if (selectedProject?.projectId === result.data.id) clearSelectedProject()
    reload()
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
          {page.content.map((project) => (
            <article
              key={project.id}
              onClick={() => openProject(project)}
              className="cursor-pointer rounded-xl border border-ink-300 bg-white shadow-panel transition-all hover:border-brand-400 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3 border-b border-ink-100 px-4 py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge tone={statusTone(project.status)}>{statusLabel(project.status)}</Badge>
                  </div>
                  <h3 className="mt-2 truncate text-sm font-semibold text-ink-900" title={project.name}>{project.name}</h3>
                  <p className="mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-ink-500">{project.description || 'No description provided.'}</p>
                </div>
                <div onClick={(event) => event.stopPropagation()}>
                  {hasPrivilege(PRIV.PROJECT_STATUS_CHANGE) && <Dropdown aria-label={`Change ${project.name} status`} value={project.status} options={STATUS_OPTIONS} onChange={(event) => void handleStatusChange(project, event.target.value as ProjectStatus)} className="min-w-[132px] border-brand-200 bg-brand-50 font-semibold text-brand-700" />}
                </div>
              </div>

              <div className="grid gap-x-4 gap-y-3 px-4 py-4 text-xs sm:grid-cols-2">
                <div><p className="text-ink-400">Client</p><p className="mt-1 truncate font-medium text-ink-700" title={project.clientName}>{project.clientName}</p></div>
                <div><p className="text-ink-400">Project Manager</p><p className="mt-1 truncate font-medium text-ink-700" title={project.managerName}>{project.managerName}</p></div>
                <div><p className="text-ink-400">Start Date</p><p className="mt-1 flex items-center gap-1.5 text-ink-700"><CalendarDays className="h-3.5 w-3.5 text-ink-400" />{formatDate(project.startDate)}</p></div>
                <div><p className="text-ink-400">End Date</p><p className="mt-1 flex items-center gap-1.5 text-ink-700"><CalendarDays className="h-3.5 w-3.5 text-ink-400" />{formatDate(project.endDate)}</p></div>
                <div><p className="text-ink-400">Team Count</p><p className="mt-1 flex items-center gap-1.5 font-medium text-ink-700"><Users className="h-3.5 w-3.5 text-ink-400" />{project.teamCount}</p></div>
                <div><p className="text-ink-400">Current Release</p><p className="mt-1 truncate font-medium text-ink-700">{project.currentRelease || 'Not scheduled'}</p></div>
              </div>

              <div className="flex items-center justify-end gap-1 border-t border-ink-100 px-3 py-2" onClick={(event) => event.stopPropagation()}>
                <button type="button" onClick={() => openProject(project)} className="rounded p-1.5 text-ink-400 hover:bg-ink-100 hover:text-brand-600" title="View project"><Eye className="h-4 w-4" /></button>
                {hasPrivilege(PRIV.PROJECT_UPDATE) && <button type="button" onClick={() => navigate(ROUTES.PROJECT_EDIT.replace(':projectId', project.id))} className="rounded p-1.5 text-ink-400 hover:bg-ink-100 hover:text-brand-600" title="Edit project"><Edit className="h-4 w-4" /></button>}
                {hasPrivilege(PRIV.PROJECT_DELETE) && <button type="button" onClick={() => handleDelete(project)} className="rounded p-1.5 text-ink-400 hover:bg-red-50 hover:text-signal-critical" title="Delete project"><Trash2 className="h-4 w-4" /></button>}
              </div>
            </article>
          ))}
        </div>
      )}

      <Pagination page={page} onPageChange={setPageNumber} onPageSizeChange={setPageSize} />

      <Modal
        isOpen={Boolean(completionTarget)}
        onClose={() => !isCompleting && setCompletionTarget(null)}
        title="Complete Project"
        description={completionTarget ? `Complete ${completionTarget.name}.` : undefined}
        size="sm"
        footer={<><Button variant="ghost" onClick={() => setCompletionTarget(null)} disabled={isCompleting}>Cancel</Button><Button variant="danger" onClick={completeProject} isLoading={isCompleting}>Complete Project</Button></>}
      >
        <div className="space-y-4">
          <Input label="Effective Completion Date" type="date" required min={completionTarget?.startDate} value={completionDate} error={completionError} onChange={(event) => { setCompletionDate(event.target.value); setCompletionError(undefined) }} />
          <p className="text-sm text-ink-600">Active allocations will end on the completion date and future scheduled allocations will be cancelled.</p>
        </div>
      </Modal>
    </div>
  )
}
