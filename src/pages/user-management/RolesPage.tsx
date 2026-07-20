import React, { useCallback } from 'react'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Table, TableColumn } from '@/components/common/Table'
import { Pagination } from '@/components/common/Pagination'
import { Search } from '@/components/common/Search'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { usePagination } from '@/hooks/usePagination'
import { userService } from '@/services/userService'
import { Role } from '@/types/auth'
import { mockPrivileges } from '@/mock/privileges'
import { useAuth } from '@/hooks/useAuth'
import { PRIV } from '@/constants/privileges'

export const RolesPage: React.FC = () => {
  const { hasPrivilege } = useAuth()
  const fetcher = useCallback((req: Parameters<typeof userService.getRoles>[0]) => userService.getRoles(req), [])
  const { page, isLoading, error, search, sortBy, sortDir, setPageNumber, setPageSize, setSearch, setSortBy, setSortDir, reload } =
    usePagination<Role>({ fetcher, initialPageSize: 10 })

  const columns: TableColumn<Role>[] = [
    { key: 'name', header: 'Role', sortable: true, render: (r) => <span className="font-medium text-ink-800">{r.name}</span> },
    { key: 'description', header: 'Description', render: (r) => <span className="text-ink-500">{r.description}</span> },
    {
      key: 'privilegeIds',
      header: 'Privileges',
      sortable: true,
      render: (r) =>
        r.privilegeIds.length === mockPrivileges.length ? (
          <Badge tone="critical">All ({r.privilegeIds.length})</Badge>
        ) : (
          <Badge tone="info">{r.privilegeIds.length} of {mockPrivileges.length}</Badge>
        ),
      align: 'right',
    },
  ]

  return (
    <div>
      <PageHeader
        title="Roles"
        description="Roles bundle privileges together for quick assignment to employees."
        actions={hasPrivilege(PRIV.ROLE_MANAGE) ? <Button leftIcon={<Plus className="h-4 w-4" />}>New Role</Button> : undefined}
      />
      <div className="mb-4">
        <Search value={search} onChange={setSearch} placeholder="Search by role name..." />
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
        emptyTitle="No roles match your search"
      />
      <Pagination page={page} onPageChange={setPageNumber} onPageSizeChange={setPageSize} />
    </div>
  )
}
