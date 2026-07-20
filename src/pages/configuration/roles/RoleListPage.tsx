import React, { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Edit, Eye, Plus, Power, Search as SearchIcon, Trash2, X } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Table, TableColumn } from '@/components/common/Table'
import { Pagination } from '@/components/common/Pagination'
import { Input } from '@/components/common/Input'
import { Filter } from '@/components/common/Filter'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { usePagination } from '@/hooks/usePagination'
import { roleService } from '@/services/roleService'
import { RoleRecord, RoleStatus } from '@/types/role'
import { ROLE_TYPE_OPTIONS, formatRoleType } from '@/constants/roleTypes'
import { formatDate } from '@/utils/format'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/context/ToastContext'
import { useConfirm } from '@/context/ConfirmContext'
import { PRIV } from '@/constants/privileges'
import { ROUTES } from '@/constants/routes'

const STATUS_OPTIONS = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
]

const statusLabel = (status: RoleStatus) => (status === 'ACTIVE' ? 'Active' : 'Inactive')

export const RoleListPage: React.FC = () => {
  const navigate = useNavigate()
  const { hasPrivilege } = useAuth()
  const toast = useToast()
  const confirm = useConfirm()
  const [searchText, setSearchText] = useState('')
  const [roleType, setRoleType] = useState('All')
  const [status, setStatus] = useState('All')

  const fetcher = useCallback((req: Parameters<typeof roleService.getRoles>[0]) => roleService.getRoles(req), [])
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
  } = usePagination<RoleRecord>({
    fetcher,
    initialPageSize: 10,
    initialSortBy: 'name',
    filters: { roleType, status },
  })

  const handleSearch = () => setSearch(searchText)

  const handleClearFilters = () => {
    setSearchText('')
    setSearch('')
    setRoleType('All')
    setStatus('All')
  }

  const handleStatusChange = async (role: RoleRecord) => {
    const nextStatus: RoleStatus = role.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    const result = await roleService.updateRoleStatus(role.id, nextStatus)
    if (result.success) {
      toast.success(result.message)
      reload()
    } else {
      toast.error(result.message)
    }
  }

  const handleDelete = async (role: RoleRecord) => {
    const ok = await confirm({
      title: 'Delete Role',
      message: `Are you sure you want to delete ${role.name}? This action cannot be undone.`,
      variant: 'danger',
      confirmText: 'Delete',
    })
    if (!ok) return

    const result = await roleService.deleteRole(role.id)
    if (result.success) {
      toast.success(result.message)
      reload()
    } else {
      toast.error(result.message)
    }
  }

  const columns: TableColumn<RoleRecord>[] = [
    {
      key: 'name',
      header: 'Role Name',
      sortable: true,
      render: (role) => <span className="font-medium text-ink-900">{role.name}</span>,
    },
    {
      key: 'roleType',
      header: 'Role Type',
      sortable: true,
      render: (role) => <Badge tone="info">{formatRoleType(role.roleType)}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (role) => (
        <Badge tone={role.status === 'ACTIVE' ? 'success' : 'neutral'} dot>
          {statusLabel(role.status)}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created Date',
      sortable: true,
      align: 'right',
      render: (role) => <span className="text-ink-600">{formatDate(role.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      render: (role) => (
        <div className="flex items-center justify-center gap-1">
          {hasPrivilege(PRIV.ROLE_VIEW) && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                navigate(ROUTES.ROLE_DETAIL.replace(':id', role.id))
              }}
              className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
              title="View role"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
          {hasPrivilege(PRIV.ROLE_UPDATE) && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                navigate(ROUTES.ROLE_EDIT.replace(':id', role.id))
              }}
              className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-brand-600"
              title="Edit role"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
          {hasPrivilege(PRIV.ROLE_STATUS_CHANGE) && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                handleStatusChange(role)
              }}
              className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-amber-600"
              title={role.status === 'ACTIVE' ? 'Deactivate role' : 'Activate role'}
            >
              <Power className="h-4 w-4" />
            </button>
          )}
          {hasPrivilege(PRIV.ROLE_DELETE) && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                handleDelete(role)
              }}
              className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-signal-critical"
              title="Delete role"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Role Management"
        description="Manage RBAC roles used to grant system access permissions."
        actions={
          hasPrivilege(PRIV.ROLE_CREATE) ? (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate(ROUTES.ROLE_CREATE)}>
              Create Role
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="w-full sm:w-72">
            <Input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleSearch()
              }}
              placeholder="Search by role name..."
              leftIcon={<SearchIcon className="h-4 w-4" />}
            />
          </div>
          <Button variant="secondary" onClick={handleSearch} leftIcon={<SearchIcon className="h-4 w-4" />}>
            Search
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Filter label="Role Type" value={roleType} options={ROLE_TYPE_OPTIONS} onChange={setRoleType} />
          <Filter label="Status" value={status} options={STATUS_OPTIONS} onChange={setStatus} />
          <Button
            variant="filterClear"
            size="sm"
            onClick={handleClearFilters}
            leftIcon={<X className="h-4 w-4" />}
            disabled={!search && !searchText && roleType === 'All' && status === 'All'}
          >
            Clear Filters
          </Button>
        </div>
      </div>

      <div>
        <Table
          columns={columns}
          rows={page?.content ?? []}
          rowKey={(role) => role.id}
          isLoading={isLoading}
          error={error}
          onRetry={reload}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={(key) => {
            if (key === 'actions') return
            if (sortBy === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
            else {
              setSortBy(key)
              setSortDir('asc')
            }
          }}
          onRowClick={hasPrivilege(PRIV.ROLE_VIEW) ? (role) => navigate(ROUTES.ROLE_DETAIL.replace(':id', role.id)) : undefined}
          emptyTitle="No roles found"
          emptyDescription="Try adjusting your search term or filters."
        />
        <Pagination page={page} onPageChange={setPageNumber} onPageSizeChange={setPageSize} />
      </div>
    </div>
  )
}
