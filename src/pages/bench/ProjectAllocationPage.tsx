import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, CalendarClock, CheckSquare, Percent, Repeat2, UserMinus, UserPlus, X } from 'lucide-react'
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
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/hooks/useAuth'
import { usePagination } from '@/hooks/usePagination'
import { useProject } from '@/hooks/useProject'
import { designationService } from '@/services/designationService'
import { projectAllocationService } from '@/services/projectAllocationService'
import { projectService } from '@/services/projectService'
import { roleService } from '@/services/roleService'
import { AllocatedTeamMember, AvailableEmployee, Project } from '@/types/project'
import { RoleRecord } from '@/types/role'
import { getAllocationStatusTone, isMutableAllocation } from '@/utils/allocation'
import { addDaysToDate, getTodayDateString, isDateRangeValid, isDateWithinRange } from '@/utils/date'
import { formatDate } from '@/utils/format'

const AVAILABILITY_OPTIONS = [
  { label: 'Fully Available', value: 'FULLY_AVAILABLE' },
  { label: 'Partially Available', value: 'PARTIALLY_AVAILABLE' },
]

const ALLOCATION_STATUS_OPTIONS = [
  { label: 'Scheduled', value: 'SCHEDULED' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
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
  const submissionGuard = useRef(false)
  const allocationErrorRef = useRef<HTMLDivElement>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [designationId, setDesignationId] = useState('All')
  const [availabilityBand, setAvailabilityBand] = useState('All')
  const [allocatedRoleId, setAllocatedRoleId] = useState('All')
  const [allocatedStatus, setAllocatedStatus] = useState('All')
  const [plannedStartDate, setPlannedStartDate] = useState('')
  const [plannedEndDate, setPlannedEndDate] = useState('')
  const [designationOptions, setDesignationOptions] = useState<{ label: string; value: string }[]>([])
  const [roles, setRoles] = useState<RoleRecord[]>([])
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(new Set())
  const [selectedEmployees, setSelectedEmployees] = useState<Map<string, AvailableEmployee>>(new Map())
  const [isAllocationOpen, setIsAllocationOpen] = useState(false)
  const [allocationForms, setAllocationForms] = useState<Record<string, AllocationFormState>>({})
  const [allocationErrors, setAllocationErrors] = useState<Record<string, AllocationFormErrors>>({})
  const [allocationSubmitError, setAllocationSubmitError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [selectedAllocationIds, setSelectedAllocationIds] = useState<Set<string>>(new Set())
  const [extendTarget, setExtendTarget] = useState<AllocatedTeamMember | null>(null)
  const [extendEndDate, setExtendEndDate] = useState('')
  const [extendError, setExtendError] = useState<string | undefined>()
  const [isExtending, setIsExtending] = useState(false)
  const [percentageTarget, setPercentageTarget] = useState<AllocatedTeamMember | null>(null)
  const [percentageValue, setPercentageValue] = useState('')
  const [percentageEffectiveDate, setPercentageEffectiveDate] = useState('')
  const [percentageError, setPercentageError] = useState<string | undefined>()
  const [isUpdatingPercentage, setIsUpdatingPercentage] = useState(false)
  const [roleTarget, setRoleTarget] = useState<AllocatedTeamMember | null>(null)
  const [newRoleId, setNewRoleId] = useState('')
  const [roleEffectiveDate, setRoleEffectiveDate] = useState('')
  const [roleError, setRoleError] = useState<string | undefined>()
  const [isUpdatingRole, setIsUpdatingRole] = useState(false)
  const [deallocationTargets, setDeallocationTargets] = useState<AllocatedTeamMember[]>([])
  const [deallocationEffectiveDate, setDeallocationEffectiveDate] = useState('')
  const [deallocationReason, setDeallocationReason] = useState('')
  const [deallocationError, setDeallocationError] = useState<string | undefined>()
  const [isDeallocating, setIsDeallocating] = useState(false)

  useEffect(() => {
    if (!allocationSubmitError) return
    const errorAlert = allocationErrorRef.current
    errorAlert?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    errorAlert?.focus({ preventScroll: true })
  }, [allocationSubmitError])

  useEffect(() => {
    designationService.getDesignations({ pageNumber: 0, pageSize: 100, sortBy: 'title' }).then((result) => {
      if (result.success) setDesignationOptions(result.data.content.map((item) => ({ label: item.title, value: item.id })))
    })
    roleService.getRoles({ pageNumber: 0, pageSize: 100, sortBy: 'name', filters: { status: 'ACTIVE' } }).then((result) => {
      if (result.success) setRoles(result.data.content.filter((item) => item.roleType !== 'PROJECT_MANAGER'))
    })
  }, [])

  useEffect(() => {
    setSelectedEmployeeIds(new Set())
    setSelectedEmployees(new Map())
    setSelectedAllocationIds(new Set())
    setDesignationId('All')
    setAvailabilityBand('All')
    setAllocatedRoleId('All')
    setAllocatedStatus('All')
    setIsAllocationOpen(false)
    setExtendTarget(null)
    setPercentageTarget(null)
    setRoleTarget(null)
    setDeallocationTargets([])
    setProject(null)
    if (!selectedProject || selectedProject.status !== 'ACTIVE') return

    projectService.getProjectById(selectedProject.projectId).then((result) => {
      if (result.success) {
        setProject(result.data)
        setPlannedStartDate(result.data.startDate)
        setPlannedEndDate(result.data.endDate)
      }
    })
  }, [selectedProject])

  const benchFetcher = useCallback(
    (request: Parameters<typeof projectAllocationService.getProjectAvailableEmployees>[1]) =>
      projectAllocationService.getProjectAvailableEmployees(project?.id ?? '', request),
    [project?.id],
  )
  const {
    page: benchPage,
    isLoading: isBenchLoading,
    error: benchError,
    search: benchSearch,
    sortBy: benchSortBy,
    sortDir: benchSortDir,
    setPageNumber: setBenchPageNumber,
    setPageSize: setBenchPageSize,
    setSearch: setBenchSearch,
    setSortBy: setBenchSortBy,
    setSortDir: setBenchSortDir,
    reload: reloadBench,
  } = usePagination<AvailableEmployee>({
    fetcher: benchFetcher,
    initialPageSize: 10,
    initialSortBy: 'employeeName',
    filters: { designationId, availabilityBand, startDate: plannedStartDate, endDate: plannedEndDate },
    enabled: Boolean(project && isDateRangeValid(plannedStartDate, plannedEndDate)),
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
    sortBy: allocatedSortBy,
    sortDir: allocatedSortDir,
    setPageNumber: setAllocatedPageNumber,
    setPageSize: setAllocatedPageSize,
    setSearch: setAllocatedSearch,
    setSortBy: setAllocatedSortBy,
    setSortDir: setAllocatedSortDir,
    reload: reloadAllocated,
  } = usePagination<AllocatedTeamMember>({
    fetcher: allocatedFetcher,
    initialPageSize: 10,
    initialSortBy: 'employeeName',
    filters: { roleId: allocatedRoleId, status: allocatedStatus },
    enabled: Boolean(project),
  })

  const refreshAll = useCallback(() => {
    reloadBench()
    reloadAllocated()
  }, [reloadBench, reloadAllocated])

  const roleOptions = roles.map((role) => ({ label: role.name, value: role.id }))

  useEffect(() => {
    setSelectedEmployeeIds(new Set())
    setSelectedEmployees(new Map())
    setIsAllocationOpen(false)
  }, [plannedStartDate, plannedEndDate, designationId, availabilityBand])

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
    if (!project || !isDateRangeValid(plannedStartDate, plannedEndDate) || selectedEmployeeIds.size === 0) return
    setAllocationForms(Object.fromEntries(Array.from(selectedEmployeeIds).map((employeeId) => [employeeId, {
      ...EMPTY_FORM, startDate: plannedStartDate, endDate: plannedEndDate,
    }])))
    setAllocationErrors({})
    setAllocationSubmitError(undefined)
    setIsAllocationOpen(true)
  }

  const updateAllocationForm = (employeeId: string, field: keyof AllocationFormState, value: string) => {
    setAllocationForms((current) => ({ ...current, [employeeId]: { ...current[employeeId], [field]: value } }))
    setAllocationErrors((current) => ({ ...current, [employeeId]: { ...current[employeeId], [field]: undefined } }))
    setAllocationSubmitError(undefined)
  }

  const submitAllocation = async () => {
    if (!project || submissionGuard.current) return
    const errors: Record<string, AllocationFormErrors> = {}
    Object.entries(allocationForms).forEach(([employeeId, form]) => {
      const employeeErrors: AllocationFormErrors = {}
      const percentage = Number(form.allocationPercentage)
      if (!form.roleId) employeeErrors.roleId = 'Project Role is required.'
      const available = selectedEmployees.get(employeeId)?.availablePercentage ?? 100
      if (!form.allocationPercentage || !Number.isFinite(percentage) || percentage <= 0 || percentage > available) employeeErrors.allocationPercentage = `Enter a value between 1 and ${available}.`
      if (!form.startDate) employeeErrors.startDate = 'Start Date is required.'
      if (!form.endDate) employeeErrors.endDate = 'End Date is required.'
      if (form.startDate && form.endDate && form.endDate < form.startDate) employeeErrors.endDate = 'Must be after Start Date.'
      if (form.startDate && !isDateWithinRange(form.startDate, plannedStartDate, plannedEndDate)) employeeErrors.startDate = 'Start Date must be inside the planned period.'
      if (form.endDate && !isDateWithinRange(form.endDate, plannedStartDate, plannedEndDate)) employeeErrors.endDate = 'End Date must be inside the planned period.'
      if (Object.keys(employeeErrors).length) errors[employeeId] = employeeErrors
    })
    if (Object.keys(errors).length > 0) {
      setAllocationErrors(errors)
      return
    }

    submissionGuard.current = true
    setIsSubmitting(true)
    setAllocationSubmitError(undefined)
    const result = await projectAllocationService.createTeamMemberAllocations({
      projectId: project.id,
      allocations: Object.entries(allocationForms).map(([employeeId, form]) => ({
        employeeId, roleId: form.roleId, allocationPercentage: Number(form.allocationPercentage), startDate: form.startDate, endDate: form.endDate,
      })),
    })
    submissionGuard.current = false
    setIsSubmitting(false)
    if (result.success) {
      toast.success(result.message)
      setIsAllocationOpen(false)
      setSelectedEmployeeIds(new Set())
      setSelectedEmployees(new Map())
      refreshAll()
    } else {
      setAllocationSubmitError(result.message)

      const availabilityMatch = result.message.match(/has only\s+(\d+(?:\.\d+)?)%\s+guaranteed availability.*Requested allocation is\s+(\d+(?:\.\d+)?)%/i)
      const affectedEmployee = Array.from(selectedEmployees.entries()).find(([, employee]) =>
        result.message.toLocaleLowerCase().includes(employee.employeeName.toLocaleLowerCase()),
      )
      if (availabilityMatch && affectedEmployee) {
        const [employeeId] = affectedEmployee
        setAllocationErrors((current) => ({
          ...current,
          [employeeId]: {
            ...current[employeeId],
            allocationPercentage: `Maximum guaranteed availability for these dates is ${availabilityMatch[1]}%.`,
          },
        }))
      }
    }
  }

  const eligibleAllocatedRows = useMemo(
    () => allocatedPage?.content.filter((allocation) => isMutableAllocation(allocation.managerAllocation, allocation.status)) ?? [],
    [allocatedPage],
  )
  const currentAllocatedPageIds = useMemo(() => eligibleAllocatedRows.map((allocation) => allocation.allocationId), [eligibleAllocatedRows])
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
    setExtendEndDate(addDaysToDate(allocation.endDate, 1))
    setExtendError(undefined)
  }

  const submitExtend = async () => {
    if (!extendTarget) return
    if (!extendEndDate) {
      setExtendError('End Date is required.')
      return
    }
    if (extendEndDate <= extendTarget.endDate) {
      setExtendError('New End Date must be after Current End Date.')
      return
    }
    if (project && extendEndDate > project.endDate) {
      setExtendError('New End Date cannot exceed Project End Date.')
      return
    }
    setIsExtending(true)
    const result = await projectAllocationService.extendTeamMemberAllocation(
      extendTarget.allocationId,
      { newEndDate: extendEndDate },
    )
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
    const today = getTodayDateString()
    setPercentageEffectiveDate(
      allocation.status === 'SCHEDULED'
        ? allocation.startDate
        : isDateWithinRange(today, allocation.startDate, allocation.endDate)
          ? today
          : allocation.startDate,
    )
    setPercentageError(undefined)
  }

  const submitPercentage = async () => {
    if (!percentageTarget) return
    const percentage = Number(percentageValue)
    if (!percentageValue || !Number.isFinite(percentage) || percentage <= 0 || percentage > 100) {
      setPercentageError('Enter a percentage between 1 and 100.')
      return
    }
    if (!percentageEffectiveDate || !isDateWithinRange(percentageEffectiveDate, percentageTarget.startDate, percentageTarget.endDate)) {
      setPercentageError('Effective Date must be inside the allocation period.')
      return
    }
    setIsUpdatingPercentage(true)
    const result = await projectAllocationService.updateTeamMemberAllocationPercentage(
      percentageTarget.allocationId,
      { allocationPercentage: percentage, effectiveDate: percentageEffectiveDate },
    )
    setIsUpdatingPercentage(false)
    if (result.success) {
      toast.success(result.message)
      setPercentageTarget(null)
      refreshAll()
    } else setPercentageError(result.message)
  }

  const openDeallocation = (targets: AllocatedTeamMember[]) => {
    const eligible = targets.filter((allocation) => isMutableAllocation(allocation.managerAllocation, allocation.status))
    if (!eligible.length) return
    setDeallocationTargets(eligible)
    setDeallocationEffectiveDate(getTodayDateString())
    setDeallocationReason('')
    setDeallocationError(undefined)
  }

  const submitDeallocation = async () => {
    if (!deallocationTargets.length || !deallocationEffectiveDate || isDeallocating) return
    if (deallocationTargets.some((allocation) => !isDateWithinRange(deallocationEffectiveDate, allocation.startDate, allocation.endDate))) {
      setDeallocationError('Effective Deallocation Date must be inside every selected allocation period.')
      return
    }
    setIsDeallocating(true)
    const payload = { effectiveDate: deallocationEffectiveDate, reason: deallocationReason.trim() || undefined }
    const result = deallocationTargets.length === 1
      ? await projectAllocationService.deallocateTeamMember(deallocationTargets[0].allocationId, payload)
      : await projectAllocationService.bulkDeallocateTeamMembers({
          allocationIds: deallocationTargets.map((allocation) => allocation.allocationId),
          ...payload,
        })
    setIsDeallocating(false)
    if (result.success) {
      toast.success(result.message)
      setSelectedAllocationIds(new Set())
      setDeallocationTargets([])
      refreshAll()
    } else setDeallocationError(result.message)
  }

  const openRoleUpdate = (allocation: AllocatedTeamMember) => {
    if (!isMutableAllocation(allocation.managerAllocation, allocation.status)) return
    setRoleTarget(allocation)
    setNewRoleId(allocation.roleId)
    const today = getTodayDateString()
    setRoleEffectiveDate(
      allocation.status === 'SCHEDULED'
        ? allocation.startDate
        : isDateWithinRange(today, allocation.startDate, allocation.endDate)
          ? today
          : allocation.startDate,
    )
    setRoleError(undefined)
  }

  const submitRoleUpdate = async () => {
    if (!roleTarget || !newRoleId || !roleEffectiveDate) {
      setRoleError('New Role and Effective Date are required.')
      return
    }
    if (!isDateWithinRange(roleEffectiveDate, roleTarget.startDate, roleTarget.endDate)) {
      setRoleError('Effective Date must be inside the allocation period.')
      return
    }
    setIsUpdatingRole(true)
    const result = await projectAllocationService.updateTeamMemberAllocationRole(
      roleTarget.allocationId,
      { roleId: newRoleId, effectiveDate: roleEffectiveDate },
    )
    setIsUpdatingRole(false)
    if (result.success) {
      toast.success(result.message)
      setRoleTarget(null)
      refreshAll()
    } else setRoleError(result.message)
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
    { key: 'employeeName', header: 'Employee', sortable: true, render: (employee) => <div><p className="font-medium text-ink-800">{employee.employeeName}</p><p className="mt-0.5 text-xs text-ink-400">{employee.email}</p></div> },
    { key: 'designationName', header: 'Designation', sortable: true, render: (employee) => employee.designationName },
    {
      key: 'availablePercentage',
      header: 'Capacity',
      sortable: true,
      render: (employee) => <div><p className="font-medium text-signal-low">{employee.availablePercentage}% available</p><p className="mt-0.5 text-xs text-ink-400">{employee.allocatedPercentage}% allocated</p></div>,
    },
    { key: 'allocations', header: 'Current Overlapping Allocations', render: (employee) => employee.allocations.length > 0 ? <div className="min-w-44 space-y-1">{employee.allocations.slice(0, 2).map((item) => <div key={item.allocationId}><p className="text-xs font-medium text-ink-700">{item.projectName}</p><p className="text-xs text-ink-400">{item.roleName} · {item.allocationPercentage}%</p></div>)}</div> : <span className="text-ink-400">None</span> },
  ]

  const allocatedColumns: TableColumn<AllocatedTeamMember>[] = [
    {
      key: 'selection',
      header: '',
      width: '40px',
      render: (allocation) => {
        const eligible = isMutableAllocation(allocation.managerAllocation, allocation.status)
        return <input type="checkbox" disabled={!eligible} checked={selectedAllocationIds.has(allocation.allocationId)} onClick={(event) => event.stopPropagation()} onChange={() => eligible && toggleAllocation(allocation.allocationId)} aria-label={`Select ${allocation.employeeName}`} title={allocation.managerAllocation ? 'Project Manager allocation must be updated through Project Management.' : undefined} className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-400 disabled:cursor-not-allowed disabled:opacity-40" />
      },
    },
    { key: 'employeeName', header: 'Employee', sortable: true, render: (allocation) => <div><p className="font-medium text-ink-800">{allocation.employeeName}</p><p className="mt-0.5 text-xs text-ink-400">{allocation.designationName}</p></div> },
    { key: 'roleName', header: 'Project Role', sortable: true, render: (allocation) => <div>{allocation.roleName}{allocation.managerAllocation && <><div className="mt-1"><Badge tone="info">Project Manager</Badge></div><p className="mt-1 text-xs text-ink-400">Managed through Project Management</p></>}</div> },
    { key: 'allocationPercentage', header: 'Allocation', sortable: true, render: (allocation) => <Badge tone="info">{allocation.allocationPercentage}%</Badge> },
    { key: 'startDate', header: 'Start Date', sortable: true, render: (allocation) => formatDate(allocation.startDate) },
    { key: 'endDate', header: 'End Date', sortable: true, render: (allocation) => formatDate(allocation.endDate) },
    { key: 'status', header: 'Status', sortable: true, render: (allocation) => <Badge tone={getAllocationStatusTone(allocation.status)}>{allocation.status}</Badge> },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (allocation) => (
        hasPrivilege(PRIV.PROJECT_ALLOCATION_UPDATE) && isMutableAllocation(allocation.managerAllocation, allocation.status) ? (
          <div className="flex items-center justify-end gap-1" onClick={(event) => event.stopPropagation()}>
            <button type="button" title="Extend End Date" aria-label={`Extend ${allocation.employeeName} allocation`} onClick={() => openExtend(allocation)} className="rounded p-1.5 text-ink-400 hover:bg-ink-100 hover:text-brand-600"><CalendarClock className="h-4 w-4" /></button>
            <button type="button" title="Update Allocation Percentage" aria-label={`Update ${allocation.employeeName} allocation percentage`} onClick={() => openPercentage(allocation)} className="rounded p-1.5 text-ink-400 hover:bg-ink-100 hover:text-brand-600"><Percent className="h-4 w-4" /></button>
            <button type="button" title="Update Project Role" aria-label={`Update ${allocation.employeeName} project role`} onClick={() => openRoleUpdate(allocation)} className="rounded p-1.5 text-ink-400 hover:bg-ink-100 hover:text-brand-600"><Repeat2 className="h-4 w-4" /></button>
            {hasPrivilege(PRIV.PROJECT_ALLOCATION_DEALLOCATE) && <button type="button" title="Deallocate" aria-label={`Deallocate ${allocation.employeeName}`} onClick={() => openDeallocation([allocation])} className="rounded p-1.5 text-ink-400 hover:bg-red-50 hover:text-signal-critical"><UserMinus className="h-4 w-4" /></button>}
          </div>
        ) : allocation.managerAllocation ? <span className="text-xs text-ink-400" title="Project Manager allocation must be updated through Project Management.">Protected</span> : null
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
    setAllocatedStatus('All')
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Project Allocation" description="Select a project, then allocate bench employees or manage the current team on the right." actions={<ProjectSelector />} />

      {!selectedProject || !project ? (
        <div className="rounded-lg border border-ink-200 bg-white py-12 shadow-panel"><EmptyState title="Select a project" description="Choose an active project above before managing allocations." /></div>
      ) : (
        <>
        <div className="rounded-lg border border-ink-200 bg-white p-4 shadow-panel">
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
            <div><p className="text-xs text-ink-400">Project</p><p className="mt-1 text-sm font-semibold text-ink-800">{project.name}</p></div>
            <div><p className="text-xs text-ink-400">Project Start</p><p className="mt-1 text-sm text-ink-700">{formatDate(project.startDate)}</p></div>
            <div><p className="text-xs text-ink-400">Project End</p><p className="mt-1 text-sm text-ink-700">{formatDate(project.endDate)}</p></div>
            <Input label="Planned Allocation Start Date" type="date" min={project.startDate} max={plannedEndDate || project.endDate} value={plannedStartDate} error={plannedStartDate && plannedStartDate < project.startDate ? 'Must be inside Project dates.' : undefined} onChange={(event) => setPlannedStartDate(event.target.value)} />
            <Input label="Planned Allocation End Date" type="date" min={plannedStartDate || project.startDate} max={project.endDate} value={plannedEndDate} error={!isDateRangeValid(plannedStartDate, plannedEndDate) || plannedEndDate > project.endDate ? 'Must be inside Project dates.' : undefined} onChange={(event) => setPlannedEndDate(event.target.value)} />
          </div>
          <p className="mt-3 text-xs text-ink-500">Availability is calculated for the selected allocation period.</p>
        </div>
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
                  {hasPrivilege(PRIV.PROJECT_ALLOCATION_CREATE) && <Button size="sm" leftIcon={<UserPlus className="h-4 w-4" />} onClick={openAllocation} disabled={selectedEmployeeIds.size === 0 || !isDateRangeValid(plannedStartDate, plannedEndDate)}>Allocate</Button>}
                </div>
              </div>
            </div>
            <div className="px-4 pb-4">
              <Table columns={benchColumns} rows={benchPage?.content ?? []} rowKey={(employee) => employee.employeeId} onRowClick={toggleEmployee} isLoading={isBenchLoading} error={benchError} onRetry={reloadBench} sortBy={benchSortBy} sortDir={benchSortDir} onSort={(key) => { if (benchSortBy === key) setBenchSortDir(benchSortDir === 'asc' ? 'desc' : 'asc'); else { setBenchSortBy(key); setBenchSortDir('asc') } }} emptyTitle="No employees available for this project period" emptyDescription="Try another filter or review current allocations." />
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
                <Filter label="Status" value={allocatedStatus} options={ALLOCATION_STATUS_OPTIONS} onChange={setAllocatedStatus} />
                <Button variant="filterClear" size="sm" leftIcon={<X className="h-4 w-4" />} onClick={clearAllocatedFilters} disabled={!allocatedSearch && allocatedRoleId === 'All' && allocatedStatus === 'All'}>Clear Filters</Button>
              </div>
              {hasPrivilege(PRIV.PROJECT_ALLOCATION_UPDATE) && (
                <div className="flex flex-col gap-2 rounded-md bg-ink-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-ink-600"><span className="font-semibold text-ink-900">{selectedAllocationIds.size}</span> employee{selectedAllocationIds.size === 1 ? '' : 's'} selected</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="ghost" size="sm" leftIcon={<CheckSquare className="h-4 w-4" />} onClick={selectAllocatedPage} disabled={allAllocatedPageSelected || currentAllocatedPageIds.length === 0}>Select All</Button>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedAllocationIds(new Set())} disabled={selectedAllocationIds.size === 0}>Clear All</Button>
                    {hasPrivilege(PRIV.PROJECT_ALLOCATION_DEALLOCATE) && <Button variant="danger" size="sm" leftIcon={<UserMinus className="h-4 w-4" />} onClick={() => openDeallocation(eligibleAllocatedRows.filter((allocation) => selectedAllocationIds.has(allocation.allocationId)))} disabled={selectedAllocationIds.size === 0}>Deallocate</Button>}
                  </div>
                </div>
              )}
            </div>
            <div className="px-4 pb-4">
              <Table columns={allocatedColumns} rows={allocatedPage?.content ?? []} rowKey={(allocation) => allocation.allocationId} onRowClick={(allocation) => isMutableAllocation(allocation.managerAllocation, allocation.status) && toggleAllocation(allocation.allocationId)} isLoading={isAllocatedLoading} error={allocatedError} onRetry={reloadAllocated} sortBy={allocatedSortBy} sortDir={allocatedSortDir} onSort={(key) => { if (allocatedSortBy === key) setAllocatedSortDir(allocatedSortDir === 'asc' ? 'desc' : 'asc'); else { setAllocatedSortBy(key); setAllocatedSortDir('asc') } }} emptyTitle="No employees allocated yet" emptyDescription="Allocate bench employees from the left panel." />
              <div className="mt-3"><Pagination page={allocatedPage} onPageChange={setAllocatedPageNumber} onPageSizeChange={setAllocatedPageSize} /></div>
            </div>
          </div>
        </div>
        </>
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
          {allocationSubmitError && (
            <div
              ref={allocationErrorRef}
              role="alert"
              aria-live="assertive"
              tabIndex={-1}
              className="flex scroll-mt-4 gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-signal-critical outline-none focus:ring-2 focus:ring-signal-critical/30"
            >
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold">Allocation could not be completed</p>
                <p className="mt-1 text-sm leading-5 text-red-700">{allocationSubmitError}</p>
                <p className="mt-2 text-xs text-red-600">Adjust the allocation percentage or date range, then try again.</p>
              </div>
            </div>
          )}
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
                <Input label="Start Date" required type="date" min={plannedStartDate} max={plannedEndDate} value={employeeForm.startDate} onChange={(event) => updateAllocationForm(employeeId, 'startDate', event.target.value)} error={errors.startDate} />
                <Input label="End Date" required type="date" min={employeeForm.startDate || plannedStartDate} max={plannedEndDate} value={employeeForm.endDate} onChange={(event) => updateAllocationForm(employeeId, 'endDate', event.target.value)} error={errors.endDate} />
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
        <div className="space-y-4">
          <div><p className="text-xs text-ink-400">Current End Date</p><p className="mt-1 text-sm font-medium">{formatDate(extendTarget?.endDate)}</p></div>
          <Input label="New End Date" required type="date" min={extendTarget ? addDaysToDate(extendTarget.endDate, 1) : undefined} max={project?.endDate} value={extendEndDate} onChange={(event) => { setExtendEndDate(event.target.value); setExtendError(undefined) }} error={extendError} />
          <p className="text-xs text-ink-500">Capacity will be validated for the extension period.</p>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(percentageTarget)}
        onClose={() => !isUpdatingPercentage && setPercentageTarget(null)}
        title="Update Allocation Percentage"
        description={percentageTarget ? `Update the allocation percentage for ${percentageTarget.employeeName} on ${project?.name}.` : undefined}
        size="sm"
        footer={<><Button variant="ghost" onClick={() => setPercentageTarget(null)} disabled={isUpdatingPercentage}>Cancel</Button><Button leftIcon={<Percent className="h-4 w-4" />} onClick={submitPercentage} isLoading={isUpdatingPercentage}>Save</Button></>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-xs text-ink-400">Current Percentage</p><p className="font-medium">{percentageTarget?.allocationPercentage}%</p></div>
            <div><p className="text-xs text-ink-400">Allocation Period</p><p className="font-medium">{formatDate(percentageTarget?.startDate)} – {formatDate(percentageTarget?.endDate)}</p></div>
          </div>
          <Input label="New Allocation Percentage" required type="number" min="1" max="100" value={percentageValue} onChange={(event) => { setPercentageValue(event.target.value); setPercentageError(undefined) }} error={percentageError} />
          <Input label="Effective Date" required type="date" min={percentageTarget?.startDate} max={percentageTarget?.endDate} value={percentageEffectiveDate} onChange={(event) => { setPercentageEffectiveDate(event.target.value); setPercentageError(undefined) }} />
          <p className="text-xs text-ink-500">For active allocations, changes take effect from the selected date and previous allocation history is preserved.</p>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(roleTarget)}
        onClose={() => !isUpdatingRole && setRoleTarget(null)}
        title="Update Project Role"
        description={roleTarget ? `Change the Project role for ${roleTarget.employeeName}.` : undefined}
        size="sm"
        footer={<><Button variant="ghost" onClick={() => setRoleTarget(null)} disabled={isUpdatingRole}>Cancel</Button><Button leftIcon={<Repeat2 className="h-4 w-4" />} onClick={submitRoleUpdate} isLoading={isUpdatingRole}>Save</Button></>}
      >
        <div className="space-y-4">
          <div><p className="text-xs text-ink-400">Current Role</p><p className="mt-1 text-sm font-medium">{roleTarget?.roleName}</p></div>
          <Dropdown label="New Role" required value={newRoleId} options={roleOptions} onChange={(event) => { setNewRoleId(event.target.value); setRoleError(undefined) }} />
          <Input label="Effective Date" required type="date" min={roleTarget?.startDate} max={roleTarget?.endDate} value={roleEffectiveDate} onChange={(event) => { setRoleEffectiveDate(event.target.value); setRoleError(undefined) }} error={roleError} />
          <p className="text-xs text-ink-500">For active allocations, the current role will remain in history and the new role will begin on the effective date.</p>
        </div>
      </Modal>

      <Modal
        isOpen={deallocationTargets.length > 0}
        onClose={() => !isDeallocating && setDeallocationTargets([])}
        title={deallocationTargets.length > 1 ? 'Bulk Deallocation' : 'Deallocate Employee'}
        description={project ? `Deallocate ${deallocationTargets.length} employee${deallocationTargets.length === 1 ? '' : 's'} from ${project.name}.` : undefined}
        size="sm"
        footer={<><Button variant="ghost" onClick={() => setDeallocationTargets([])} disabled={isDeallocating}>Cancel</Button><Button variant="danger" leftIcon={<UserMinus className="h-4 w-4" />} onClick={submitDeallocation} isLoading={isDeallocating}>Deallocate</Button></>}
      >
        <div className="space-y-4">
          <Input label="Effective Deallocation Date" required type="date" value={deallocationEffectiveDate} onChange={(event) => { setDeallocationEffectiveDate(event.target.value); setDeallocationError(undefined) }} error={deallocationError} />
          <Input label="Reason" value={deallocationReason} onChange={(event) => setDeallocationReason(event.target.value)} placeholder="Reason for deallocation" />
          <p className="text-xs text-ink-500">{deallocationTargets.every((item) => item.status === 'SCHEDULED') ? 'This future allocation will be cancelled.' : 'The employee will be released from the selected effective date while prior allocation history is preserved.'}</p>
        </div>
      </Modal>
    </div>
  )
}
