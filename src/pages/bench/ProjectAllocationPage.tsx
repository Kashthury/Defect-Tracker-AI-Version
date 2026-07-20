import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarClock, CheckSquare, Percent, UserMinus, UserPlus, X } from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Dropdown } from '@/components/common/Dropdown'
import { EmptyState } from '@/components/common/EmptyState'
import { Filter } from '@/components/common/Filter'
import { Input } from '@/components/common/Input'
import { Modal } from '@/components/common/Modal'
import { Pagination } from '@/components/common/Pagination'
import { Search } from '@/components/common/Search'
import { Table, TableColumn } from '@/components/common/Table'
import { PageHeader } from '@/components/layout/PageHeader'
import { ProjectSelector } from '@/components/projects/ProjectSelector'
import { PRIV } from '@/constants/privileges'
import { useConfirm } from '@/context/ConfirmContext'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/hooks/useAuth'
import { usePagination } from '@/hooks/usePagination'
import { useProject } from '@/hooks/useProject'
import { designationService } from '@/services/designationService'
import { projectAllocationService } from '@/services/projectAllocationService'
import { projectService } from '@/services/projectService'
import { roleService } from '@/services/roleService'
import { AllocatedTeamMember, AvailableEmployee, Project } from '@/types/project'
import { formatDate } from '@/utils/format'

const AVAILABILITY_OPTIONS = [
  { label: 'Fully Available', value: 'AVAILABLE' },
  { label: 'Partially Available', value: 'PARTIAL' },
]

const ALLOCATED_AVAILABILITY_OPTIONS = [
  ...AVAILABILITY_OPTIONS,
  { label: 'Fully Allocated', value: 'FULL' },
]

interface AllocationFormState {
  roleId: string
  allocationPercentage: string
  startDate: string
  endDate: string
}

type AllocationFormErrors = Partial<Record<keyof AllocationFormState, string>>

const EMPTY_FORM: AllocationFormState = {
  roleId: '',
  allocationPercentage: '',
  startDate: '',
  endDate: '',
}

