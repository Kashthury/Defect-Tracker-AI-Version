import React, { useCallback, useEffect, useState } from 'react'
import { Eye, X } from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Filter } from '@/components/common/Filter'
import { Input } from '@/components/common/Input'
import { Modal } from '@/components/common/Modal'
import { Pagination } from '@/components/common/Pagination'
import { Search } from '@/components/common/Search'
import { Table, TableColumn } from '@/components/common/Table'
import { PageHeader } from '@/components/layout/PageHeader'
import { usePagination } from '@/hooks/usePagination'
import { designationService } from '@/services/designationService'
import { projectAllocationService } from '@/services/projectAllocationService'
import { AvailableEmployee } from '@/types/project'
import { getAllocationStatusTone } from '@/utils/allocation'
import { getTodayDateString, isDateRangeValid } from '@/utils/date'
import { formatDate } from '@/utils/format'

const AVAILABILITY_OPTIONS = [
  { label: 'Fully Available', value: 'FULLY_AVAILABLE' },
  { label: 'Partially Available', value: 'PARTIALLY_AVAILABLE' },
]

export const AvailableEmployeesPage: React.FC = () => {
  const today = getTodayDateString()
  const [designationId, setDesignationId] = useState('All')
  const [availabilityBand, setAvailabilityBand] = useState('All')
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [designationOptions, setDesignationOptions] = useState<{ label: string; value: string }[]>([])
  const [detailEmployee, setDetailEmployee] = useState<AvailableEmployee | null>(null)
  const dateRangeValid = isDateRangeValid(startDate, endDate)
  const startDateError = startDate ? undefined : 'Start Date is required.'
  const endDateError = !endDate ? 'End Date is required.' : startDate && endDate < startDate ? 'End Date cannot be earlier than Start Date.' : undefined

  useEffect(() => {
    designationService.getDesignations({ pageNumber: 0, pageSize: 100, sortBy: 'title', filters: { active: true } }).then((result) => {
      if (result.success) setDesignationOptions(result.data.content.map((item) => ({ label: item.title, value: item.id })))
    })
  }, [])

  const fetcher = useCallback(
    (request: Parameters<typeof projectAllocationService.getAvailableEmployees>[0]) =>
      projectAllocationService.getAvailableEmployees(request),
    [],
  )
  const pagination = usePagination<AvailableEmployee>({
    fetcher,
    initialPageSize: 10,
    initialSortBy: 'employeeName',
    filters: { designationId, availabilityBand, startDate, endDate },
    enabled: dateRangeValid,
  })
  const { page, isLoading, error, search, sortBy, sortDir, setPageNumber, setPageSize, setSearch, setSortBy, setSortDir, reload } = pagination

  useEffect(() => {
    if (detailEmployee && !page?.content.some((employee) => employee.employeeId === detailEmployee.employeeId)) setDetailEmployee(null)
  }, [detailEmployee, page])

  const allocationSummary = (employee: AvailableEmployee) => (
    employee.allocations.length ? (
      <div className="min-w-48 space-y-1">
        {employee.allocations.slice(0, 2).map((allocation) => (
          <div key={allocation.allocationId} className="text-xs">
            <p className="font-medium text-ink-700">{allocation.projectName}</p>
            <p className="text-ink-400">{allocation.roleName} · {allocation.allocationPercentage}%</p>
          </div>
        ))}
        {employee.allocations.length > 2 && <p className="text-xs font-medium text-brand-600">+{employee.allocations.length - 2} more</p>}
      </div>
    ) : <span className="text-ink-400">None</span>
  )

  const columns: TableColumn<AvailableEmployee>[] = [
    { key: 'employeeName', header: 'Employee', sortable: true, render: (employee) => <div><p className="font-medium text-ink-800">{employee.employeeName}</p>{employee.employeeCode && <p className="text-xs font-medium text-brand-600">{employee.employeeCode}</p>}<p className="text-xs text-ink-400">{employee.email}</p></div> },
    { key: 'designationName', header: 'Designation', sortable: true, render: (employee) => employee.designationName },
    { key: 'allocatedPercentage', header: 'Allocated Capacity', sortable: true, render: (employee) => { const visual = Math.min(100, Math.max(0, employee.allocatedPercentage)); return <div className="min-w-32"><p className="mb-1 text-xs">{employee.allocatedPercentage}%</p><div className="h-1.5 overflow-hidden rounded-full bg-ink-100"><div className="h-full bg-brand-500" style={{ width: `${visual}%` }} /></div></div> } },
    { key: 'availablePercentage', header: 'Available Capacity', sortable: true, render: (employee) => <div><p className="font-medium text-signal-low">{employee.availablePercentage}%</p><Badge tone={employee.availablePercentage === 100 ? 'success' : 'info'}>{employee.availablePercentage === 100 ? 'Fully Available' : 'Partially Available'}</Badge></div> },
    { key: 'allocations', header: 'Allocation Summary', render: allocationSummary },
    { key: 'actions', header: 'Actions', align: 'right', render: (employee) => <button type="button" title="View employee details" aria-label={`View ${employee.employeeName} details`} onClick={() => setDetailEmployee(employee)} className="rounded p-1.5 text-ink-400 hover:bg-ink-100 hover:text-brand-600"><Eye className="h-4 w-4" /></button> },
  ]

  const clearFilters = () => {
    setSearch('')
    setDesignationId('All')
    setAvailabilityBand('All')
    setStartDate(today)
    setEndDate(today)
    setPageNumber(0)
    setDetailEmployee(null)
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Available Employees" description="Review guaranteed employee capacity for a current or future date range." />
      <div className="flex flex-wrap items-start gap-2 rounded-lg border border-ink-200 bg-white p-4 shadow-panel">
        <Search value={search} onChange={setSearch} placeholder="Search employees..." />
        <Filter label="Designation" value={designationId} options={designationOptions} onChange={setDesignationId} />
        <Filter label="Availability" value={availabilityBand} options={AVAILABILITY_OPTIONS} onChange={setAvailabilityBand} />
        <Input label="Start Date" type="date" required value={startDate} error={startDateError} onChange={(event) => { setStartDate(event.target.value); setPageNumber(0); setDetailEmployee(null) }} />
        <Input label="End Date" type="date" required value={endDate} error={endDateError} onChange={(event) => { setEndDate(event.target.value); setPageNumber(0); setDetailEmployee(null) }} />
        <div className="pt-[26px]"><Button variant="filterClear" size="sm" leftIcon={<X className="h-4 w-4" />} onClick={clearFilters} disabled={!search && designationId === 'All' && availabilityBand === 'All' && startDate === today && endDate === today}>Clear Filters</Button></div>
      </div>

      {!dateRangeValid ? (
        <div className="rounded-lg border border-ink-200 bg-white p-10 text-center text-sm text-ink-500">Select a valid date range to review employee availability.</div>
      ) : (
        <>
          <Table columns={columns} rows={page?.content ?? []} rowKey={(employee) => employee.employeeId} isLoading={isLoading} error={error} onRetry={reload} sortBy={sortBy} sortDir={sortDir} onSort={(key) => { if (sortBy === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); else { setSortBy(key); setSortDir('asc') } }} emptyTitle="No available employees found for this period." emptyDescription="Try adjusting the date range, designation or availability filter." />
          <Pagination page={page} onPageChange={setPageNumber} onPageSizeChange={setPageSize} />
        </>
      )}

      <Modal isOpen={Boolean(detailEmployee)} onClose={() => setDetailEmployee(null)} title="Employee Availability Details" size="lg">
        {detailEmployee && <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div><p className="text-xs text-ink-400">Employee Name</p><p className="mt-1 text-sm font-medium text-ink-800">{detailEmployee.employeeName}</p></div>
            <div><p className="text-xs text-ink-400">Employee Code</p><p className="mt-1 text-sm text-ink-700">{detailEmployee.employeeCode || 'Not provided'}</p></div>
            <div><p className="text-xs text-ink-400">Designation</p><p className="mt-1 text-sm text-ink-700">{detailEmployee.designationName}</p></div>
            <div><p className="text-xs text-ink-400">Email</p><p className="mt-1 break-all text-sm text-ink-700">{detailEmployee.email}</p></div>
            <div><p className="text-xs text-ink-400">Phone</p><p className="mt-1 text-sm text-ink-700">{detailEmployee.phone || 'Not provided'}</p></div>
            <div><p className="text-xs text-ink-400">Join Date</p><p className="mt-1 text-sm text-ink-700">{formatDate(detailEmployee.joinDate)}</p></div>
            <div><p className="text-xs text-ink-400">Selected Start Date</p><p className="mt-1 text-sm text-ink-700">{formatDate(startDate)}</p></div>
            <div><p className="text-xs text-ink-400">Selected End Date</p><p className="mt-1 text-sm text-ink-700">{formatDate(endDate)}</p></div>
            <div><p className="text-xs text-ink-400">Allocated / Available</p><p className="mt-1 text-sm text-ink-700">{detailEmployee.allocatedPercentage}% / {detailEmployee.availablePercentage}%</p></div>
          </div>
          <div className="overflow-x-auto"><p className="mb-2 text-sm font-semibold text-ink-800">Overlapping Allocations</p>{detailEmployee.allocations.length === 0 ? <p className="text-sm text-ink-500">No overlapping allocations for the selected period.</p> : <table className="w-full min-w-[640px] text-left text-sm"><thead><tr className="border-b border-ink-200 text-xs text-ink-500"><th className="py-2">Project</th><th>Role</th><th>Allocation</th><th>Start</th><th>End</th><th>Status</th></tr></thead><tbody>{detailEmployee.allocations.map((allocation) => <tr key={allocation.allocationId} className="border-b border-ink-100"><td className="py-2 font-medium">{allocation.projectName}</td><td>{allocation.roleName}</td><td>{allocation.allocationPercentage}%</td><td>{formatDate(allocation.startDate)}</td><td>{formatDate(allocation.endDate)}</td><td><Badge tone={getAllocationStatusTone(allocation.status)}>{allocation.status}</Badge></td></tr>)}</tbody></table>}</div>
        </div>}
      </Modal>
    </div>
  )
}
