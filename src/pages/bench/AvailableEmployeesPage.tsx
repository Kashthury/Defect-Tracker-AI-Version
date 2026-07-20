import React, { useCallback, useEffect, useState } from 'react'
import { Eye, X } from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Filter } from '@/components/common/Filter'
import { Modal } from '@/components/common/Modal'
import { Pagination } from '@/components/common/Pagination'
import { Search } from '@/components/common/Search'
import { Table, TableColumn } from '@/components/common/Table'
import { PageHeader } from '@/components/layout/PageHeader'
import { usePagination } from '@/hooks/usePagination'
import { designationService } from '@/services/designationService'
import { projectAllocationService } from '@/services/projectAllocationService'
import { AvailableEmployee } from '@/types/project'
import { formatDate } from '@/utils/format'

const AVAILABILITY_OPTIONS = [
  { label: 'Fully Available', value: 'AVAILABLE' },
  { label: 'Partially Available', value: 'PARTIAL' },
]

export const AvailableEmployeesPage: React.FC = () => {
  const [designationId, setDesignationId] = useState('All')
  const [availabilityBand, setAvailabilityBand] = useState('All')
  const [designationOptions, setDesignationOptions] = useState<{ label: string; value: string }[]>([])
  const [detailEmployee, setDetailEmployee] = useState<AvailableEmployee | null>(null)

  useEffect(() => {
    designationService.getDesignations({ pageNumber: 0, pageSize: 100, sortBy: 'title' }).then((result) => {
      if (result.success) {
        setDesignationOptions(result.data.content.map((item) => ({ label: item.title, value: item.id })))
      }
    })
  }, [])

  const fetcher = useCallback(
    (request: Parameters<typeof projectAllocationService.getAvailableEmployees>[0]) =>
      projectAllocationService.getAvailableEmployees(request),
    [],
  )
  const {
    page,
    isLoading,
    error,
    search,
    sortBy,
    sortDir,
    setPageNumber,
    setPageSize,
    setSearch,
    setSortBy,
    setSortDir,
    reload,
  } = usePagination<AvailableEmployee>({
    fetcher,
    initialPageSize: 10,
    initialSortBy: 'employeeName',
    filters: { designationId, availabilityBand },
  })

  const columns: TableColumn<AvailableEmployee>[] = [
    {
      key: 'employeeName',
      header: 'Employee',
      sortable: true,
      render: (employee) => (
        <div>
          <p className="font-medium text-ink-800">{employee.employeeName}</p>
          <p className="mt-0.5 text-xs text-ink-400">{employee.email}</p>
        </div>
      ),
    },
    { key: 'designationName', header: 'Designation', sortable: true, render: (employee) => employee.designationName },
    {
      key: 'currentAllocationPercentage',
      header: 'Current Allocation',
      sortable: true,
      render: (employee) => (
        <div className="min-w-32">
          <div className="mb-1 flex justify-between text-xs"><span>{employee.currentAllocationPercentage}% allocated</span><span className="font-medium text-signal-low">{employee.availablePercentage}% available</span></div>
          <div className="h-1.5 overflow-hidden rounded-full bg-ink-100"><div className="h-full bg-brand-500" style={{ width: `${employee.currentAllocationPercentage}%` }} /></div>
        </div>
      ),
    },
    {
      key: 'currentProjects',
      header: 'Current Projects',
      render: (employee) => employee.currentProjects.length > 0
        ? <div className="flex max-w-60 flex-wrap gap-1">{employee.currentProjects.map((project) => <Badge key={project} tone="neutral">{project}</Badge>)}</div>
        : <span className="text-ink-400">None</span>,
    },
    {
      key: 'currentRoles',
      header: 'Current Roles',
      render: (employee) => employee.currentRoles.length > 0 ? employee.currentRoles.join(', ') : <span className="text-ink-400">None</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (employee) => (
        <button type="button" title="View employee details" onClick={() => setDetailEmployee(employee)} className="rounded p-1.5 text-ink-400 hover:bg-ink-100 hover:text-brand-600">
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ]

  const clearFilters = () => {
    setSearch('')
    setDesignationId('All')
    setAvailabilityBand('All')
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Available Employees" description="Review available capacity, active project assignments, and current project roles." />

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-ink-200 bg-white p-4 shadow-panel">
        <Search value={search} onChange={setSearch} placeholder="Search employees..." />
        <Filter label="Designation" value={designationId} options={designationOptions} onChange={setDesignationId} />
        <Filter label="Availability" value={availabilityBand} options={AVAILABILITY_OPTIONS} onChange={setAvailabilityBand} />
        <Button variant="filterClear" size="sm" leftIcon={<X className="h-4 w-4" />} onClick={clearFilters} disabled={!search && designationId === 'All' && availabilityBand === 'All'}>Clear Filters</Button>
      </div>

      <Table
        columns={columns}
        rows={page?.content ?? []}
        rowKey={(employee) => employee.employeeId}
        isLoading={isLoading}
        error={error}
        onRetry={reload}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={(key) => {
          if (sortBy === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
          else {
            setSortBy(key)
            setSortDir('asc')
          }
        }}
        emptyTitle="No available employees found"
        emptyDescription="Try adjusting the search or availability filters."
      />
      <Pagination page={page} onPageChange={setPageNumber} onPageSizeChange={setPageSize} />

      <Modal isOpen={Boolean(detailEmployee)} onClose={() => setDetailEmployee(null)} title="Employee Details" size="md">
        {detailEmployee && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div><p className="text-xs text-ink-400">Employee Name</p><p className="mt-1 text-sm font-medium text-ink-800">{detailEmployee.employeeName}</p></div>
            <div><p className="text-xs text-ink-400">Designation</p><p className="mt-1 text-sm font-medium text-ink-800">{detailEmployee.designationName}</p></div>
            <div><p className="text-xs text-ink-400">Email</p><p className="mt-1 break-all text-sm text-ink-700">{detailEmployee.email}</p></div>
            <div><p className="text-xs text-ink-400">Phone</p><p className="mt-1 text-sm text-ink-700">{detailEmployee.phone}</p></div>
            <div><p className="text-xs text-ink-400">Join Date</p><p className="mt-1 text-sm text-ink-700">{formatDate(detailEmployee.joinDate)}</p></div>
            <div><p className="text-xs text-ink-400">Available Capacity</p><p className="mt-1 text-sm font-medium text-signal-low">{detailEmployee.availablePercentage}%</p></div>
            <div className="sm:col-span-2"><p className="text-xs text-ink-400">Current Projects</p><p className="mt-1 text-sm text-ink-700">{detailEmployee.currentProjects.join(', ') || 'No current projects'}</p></div>
            <div className="sm:col-span-2"><p className="text-xs text-ink-400">Current Roles</p><p className="mt-1 text-sm text-ink-700">{detailEmployee.currentRoles.join(', ') || 'No current roles'}</p></div>
          </div>
        )}
      </Modal>
    </div>
  )
}