export const ProjectAllocationPage: React.FC = () => {
  const { hasPrivilege } = useAuth()
  const { selectedProject } = useProject()
  const toast = useToast()
  const confirm = useConfirm()
  const [project, setProject] = useState<Project | null>(null)
  const [designationId, setDesignationId] = useState('All')
  const [availabilityBand, setAvailabilityBand] = useState('All')
  const [allocatedRoleId, setAllocatedRoleId] = useState('All')
  const [allocatedAvailabilityBand, setAllocatedAvailabilityBand] = useState('All')
  const [designationOptions, setDesignationOptions] = useState<{ label: string; value: string }[]>([])
  const [roleOptions, setRoleOptions] = useState<{ label: string; value: string }[]>([])
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(new Set())
  const [selectedEmployees, setSelectedEmployees] = useState<Map<string, AvailableEmployee>>(new Map())
  const [isAllocationOpen, setIsAllocationOpen] = useState(false)
  const [allocationForms, setAllocationForms] = useState<Record<string, AllocationFormState>>({})
  const [allocationErrors, setAllocationErrors] = useState<Record<string, AllocationFormErrors>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [selectedAllocationIds, setSelectedAllocationIds] = useState<Set<string>>(new Set())
  const [extendTarget, setExtendTarget] = useState<AllocatedTeamMember | null>(null)
  const [extendEndDate, setExtendEndDate] = useState('')
  const [extendError, setExtendError] = useState<string | undefined>()
  const [isExtending, setIsExtending] = useState(false)
  const [percentageTarget, setPercentageTarget] = useState<AllocatedTeamMember | null>(null)
  const [percentageValue, setPercentageValue] = useState('')
  const [percentageError, setPercentageError] = useState<string | undefined>()
  const [isUpdatingPercentage, setIsUpdatingPercentage] = useState(false)

  useEffect(() => {
    designationService.getDesignations({ pageNumber: 0, pageSize: 100, sortBy: 'title' }).then((result) => {
      if (result.success) setDesignationOptions(result.data.content.map((item) => ({ label: item.title, value: item.id })))
    })
    roleService.getRoles({ pageNumber: 0, pageSize: 100, sortBy: 'name', filters: { status: 'ACTIVE' } }).then((result) => {
      if (result.success) setRoleOptions(result.data.content.map((item) => ({ label: item.name, value: item.id })))
    })
  }, [])

  useEffect(() => {
    setSelectedEmployeeIds(new Set())
    setSelectedEmployees(new Map())
    setSelectedAllocationIds(new Set())
    setDesignationId('All')
    setAvailabilityBand('All')
    setAllocatedRoleId('All')
    setAllocatedAvailabilityBand('All')
    setProject(null)
    if (!selectedProject || selectedProject.status !== 'ACTIVE') return

    projectService.getProjectById(selectedProject.projectId).then((result) => {
      if (result.success) setProject(result.data)
    })
  }, [selectedProject])

  const benchFetcher = useCallback(
    (request: Parameters<typeof projectAllocationService.getAvailableEmployees>[0]) =>
      projectAllocationService.getAvailableEmployees(
        request,
        project?.startDate,
        project?.endDate,
      ),
    [project?.endDate, project?.startDate],
  )
  const {
    page: benchPage,
    isLoading: isBenchLoading,
    error: benchError,
    search: benchSearch,
    setPageNumber: setBenchPageNumber,
    setPageSize: setBenchPageSize,
    setSearch: setBenchSearch,
    reload: reloadBench,
  } = usePagination<AvailableEmployee>({
    fetcher: benchFetcher,
    initialPageSize: 10,
    initialSortBy: 'employeeName',
    filters: { designationId, availabilityBand },
    enabled: Boolean(project),
  })

  const allocatedFetcher = useCallback(
    (request: Parameters<typeof projectAllocationService.getProjectTeamAllocations>[1]) =>
      projectAllocationService.getProjectTeamAllocations(project?.id ?? '', request),
    [project?.id],
  )
  const {
    page: allocatedPage,
    isLoading: isAllocatedLoading,
    error: allocatedError,
    search: allocatedSearch,
    setPageNumber: setAllocatedPageNumber,
    setPageSize: setAllocatedPageSize,
    setSearch: setAllocatedSearch,
    reload: reloadAllocated,
  } = usePagination<AllocatedTeamMember>({
    fetcher: allocatedFetcher,
    initialPageSize: 10,
    initialSortBy: 'employeeName',
    filters: { roleId: allocatedRoleId, availabilityBand: allocatedAvailabilityBand },
    enabled: Boolean(project),
  })

  const refreshAll = useCallback(() => {
    reloadBench()
    reloadAllocated()
  }, [reloadBench, reloadAllocated])

  const currentPageIds = useMemo(() => benchPage?.content.map((employee) => employee.employeeId) ?? [], [benchPage])
  const allCurrentPageSelected = currentPageIds.length > 0 && currentPageIds.every((id) => selectedEmployeeIds.has(id))

  const toggleEmployee = (employee: AvailableEmployee) => {
    setSelectedEmployeeIds((current) => {
      const next = new Set(current)
      if (next.has(employee.employeeId)) next.delete(employee.employeeId)
      else next.add(employee.employeeId)
      return next
    })
    setSelectedEmployees((current) => {
      const next = new Map(current)
      if (next.has(employee.employeeId)) next.delete(employee.employeeId)
      else next.set(employee.employeeId, employee)
      return next
    })
  }

  const selectCurrentPage = () => {
    setSelectedEmployeeIds((current) => {
      const next = new Set(current)
      currentPageIds.forEach((id) => next.add(id))
      return next
    })
    setSelectedEmployees((current) => {
      const next = new Map(current)
      benchPage?.content.forEach((employee) => next.set(employee.employeeId, employee))
      return next
    })
  }

  const openAllocation = () => {
    if (!project || selectedEmployeeIds.size === 0) return
    setAllocationForms(Object.fromEntries(Array.from(selectedEmployeeIds).map((employeeId) => [employeeId, {
      ...EMPTY_FORM, startDate: project.startDate, endDate: project.endDate,
    }])))
    setAllocationErrors({})
    setIsAllocationOpen(true)
  }

  const updateAllocationForm = (employeeId: string, field: keyof AllocationFormState, value: string) => {
    setAllocationForms((current) => ({ ...current, [employeeId]: { ...current[employeeId], [field]: value } }))
    setAllocationErrors((current) => ({ ...current, [employeeId]: { ...current[employeeId], [field]: undefined } }))
  }

  const submitAllocation = async () => {
    if (!project) return
    const errors: Record<string, AllocationFormErrors> = {}
    Object.entries(allocationForms).forEach(([employeeId, form]) => {
      const employeeErrors: AllocationFormErrors = {}
      const percentage = Number(form.allocationPercentage)
      if (!form.roleId) employeeErrors.roleId = 'Project Role is required.'
      if (!form.allocationPercentage || !Number.isFinite(percentage) || percentage <= 0 || percentage > 100) employeeErrors.allocationPercentage = 'Enter 1–100.'
      if (!form.startDate) employeeErrors.startDate = 'Start Date is required.'
      if (!form.endDate) employeeErrors.endDate = 'End Date is required.'
      if (form.startDate && form.endDate && form.endDate < form.startDate) employeeErrors.endDate = 'Must be after Start Date.'
      if (Object.keys(employeeErrors).length) errors[employeeId] = employeeErrors
    })
    if (Object.keys(errors).length > 0) {
      setAllocationErrors(errors)
      return
    }

    setIsSubmitting(true)
    const result = await projectAllocationService.createTeamMemberAllocations({
      projectId: project.id,
      allocations: Object.entries(allocationForms).map(([employeeId, form]) => ({
        employeeId, roleId: form.roleId, allocationPercentage: Number(form.allocationPercentage), startDate: form.startDate, endDate: form.endDate,
      })),
    })
    setIsSubmitting(false)
    if (result.success) {
      toast.success(result.message)
      setIsAllocationOpen(false)
      setSelectedEmployeeIds(new Set())
      setSelectedEmployees(new Map())
      refreshAll()
    } else toast.error(result.message)
  }

  const currentAllocatedPageIds = useMemo(() => allocatedPage?.content.map((allocation) => allocation.id) ?? [], [allocatedPage])
  const allAllocatedPageSelected = currentAllocatedPageIds.length > 0 && currentAllocatedPageIds.every((id) => selectedAllocationIds.has(id))

  const toggleAllocation = (allocationId: string) => {
    setSelectedAllocationIds((current) => {
      const next = new Set(current)
      if (next.has(allocationId)) next.delete(allocationId)
      else next.add(allocationId)
      return next
    })
  }

  const selectAllocatedPage = () => {
    setSelectedAllocationIds((current) => {
      const next = new Set(current)
      currentAllocatedPageIds.forEach((id) => next.add(id))
      return next
    })
  }

  const openExtend = (allocation: AllocatedTeamMember) => {
    setExtendTarget(allocation)
    setExtendEndDate(allocation.endDate)
    setExtendError(undefined)
  }

  const submitExtend = async () => {
    if (!extendTarget) return
    if (!extendEndDate) {
      setExtendError('End Date is required.')
      return
    }
    if (extendEndDate < extendTarget.startDate) {
      setExtendError('End Date cannot be earlier than Start Date.')
      return
    }
    setIsExtending(true)
    const result = await projectAllocationService.extendTeamMemberAllocation({
      allocationId: extendTarget.id,
      endDate: extendEndDate,
    })
    setIsExtending(false)
    if (result.success) {
      toast.success(result.message)
      setExtendTarget(null)
      refreshAll()
    } else setExtendError(result.message)
  }

  const openPercentage = (allocation: AllocatedTeamMember) => {
    setPercentageTarget(allocation)
    setPercentageValue(String(allocation.allocationPercentage))
    setPercentageError(undefined)
  }

  const submitPercentage = async () => {
    if (!percentageTarget) return
    const percentage = Number(percentageValue)
    if (!percentageValue || !Number.isFinite(percentage) || percentage <= 0 || percentage > 100) {
      setPercentageError('Enter a percentage between 1 and 100.')
      return
    }
    setIsUpdatingPercentage(true)
    const result = await projectAllocationService.updateTeamMemberAllocationPercentage({
      allocationId: percentageTarget.id,
      allocationPercentage: percentage,
    })
    setIsUpdatingPercentage(false)
    if (result.success) {
      toast.success(result.message)
      setPercentageTarget(null)
      refreshAll()
    } else setPercentageError(result.message)
  }

  const deallocate = async (allocationIds: string[], employeeLabel: string) => {
    const confirmed = await confirm({
      title: 'Deallocate Employee',
      message: `Are you sure you want to deallocate ${employeeLabel} from ${project?.name}? Their availability will be updated immediately.`,
      confirmText: 'Deallocate',
      variant: 'danger',
    })
    if (!confirmed) return
    const result = await projectAllocationService.deallocateTeamMembers({ allocationIds })
    if (result.success) {
      toast.success(result.message)
      setSelectedAllocationIds((current) => {
        const next = new Set(current)
        allocationIds.forEach((id) => next.delete(id))
        return next
      })
      refreshAll()
    } else toast.error(result.message)
  }

  const benchColumns: TableColumn<AvailableEmployee>[] = [
    {
      key: 'selection',
      header: '',
      width: '40px',
      render: (employee) => (
        <input type="checkbox" checked={selectedEmployeeIds.has(employee.employeeId)} onClick={(event) => event.stopPropagation()} onChange={() => toggleEmployee(employee)} aria-label={`Select ${employee.employeeName}`} className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-400" />
      ),
    },
    { key: 'employeeName', header: 'Employee', render: (employee) => <div><p className="font-medium text-ink-800">{employee.employeeName}</p><p className="mt-0.5 text-xs text-ink-400">{employee.email}</p></div> },
    { key: 'designationName', header: 'Designation', render: (employee) => employee.designationName },
    {
      key: 'availablePercentage',
      header: 'Availability',
      render: (employee) => <div><p className="font-medium text-signal-low">{employee.availablePercentage}% available</p><p className="mt-0.5 text-xs text-ink-400">{employee.currentAllocationPercentage}% currently allocated</p></div>,
    },
    { key: 'currentProjects', header: 'Current Projects', render: (employee) => employee.currentProjects.length > 0 ? <div className="flex max-w-56 flex-wrap gap-1">{employee.currentProjects.map((name) => <Badge key={name} tone="neutral">{name}</Badge>)}</div> : <span className="text-ink-400">None</span> },
  ]

  const allocatedColumns: TableColumn<AllocatedTeamMember>[] = [
    {
      key: 'selection',
      header: '',
      width: '40px',
      render: (allocation) => (
        <input type="checkbox" checked={selectedAllocationIds.has(allocation.id)} onClick={(event) => event.stopPropagation()} onChange={() => toggleAllocation(allocation.id)} aria-label={`Select ${allocation.employeeName}`} className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-400" />
      ),
    },
    { key: 'employeeName', header: 'Employee', render: (allocation) => <div><p className="font-medium text-ink-800">{allocation.employeeName}</p><p className="mt-0.5 text-xs text-ink-400">{allocation.designationName}</p></div> },
    { key: 'roleName', header: 'Project Role', render: (allocation) => allocation.roleName },
    { key: 'allocationPercentage', header: 'Allocation', render: (allocation) => <Badge tone="info">{allocation.allocationPercentage}%</Badge> },
    { key: 'startDate', header: 'Start Date', render: (allocation) => formatDate(allocation.startDate) },
    { key: 'endDate', header: 'End Date', render: (allocation) => formatDate(allocation.endDate) },
    { key: 'status', header: 'Status', render: (allocation) => <Badge tone={allocation.status === 'ACTIVE' ? 'success' : 'neutral'}>{allocation.status === 'ACTIVE' ? 'Active' : 'Closed'}</Badge> },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (allocation) => (
        hasPrivilege(PRIV.PROJECT_ALLOCATION_UPDATE) ? (
          <div className="flex items-center justify-end gap-1" onClick={(event) => event.stopPropagation()}>
            <button type="button" title="Extend End Date" onClick={() => openExtend(allocation)} className="rounded p-1.5 text-ink-400 hover:bg-ink-100 hover:text-brand-600"><CalendarClock className="h-4 w-4" /></button>
            <button type="button" title="Update Allocation Percentage" onClick={() => openPercentage(allocation)} className="rounded p-1.5 text-ink-400 hover:bg-ink-100 hover:text-brand-600"><Percent className="h-4 w-4" /></button>
            <button type="button" title="Deallocate" onClick={() => deallocate([allocation.id], allocation.employeeName)} className="rounded p-1.5 text-ink-400 hover:bg-red-50 hover:text-signal-critical"><UserMinus className="h-4 w-4" /></button>
          </div>
        ) : null
      ),
    },
  ]

  const clearBenchFilters = () => {
    setBenchSearch('')
    setDesignationId('All')
    setAvailabilityBand('All')
  }

  const clearAllocatedFilters = () => {
    setAllocatedSearch('')
    setAllocatedRoleId('All')
    setAllocatedAvailabilityBand('All')
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Project Allocation" description="Select a project, then allocate bench employees or manage the current team on the right." actions={<ProjectSelector />} />

      {!selectedProject || !project ? (
        <div className="rounded-lg border border-ink-200 bg-white py-12 shadow-panel"><EmptyState title="Select a project" description="Choose an active project above before managing allocations." /></div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          <div className="flex flex-col gap-3 rounded-lg border border-ink-200 bg-white shadow-panel">
            <div className="border-b border-ink-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-ink-900">Bench Employees</h3>
              <p className="mt-0.5 text-xs text-ink-500">Employees with available allocation for this project period.</p>
            </div>
            <div className="flex flex-col gap-3 px-4">
              <div className="flex flex-wrap items-center gap-2">
                <Search value={benchSearch} onChange={setBenchSearch} placeholder="Search available employees..." />
                <Filter label="Designation" value={designationId} options={designationOptions} onChange={setDesignationId} />
                <Filter label="Availability" value={availabilityBand} options={AVAILABILITY_OPTIONS} onChange={setAvailabilityBand} />
                <Button variant="filterClear" size="sm" leftIcon={<X className="h-4 w-4" />} onClick={clearBenchFilters} disabled={!benchSearch && designationId === 'All' && availabilityBand === 'All'}>Clear Filters</Button>
              </div>
              <div className="flex flex-col gap-2 rounded-md bg-ink-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-ink-600"><span className="font-semibold text-ink-900">{selectedEmployeeIds.size}</span> employee{selectedEmployeeIds.size === 1 ? '' : 's'} selected</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="ghost" size="sm" leftIcon={<CheckSquare className="h-4 w-4" />} onClick={selectCurrentPage} disabled={allCurrentPageSelected || currentPageIds.length === 0}>Select All</Button>
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedEmployeeIds(new Set()); setSelectedEmployees(new Map()) }} disabled={selectedEmployeeIds.size === 0}>Clear All</Button>
                  {hasPrivilege(PRIV.PROJECT_ALLOCATION_UPDATE) && <Button size="sm" leftIcon={<UserPlus className="h-4 w-4" />} onClick={openAllocation} disabled={selectedEmployeeIds.size === 0}>Allocate</Button>}
                </div>
              </div>
            </div>
            <div className="px-4 pb-4">
              <Table columns={benchColumns} rows={benchPage?.content ?? []} rowKey={(employee) => employee.employeeId} onRowClick={toggleEmployee} isLoading={isBenchLoading} error={benchError} onRetry={reloadBench} emptyTitle="No employees available for this project period" emptyDescription="Try another filter or review current allocations." />
              <div className="mt-3"><Pagination page={benchPage} onPageChange={setBenchPageNumber} onPageSizeChange={setBenchPageSize} /></div>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-lg border border-ink-200 bg-white shadow-panel">
            <div className="border-b border-ink-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-ink-900">Allocated Employees</h3>
              <p className="mt-0.5 text-xs text-ink-500">Team currently allocated to {project.name}.</p>
            </div>
            <div className="flex flex-col gap-3 px-4">
              <div className="flex flex-wrap items-center gap-2">
                <Search value={allocatedSearch} onChange={setAllocatedSearch} placeholder="Search allocated employees..." />
                <Filter label="Role" value={allocatedRoleId} options={roleOptions} onChange={setAllocatedRoleId} />
                <Filter label="Availability" value={allocatedAvailabilityBand} options={ALLOCATED_AVAILABILITY_OPTIONS} onChange={setAllocatedAvailabilityBand} />
                <Button variant="filterClear" size="sm" leftIcon={<X className="h-4 w-4" />} onClick={clearAllocatedFilters} disabled={!allocatedSearch && allocatedRoleId === 'All' && allocatedAvailabilityBand === 'All'}>Clear Filters</Button>
              </div>
              {hasPrivilege(PRIV.PROJECT_ALLOCATION_UPDATE) && (
                <div className="flex flex-col gap-2 rounded-md bg-ink-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-ink-600"><span className="font-semibold text-ink-900">{selectedAllocationIds.size}</span> employee{selectedAllocationIds.size === 1 ? '' : 's'} selected</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="ghost" size="sm" leftIcon={<CheckSquare className="h-4 w-4" />} onClick={selectAllocatedPage} disabled={allAllocatedPageSelected || currentAllocatedPageIds.length === 0}>Select All</Button>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedAllocationIds(new Set())} disabled={selectedAllocationIds.size === 0}>Clear All</Button>
                    <Button variant="danger" size="sm" leftIcon={<UserMinus className="h-4 w-4" />} onClick={() => deallocate(Array.from(selectedAllocationIds), `${selectedAllocationIds.size} employee${selectedAllocationIds.size === 1 ? '' : 's'}`)} disabled={selectedAllocationIds.size === 0}>Deallocate</Button>
                  </div>
                </div>
              )}
            </div>
            <div className="px-4 pb-4">
              <Table columns={allocatedColumns} rows={allocatedPage?.content ?? []} rowKey={(allocation) => allocation.id} onRowClick={(allocation) => toggleAllocation(allocation.id)} isLoading={isAllocatedLoading} error={allocatedError} onRetry={reloadAllocated} emptyTitle="No employees allocated yet" emptyDescription="Allocate bench employees from the left panel." />
              <div className="mt-3"><Pagination page={allocatedPage} onPageChange={setAllocatedPageNumber} onPageSizeChange={setAllocatedPageSize} /></div>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={isAllocationOpen}
        onClose={() => !isSubmitting && setIsAllocationOpen(false)}
        title="Allocate Employees"
        description={`Configure the role, allocation percentage, and dates independently for each of the ${selectedEmployeeIds.size} selected employees.`}
        size="lg"
        footer={<><Button variant="ghost" onClick={() => setIsAllocationOpen(false)} disabled={isSubmitting}>Cancel</Button><Button leftIcon={<UserPlus className="h-4 w-4" />} onClick={submitAllocation} isLoading={isSubmitting}>Allocate</Button></>}
      >
        <div className="space-y-4">
          {Object.entries(allocationForms).map(([employeeId, employeeForm], index) => {
            const employee = selectedEmployees.get(employeeId)
            const errors = allocationErrors[employeeId] ?? {}
            return <section key={employeeId} className="rounded-xl border border-ink-200 bg-ink-50/60 p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div><p className="font-semibold text-ink-900">{index + 1}. {employee?.employeeName ?? employeeId}</p><p className="text-xs text-ink-500">{employee?.designationName} · {employee?.availablePercentage ?? 0}% available</p></div>
                <Badge tone="info">Individual allocation</Badge>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Dropdown label="Project Role" required value={employeeForm.roleId} onChange={(event) => updateAllocationForm(employeeId, 'roleId', event.target.value)} options={roleOptions} error={errors.roleId} />
                <Input label="Allocation Percentage" required type="number" min="1" max={employee?.availablePercentage ?? 100} value={employeeForm.allocationPercentage} onChange={(event) => updateAllocationForm(employeeId, 'allocationPercentage', event.target.value)} error={errors.allocationPercentage} />
                <Input label="Start Date" required type="date" min={project?.startDate} max={project?.endDate} value={employeeForm.startDate} onChange={(event) => updateAllocationForm(employeeId, 'startDate', event.target.value)} error={errors.startDate} />
                <Input label="End Date" required type="date" min={employeeForm.startDate || project?.startDate} max={project?.endDate} value={employeeForm.endDate} onChange={(event) => updateAllocationForm(employeeId, 'endDate', event.target.value)} error={errors.endDate} />
              </div>
            </section>
          })}
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(extendTarget)}
        onClose={() => !isExtending && setExtendTarget(null)}
        title="Extend Allocation"
        description={extendTarget ? `Update the End Date for ${extendTarget.employeeName} on ${project?.name}.` : undefined}
        size="sm"
        footer={<><Button variant="ghost" onClick={() => setExtendTarget(null)} disabled={isExtending}>Cancel</Button><Button leftIcon={<CalendarClock className="h-4 w-4" />} onClick={submitExtend} isLoading={isExtending}>Save</Button></>}
      >
        <Input label="End Date" required type="date" min={extendTarget?.startDate} value={extendEndDate} onChange={(event) => { setExtendEndDate(event.target.value); setExtendError(undefined) }} error={extendError} />
      </Modal>

      <Modal
        isOpen={Boolean(percentageTarget)}
        onClose={() => !isUpdatingPercentage && setPercentageTarget(null)}
        title="Update Allocation Percentage"
        description={percentageTarget ? `Update the allocation percentage for ${percentageTarget.employeeName} on ${project?.name}.` : undefined}
        size="sm"
        footer={<><Button variant="ghost" onClick={() => setPercentageTarget(null)} disabled={isUpdatingPercentage}>Cancel</Button><Button leftIcon={<Percent className="h-4 w-4" />} onClick={submitPercentage} isLoading={isUpdatingPercentage}>Save</Button></>}
      >
        <Input label="Allocation Percentage" required type="number" min="1" max="100" value={percentageValue} onChange={(event) => { setPercentageValue(event.target.value); setPercentageError(undefined) }} error={percentageError} />
      </Modal>
    </div>
  )
}
