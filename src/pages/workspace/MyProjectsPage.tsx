import React, { useCallback } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Table, TableColumn } from '@/components/common/Table'
import { Pagination } from '@/components/common/Pagination'
import { Search } from '@/components/common/Search'
import { Badge } from '@/components/common/Badge'
import { usePagination } from '@/hooks/usePagination'
import { projectService } from '@/services/projectService'
import { Project } from '@/types/project'
import { formatDate, formatNumber } from '@/utils/format'

export const MyProjectsPage: React.FC = () => {
  const fetcher = useCallback((req: Parameters<typeof projectService.getMyProjects>[0]) => projectService.getMyProjects(req), [])
  const { page, isLoading, error, search, sortBy, sortDir, setPageNumber, setPageSize, setSearch, setSortBy, setSortDir, reload } =
    usePagination<Project>({ fetcher, initialPageSize: 10 })

  const columns: TableColumn<Project>[] = [
    { key: 'code', header: 'Code', sortable: true, render: (r) => <span className="font-mono text-xs font-semibold text-brand-600">{r.code}</span>, width: '90px' },
    { key: 'name', header: 'Project', sortable: true, render: (r) => <span className="font-medium text-ink-800">{r.name}</span> },
    { key: 'managerName', header: 'Manager', sortable: true, render: (r) => r.managerName },
    { key: 'status', header: 'Status', sortable: true, render: (r) => <Badge tone={r.status === 'ACTIVE' ? 'success' : 'neutral'}>{r.status === 'ACTIVE' ? 'Active' : 'Inactive'}</Badge> },
    { key: 'openDefects', header: 'Open Defects', sortable: true, render: (r) => formatNumber(r.openDefects), align: 'right' },
    { key: 'endDate', header: 'Target End', sortable: true, render: (r) => formatDate(r.endDate), align: 'right' },
  ]

  return (
    <div>
      <PageHeader title="My Projects" description="Projects you're currently allocated to." />
      <div className="mb-4">
        <Search value={search} onChange={setSearch} placeholder="Search by project name or manager..." />
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
        emptyTitle="No projects assigned yet"
      />
      <Pagination page={page} onPageChange={setPageNumber} onPageSizeChange={setPageSize} />
    </div>
  )
}
