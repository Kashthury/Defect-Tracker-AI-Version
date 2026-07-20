import React, { useCallback, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Table, TableColumn } from '@/components/common/Table'
import { Pagination } from '@/components/common/Pagination'
import { Search } from '@/components/common/Search'
import { Filter } from '@/components/common/Filter'
import { Badge } from '@/components/common/Badge'
import { usePagination } from '@/hooks/usePagination'
import { userService } from '@/services/userService'
import { Privilege } from '@/types/auth'
import { mockPrivileges } from '@/mock/privileges'

const MODULE_OPTIONS = Array.from(new Set(mockPrivileges.map((p) => p.module))).map((m) => ({ label: m, value: m }))

export const PrivilegesPage: React.FC = () => {
  const [module, setModule] = useState('All')
  const fetcher = useCallback((req: Parameters<typeof userService.getPrivileges>[0]) => userService.getPrivileges(req), [])
  const { page, isLoading, error, search, sortBy, sortDir, setPageNumber, setPageSize, setSearch, setSortBy, setSortDir, reload } =
    usePagination<Privilege>({ fetcher, initialPageSize: 25, filters: { module } })

  const columns: TableColumn<Privilege>[] = [
    { key: 'code', header: 'Code', sortable: true, render: (r) => <span className="font-mono text-xs font-medium text-brand-600">{r.code}</span> },
    { key: 'module', header: 'Module', sortable: true, render: (r) => <Badge tone="neutral">{r.module}</Badge> },
    { key: 'action', header: 'Action', sortable: true, render: (r) => r.action },
    { key: 'description', header: 'Description', render: (r) => <span className="text-ink-500">{r.description}</span> },
  ]

  return (
    <div>
      <PageHeader title="Privileges" description="The full catalogue of grantable permissions available to roles." />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Search value={search} onChange={setSearch} placeholder="Search by code or description..." />
        <Filter label="Module" value={module} options={MODULE_OPTIONS} onChange={setModule} />
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
        emptyTitle="No privileges match your filters"
      />
      <Pagination page={page} onPageChange={setPageNumber} onPageSizeChange={setPageSize} />
    </div>
  )
}
