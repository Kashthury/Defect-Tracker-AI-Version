import React, { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Plus, Search as SearchIcon, Trash2, X } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { Pagination } from '@/components/common/Pagination'
import { Table, TableColumn } from '@/components/common/Table'
import { PageHeader } from '@/components/layout/PageHeader'
import { PRIV } from '@/constants/privileges'
import { ROUTES } from '@/constants/routes'
import { useConfirm } from '@/context/ConfirmContext'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/hooks/useAuth'
import { usePagination } from '@/hooks/usePagination'
import { statusTypeService } from '@/services/statusTypeService'
import { StatusTypeRecord } from '@/types/statusType'
import { formatDate } from '@/utils/format'

export const StatusTypeListPage: React.FC = () => {
  const navigate = useNavigate()
  const { hasPrivilege } = useAuth()
  const toast = useToast()
  const confirm = useConfirm()
  const [searchText, setSearchText] = useState('')

  const fetcher = useCallback(
    (request: Parameters<typeof statusTypeService.getStatusTypes>[0]) =>
      statusTypeService.getStatusTypes(request),
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
  } = usePagination<StatusTypeRecord>({
    fetcher,
    initialPageSize: 10,
    initialSortBy: 'name',
  })

  const handleSearch = () => setSearch(searchText)

  const handleClear = () => {
    setSearchText('')
    setSearch('')
  }

  const handleDelete = async (status: StatusTypeRecord) => {
    const confirmed = await confirm({
      title: 'Delete Status Type',
      message: `Are you sure you want to delete ${status.name}? This action cannot be undone.`,
      variant: 'danger',
      confirmText: 'Delete',
    })
    if (!confirmed) return

    const result = await statusTypeService.deleteStatusType(status.id)
    if (result.success) {
      toast.success(result.message)
      reload()
    } else {
      toast.error(result.message)
    }
  }

  const columns: TableColumn<StatusTypeRecord>[] = [
    {
      key: 'name',
      header: 'Status Name',
      sortable: true,
      render: (status) => <span className="font-medium text-ink-900">{status.name}</span>,
    },
    {
      key: 'code',
      header: 'Enum Code',
      sortable: true,
      render: (status) => (
        <span className="font-mono text-xs font-medium text-ink-600">{status.code}</span>
      ),
    },
    {
      key: 'color',
      header: 'Color Preview',
      render: (status) => (
        <div className="flex items-center gap-2.5">
          <span
            className="h-5 w-5 shrink-0 rounded border border-black/10 shadow-sm"
            style={{ backgroundColor: status.color }}
            aria-label={`${status.name} color ${status.color}`}
          />
          <span className="font-mono text-xs uppercase text-ink-600">{status.color}</span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created Date',
      sortable: true,
      align: 'right',
      render: (status) => <span className="text-ink-600">{formatDate(status.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      render: (status) => (
        <div className="flex items-center justify-center gap-1">
          {hasPrivilege(PRIV.STATUS_TYPE_UPDATE) && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                navigate(ROUTES.STATUS_TYPE_EDIT.replace(':id', status.id))
              }}
              className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-brand-600"
              title="Edit status type"
              aria-label={`Edit ${status.name}`}
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
          {hasPrivilege(PRIV.STATUS_TYPE_DELETE) && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                handleDelete(status)
              }}
              className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-signal-critical"
              title="Delete status type"
              aria-label={`Delete ${status.name}`}
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
      <button type="button" onClick={() => navigate(ROUTES.STATUS)} className="flex w-fit items-center gap-2 text-sm font-medium text-ink-500 transition-colors hover:text-brand-600"><ArrowLeft className="h-4 w-4" /> Back to Status</button>
      <PageHeader
        title="Status Type"
        description="Manage controlled status names and colors used across records, workflows, filters, and reports."
        actions={
          hasPrivilege(PRIV.STATUS_TYPE_CREATE) ? (
            <Button
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => navigate(ROUTES.STATUS_TYPE_CREATE)}
            >
              Create Status Type
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="w-full sm:w-80">
          <Input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleSearch()
            }}
            placeholder="Search by status name..."
            leftIcon={<SearchIcon className="h-4 w-4" />}
          />
        </div>
        <Button
          variant="secondary"
          onClick={handleSearch}
          leftIcon={<SearchIcon className="h-4 w-4" />}
        >
          Search
        </Button>
        <Button
          variant="filterClear"
          size="sm"
          onClick={handleClear}
          leftIcon={<X className="h-4 w-4" />}
          disabled={!search && !searchText}
        >
          Clear Filters
        </Button>
      </div>

      <div>
        <Table
          columns={columns}
          rows={page?.content ?? []}
          rowKey={(status) => status.id}
          isLoading={isLoading}
          error={error}
          onRetry={reload}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={(key) => {
            if (key === 'actions' || key === 'color') return
            if (sortBy === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
            else {
              setSortBy(key)
              setSortDir('asc')
            }
          }}
          onRowClick={
            hasPrivilege(PRIV.STATUS_TYPE_UPDATE)
              ? (status) => navigate(ROUTES.STATUS_TYPE_EDIT.replace(':id', status.id))
              : undefined
          }
          emptyTitle="No status types found"
          emptyDescription="Try adjusting your search term."
        />
        <Pagination page={page} onPageChange={setPageNumber} onPageSizeChange={setPageSize} />
      </div>
    </div>
  )
}
