import React, { useCallback } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Table, TableColumn } from '@/components/common/Table'
import { Pagination } from '@/components/common/Pagination'
import { Search } from '@/components/common/Search'
import { Badge } from '@/components/common/Badge'
import { usePagination } from '@/hooks/usePagination'
import { projectService } from '@/services/projectService'
import { AllocationHistoryEntry } from '@/types/project'
import { formatDate } from '@/utils/format'
import { ProjectModuleGate } from '@/components/projects/ProjectSelectionGate'
import { ProjectSelector } from '@/components/projects/ProjectSelector'
import { useProjectScope } from '@/hooks/useProjectScope'

export const AllocationHistoryPage: React.FC = () => {
  const { projectId, isProjectRoute } = useProjectScope()
  const fetcher = useCallback(
    (req: Parameters<typeof projectService.getAllocationHistory>[0]) => projectService.getAllocationHistory(req),
    [],
  )
  const { page, isLoading, error, search, sortBy, sortDir, setPageNumber, setPageSize, setSearch, setSortBy, setSortDir, reload } =
    usePagination<AllocationHistoryEntry>({ fetcher, initialPageSize: 10, filters: { projectId }, enabled: Boolean(projectId) })

  const columns: TableColumn<AllocationHistoryEntry>[] = [
    { key: 'employeeName', header: 'Employee', sortable: true, render: (r) => <span className="font-medium text-ink-800">{r.employeeName}</span> },
    { key: 'roleOnProject', header: 'Role on Project', sortable: true, render: (r) => r.roleOnProject },
    { key: 'allocationPercentage', header: 'Allocation', sortable: true, render: (r) => <Badge tone="info">{r.allocationPercentage}%</Badge>, align: 'right' },
    { key: 'allocatedFrom', header: 'From', sortable: true, render: (r) => formatDate(r.allocatedFrom), align: 'right' },
    { key: 'allocatedTo', header: 'To', sortable: true, render: (r) => (r.allocatedTo ? formatDate(r.allocatedTo) : <Badge tone="success">Ongoing</Badge>), align: 'right' },
  ]

  const allocationContent = (
    <>
      <div className="mb-4">
        <Search value={search} onChange={setSearch} placeholder="Search by employee or role..." />
      </div>
      <Table
        columns={columns}
        rows={page?.content ?? []}
        rowKey={(r) => r.id}
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
        emptyTitle="No allocation records match your search"
      />
      <Pagination page={page} onPageChange={setPageNumber} onPageSizeChange={setPageSize} />
    </>
  )

  return (
    <div>
      <PageHeader
        title="Allocation History"
        description="Historical and current resource allocations for the selected project."
        actions={!isProjectRoute ? <ProjectSelector /> : undefined}
      />
      <ProjectModuleGate isProjectRoute={isProjectRoute}>{allocationContent}</ProjectModuleGate>
    </div>
  )
}
